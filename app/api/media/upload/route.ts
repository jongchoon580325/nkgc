import { NextRequest, NextResponse } from 'next/server';
import { BlobStorageProvider } from '@/lib/services/storage/BlobStorageProvider';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const folderId = formData.get('folderId') as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File too large (Max 10MB)" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        const existing = await prisma.fileAsset.findUnique({ where: { hash } });

        if (existing) {
            return NextResponse.json({
                message: "File exists",
                success: true,
                asset: existing,
                fileUrl: existing.path,
            });
        }

        const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const safeName = `${crypto.randomUUID().slice(0, 8)}-${sanitizedOriginalName}`;

        const storage = new BlobStorageProvider();
        const publicPath = await storage.upload(buffer, safeName, file.type);

        const newAsset = await prisma.fileAsset.create({
            data: {
                filename: file.name,
                storedName: safeName,
                mimeType: file.type,
                size: buffer.length,
                path: publicPath,
                provider: 'blob',
                hash,
                folderId: folderId || null,
            },
        });

        return NextResponse.json({
            success: true,
            asset: newAsset,
            fileUrl: newAsset.path,
        }, { status: 201 });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
