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

        // Validate file type (MP4 only)
        if (file.type !== 'video/mp4') {
            return NextResponse.json({ error: 'MP4 파일만 업로드 가능합니다.' }, { status: 400 });
        }

        // Validate file size (50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: '파일 크기는 50MB를 초과할 수 없습니다.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 파일 저장 경로 설정 (public/uploads/videos/YYYY/MM)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos', String(year), month);

        // 디렉토리 생성 (없으면 생성)
        await mkdir(uploadDir, { recursive: true });

        // 유니크한 파일명 생성
        const uniqueSuffix = crypto.randomUUID();
        const originalName = file.name;
        // const extension = originalName.split('.').pop(); // Always mp4 based on check, but safer to use original extension or force mp4
        const fileName = `${uniqueSuffix}.mp4`;
        const filePath = join(uploadDir, fileName);

        // 파일 저장
        await writeFile(filePath, buffer);

        // 클라이언트에서 접근 가능한 URL 반환
        const fileUrl = `/uploads/videos/${year}/${month}/${fileName}`;

        return NextResponse.json({
            success: true,
            fileName: originalName,
            fileUrl,
            fileSize: file.size,
            mimeType: file.type
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        return NextResponse.json(
            { error: '동영상 업로드 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
