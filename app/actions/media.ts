'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LocalStorageProvider } from '@/lib/services/storage/LocalStorageProvider';
import { revalidatePath } from 'next/cache';

function isAuthorized(session: any) {
    return session?.user && ['admin', 'super_admin'].includes(session.user.role);
}

export async function bulkDeleteAssets(assetIds: string[]) {
    const session = await getServerSession(authOptions);
    if (!isAuthorized(session)) return { success: false, error: "Unauthorized" };

    try {
        const assets = await prisma.fileAsset.findMany({
            where: { id: { in: assetIds } },
            select: { id: true, path: true }
        });

        const storage = new LocalStorageProvider();

        // Delete physical files
        await Promise.allSettled(assets.map(a => storage.delete(a.path)));

        // Delete DB records
        await prisma.fileAsset.deleteMany({ where: { id: { in: assetIds } } });

        revalidatePath('/admin/media');
        return { success: true, count: assets.length };
    } catch (e) {
        console.error("Delete failed:", e);
        return { success: false, error: "Delete failed" };
    }
}

export async function moveAssets(assetIds: string[], targetFolderId: string | null) {
    const session = await getServerSession(authOptions);
    if (!isAuthorized(session)) return { success: false, error: "Unauthorized" };

    try {
        await prisma.fileAsset.updateMany({
            where: { id: { in: assetIds } },
            data: { folderId: targetFolderId }
        });

        revalidatePath('/admin/media');
        return { success: true };
    } catch (e) {
        console.error("Move failed:", e);
        return { success: false, error: "Move failed" };
    }
}

// Phase 3.5: Metadata Update
export async function updateAssetMetadata(id: string, metadata: { filename?: string, altText?: string, caption?: string, description?: string }) {
    const session = await getServerSession(authOptions);
    if (!isAuthorized(session)) return { success: false, error: "Unauthorized" };

    try {
        const { filename, ...rest } = metadata;

        // TODO: If filename changes, we might want to rename physical file too? 
        // For now, let's keep physical name same and only change display name if needed, 
        // or separate 'displayName' vs 'filename'. 
        // Based on schema, 'filename' is the original name. 'storedName' is physical.
        // Changing 'filename' purely as metadata is fine.

        await prisma.fileAsset.update({
            where: { id },
            data: {
                filename: filename, // Allow renaming display name
                ...rest
            }
        });

        revalidatePath('/admin/media');
        return { success: true };
    } catch (e: any) {
        console.error("Update metadata failed:", e);
        return { success: false, error: e.message || "Update failed" };
    }
}
