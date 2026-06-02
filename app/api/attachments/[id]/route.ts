import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

const MIME_TYPES: Record<string, string> = {
    '.hwp':  'application/x-hwp',
    '.pdf':  'application/pdf',
    '.doc':  'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls':  'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.zip':  'application/zip',
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(id) },
        });

        if (!attachment) {
            return new NextResponse('Attachment not found', { status: 404 });
        }

        // 새 Blob URL (https://...) → 직접 redirect
        if (attachment.fileUrl.startsWith('https://')) {
            return NextResponse.redirect(attachment.fileUrl);
        }

        // 레거시 로컬 경로 (/wp-content/..., /uploads/...) → 로컬 파일 서빙
        const publicPath = path.join(process.cwd(), 'public', attachment.fileUrl);
        try {
            await fs.access(publicPath);
            const fileBuffer = await fs.readFile(publicPath);
            const ext = path.extname(attachment.fileName).toLowerCase();
            const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

            return new NextResponse(fileBuffer, {
                status: 200,
                headers: {
                    'Content-Type': mimeType,
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
                    'Content-Length': fileBuffer.length.toString(),
                },
            });
        } catch {
            return new NextResponse(
                `파일을 찾을 수 없습니다. 관리자에게 문의하세요.\n\n경로: ${attachment.fileUrl}\n파일명: ${attachment.fileName}`,
                { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }
    } catch (error) {
        console.error('Error downloading attachment:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
