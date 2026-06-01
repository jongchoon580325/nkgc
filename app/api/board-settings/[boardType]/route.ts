import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/board-settings/[boardType] - 특정 게시판 설정 조회
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ boardType: string }> }
) {
    try {
        const { boardType } = await context.params;

        const settings = await prisma.boardSettings.findUnique({
            where: { boardType: boardType.toUpperCase() },
        });

        if (!settings) {
            // Return default empty settings if not found
            return NextResponse.json({
                boardType: boardType.toUpperCase(),
                categories: [],
                settings: null,
            });
        }

        return NextResponse.json({
            ...settings,
            categories: JSON.parse(settings.categories),
            settings: settings.settings ? JSON.parse(settings.settings) : null,
        });
    } catch (error) {
        console.error('Error fetching board settings:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch board settings',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

// PUT /api/board-settings/[boardType] - 게시판 설정 업데이트
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ boardType: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        const userRole = session?.user?.role;
        if (!session || (userRole !== 'admin' && userRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { boardType } = await context.params;
        const body = await request.json();
        const { categories, settings } = body;

        const boardSettings = await prisma.boardSettings.upsert({
            where: { boardType: boardType.toUpperCase() },
            create: {
                boardType: boardType.toUpperCase(),
                categories: JSON.stringify(categories || []),
                settings: settings ? JSON.stringify(settings) : null,
            },
            update: {
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
        console.error('Error updating board settings:', error);
        return NextResponse.json(
            { error: 'Failed to update board settings' },
            { status: 500 }
        );
    }
}
