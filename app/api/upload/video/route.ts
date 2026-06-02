import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
        }

        if (file.type !== 'video/mp4') {
            return NextResponse.json({ error: 'MP4 파일만 업로드 가능합니다.' }, { status: 400 });
        }

        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: '파일 크기는 50MB를 초과할 수 없습니다.' }, { status: 400 });
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const uniqueSuffix = crypto.randomUUID();
        const fileName = `${uniqueSuffix}.mp4`;
        const pathname = `uploads/videos/${year}/${month}/${fileName}`;

        const { url } = await put(pathname, file, {
            access: 'public',
            contentType: 'video/mp4',
        });

        return NextResponse.json({
            success: true,
            fileName: file.name,
            fileUrl: url,
            fileSize: file.size,
            mimeType: file.type,
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        return NextResponse.json(
            { error: '동영상 업로드 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
