import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 파일 저장 경로 설정 (public/uploads/YYYY/MM)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const uploadDir = join(process.cwd(), 'public', 'uploads', String(year), month);

        // 디렉토리 생성 (없으면 생성)
        await mkdir(uploadDir, { recursive: true });

        // 유니크한 파일명 생성 (Web Crypto API 사용)
        const uniqueSuffix = crypto.randomUUID();
        const originalName = file.name;
        const extension = originalName.split('.').pop();
        const fileName = `${uniqueSuffix}.${extension}`;
        const filePath = join(uploadDir, fileName);

        // 파일 저장
        await writeFile(filePath, buffer);

        // 클라이언트에서 접근 가능한 URL 반환
        const fileUrl = `/uploads/${year}/${month}/${fileName}`;

        return NextResponse.json({
            success: true,
            fileName: originalName,
            fileUrl,
            fileSize: file.size,
            mimeType: file.type
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: '파일 업로드 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
