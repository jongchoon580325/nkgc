import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/board-settings - 모든 게시판 설정 조회
export async function GET(request: NextRequest) {
    try {
        const settings = await prisma.boardSettings.findMany({
            orderBy: {
                boardType: 'asc',
            },
        });

        // Parse JSON categories
        const parsedSettings = settings.map(s => ({
            ...s,
            categories: JSON.parse(s.categories),
            settings: s.settings ? JSON.parse(s.settings) : null,
        }));

        return NextResponse.json(parsedSettings);
    } catch (error) {
        console.error('Error fetching board settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch board settings' },
            { status: 500 }
        );
    }
}

// POST /api/board-settings - 새 게시판 설정 생성
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        const userRole = session?.user?.role;
        if (!session || (userRole !== 'admin' && userRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { boardType, categories, settings } = body;

        if (!boardType) {
            return NextResponse.json({ error: 'boardType is required' }, { status: 400 });
        }

        const boardSettings = await prisma.boardSettings.create({
            data: {
                boardType,
                categories: JSON.stringify(categories || []),
                settings: settings ? JSON.stringify(settings) : null,
            },
        });

        return NextResponse.json({
            ...boardSettings,
            categories: JSON.parse(boardSettings.categories),
            settings: boardSettings.settings ? JSON.parse(boardSettings.settings) : null,
        });
    } catch (error) {
        console.error('Error creating board settings:', error);
        return NextResponse.json(
            { error: 'Failed to create board settings' },
            { status: 500 }
        );
    }
}
