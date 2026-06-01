'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LocalStorageProvider } from '@/lib/services/storage/LocalStorageProvider';

function isAuthorized(session: any) {
    return session?.user && ['admin', 'super_admin'].includes(session.user.role);
}

export async function createFolder(name: string, parentId: string | null = null) {
    const session = await getServerSession(authOptions);
    if (!isAuthorized(session)) return { success: false, error: "Unauthorized" };

    try {
        const folder = await prisma.mediaFolder.create({
            data: {
                name,
                parentId: parentId || null
            }
        });
        return { success: true, folder };
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: "Duplicate folder name" };
        return { success: false, error: "Failed to create folder" };
    }
}

export async function getFolderContents(folderId: string | null = null) {
    const session = await getServerSession(authOptions);
    if (!isAuthorized(session)) return { success: false, error: "Unauthorized" };

    // 1. Get current folder info (for breadcrumbs) - Simplified for now
    // Ideally use recursive query or path storage. For MVP/3.5, recursive is fine for shallow trees.

    const folders = await prisma.mediaFolder.findMany({
        where: { parentId: folderId || null },
        orderBy: { name: 'asc' }
    });

    const assets = await prisma.fileAsset.findMany({
        where: { folderId: folderId || null },
        orderBy: { uploadedAt: 'desc' }
    });

    // Breadcrumbs Generator
    const breadcrumbs = [];
    let currentId = folderId;
    while (currentId) {
        const f = await prisma.mediaFolder.findUnique({ where: { id: currentId } });
        if (f) {
            breadcrumbs.unshift({ id: f.id, name: f.name });
            currentId = f.parentId;
        } else {
            break;
        }
    }

    return { folders, assets, breadcrumbs };
}

// Phase 3.5: Get All Folders for Tree View
export async function getAllFolders() {
    const session = await getServerSession(authOptions);
    if (!isAuthorized(session)) return { success: false, error: "Unauthorized" };

    try {
        const folders = await prisma.mediaFolder.findMany({
            orderBy: { name: 'asc' }
        });

        // Construct tree? Client side construction is easier if list is small (~100s).
        // Return flat list, let client build tree or filter.
        return { success: true, folders };
    } catch (e) {
        return { success: false, error: "Failed to fetch folders" };
    }
}
// Recursive folder deletion
export async function deleteFolders(folderIds: string[]) {
    const session = await getServerSession(authOptions);
    if (!isAuthorized(session)) return { success: false, error: "Unauthorized" };

    try {
        // 1. Find all descendant assets to delete physical files
        // We need to implement a way to find all assets in this folder and subfolders.
        // For MVP/3.5, let's just delete assets in the *immediate* folders selected, 
        // AND rely on Prisma Cascade for subfolders? 
        // NO, Prisma Cascade deletes DB records but leaves orphaned physical files.
        // We MUST find all descendant folders first.

        // Fetch all folders to build hierarchy (or recursive CTE if raw SQL, but let's stick to Prisma loop for now)
        const allFolders = await prisma.mediaFolder.findMany({ select: { id: true, parentId: true } });

        const getDescendantIds = (rootIds: string[]) => {
            const descendants = new Set<string>(rootIds);
            const queue = [...rootIds];
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                const children = allFolders.filter(f => f.parentId === currentId).map(f => f.id);
                for (const childId of children) {
                    if (!descendants.has(childId)) {
                        descendants.add(childId);
                        queue.push(childId);
                    }
                }
            }
            return Array.from(descendants);
        };

        const targetFolderIds = getDescendantIds(folderIds);

        // 2. Find all assets in these folders
        const assetsToDelete = await prisma.fileAsset.findMany({
            where: { folderId: { in: targetFolderIds } },
            select: { id: true, path: true }
        });

        // 3. Delete physical files
        const storage = new LocalStorageProvider();
        await Promise.allSettled(assetsToDelete.map((a: any) => storage.delete(a.path)));

        // 4. Delete Folders (Cascade will handle DB assets and subfolders automatically if set up, 
        // but we already identified all relevant folders. 
        // Deleting the root folders in the selection is enough if Cascade is on.
        // Let's check Schema: parent MediaFolder @relation(..., onDelete: Cascade). 
        // So deleting top-level selected folders is enough to clear DB records.)

        // However, Prisma 'SetNull' on assets means assets might become orphaned in DB if we don't delete them first.
        // So we MUST delete assets explicitly.

        await prisma.fileAsset.deleteMany({
            where: { id: { in: assetsToDelete.map(a => a.id) } }
        });

        await prisma.mediaFolder.deleteMany({
            where: { id: { in: folderIds } }
        });

        return { success: true, count: folderIds.length };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Failed to delete folders" };
    }
}
