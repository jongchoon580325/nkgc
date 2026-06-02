import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        // 새 Blob URL (https://...) -> 직접 redirect
        if (attachment.fileUrl.startsWith('https://')) {
            return NextResponse.redirect(attachment.fileUrl);
        }

        // 레거시 public 경로는 서버 함수에서 읽지 않는다.
        // fs.readFile(public/...)는 Vercel trace가 public 전체를 함수 번들에 포함하게 만든다.
        const publicUrl = attachment.fileUrl.startsWith('/')
            ? attachment.fileUrl
            : `/${attachment.fileUrl}`;

        return NextResponse.redirect(new URL(publicUrl, request.url));
    } catch (error) {
        console.error('Error downloading attachment:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
