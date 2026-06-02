import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json(
        {
            error: 'Restore not available in this environment.',
            message: 'DB 복원은 Neon 대시보드에서, 파일 복원은 Vercel Blob에서 관리하세요.',
        },
        { status: 503 }
    );
}
