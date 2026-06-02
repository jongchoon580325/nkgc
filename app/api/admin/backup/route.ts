import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        {
            error: 'Backup not available in this environment.',
            message: 'DB 백업은 Neon 대시보드에서, 파일 백업은 Vercel Blob에서 관리하세요.',
        },
        { status: 503 }
    );
}
