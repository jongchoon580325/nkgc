import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const body = (await req.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                return {
                    allowedContentTypes: [
                        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                        'image/webp', 'image/svg+xml',
                        'video/mp4', 'video/webm', 'video/ogg',
                        'application/pdf',
                    ],
                    maximumSizeInBytes: 50 * 1024 * 1024,
                    addRandomSuffix: true,
                    tokenPayload: clientPayload,
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                const parsed = tokenPayload ? JSON.parse(tokenPayload) : {};
                const { folderId = null, size = 0 } = parsed;

                const filename = blob.pathname.split('/').pop() || blob.pathname;
                const hash = crypto.createHash('sha256').update(blob.url).digest('hex');

                const existing = await prisma.fileAsset.findFirst({ where: { path: blob.url } });
                if (existing) return;

                await prisma.fileAsset.create({
                    data: {
                        filename,
                        storedName: blob.pathname,
                        mimeType: blob.contentType,
                        size: size ?? 0,
                        path: blob.url,
                        provider: 'blob',
                        hash,
                        folderId: folderId || null,
                    },
                });
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 400 });
    }
}
