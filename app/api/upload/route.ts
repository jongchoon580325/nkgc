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

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const uniqueSuffix = crypto.randomUUID();
        const extension = file.name.split('.').pop();
        const fileName = `${uniqueSuffix}.${extension}`;
        const pathname = `uploads/${year}/${month}/${fileName}`;

        const { url } = await put(pathname, file, {
            access: 'public',
            contentType: file.type,
        });

        return NextResponse.json({
            success: true,
            fileName: file.name,
            fileUrl: url,
            fileSize: file.size,
            mimeType: file.type,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: '파일 업로드 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
