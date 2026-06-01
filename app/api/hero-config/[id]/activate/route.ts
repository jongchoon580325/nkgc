import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 프리셋 활성화
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const targetId = parseInt(id);

        // 트랜잭션으로 처리: 모든 프리셋 비활성화 후 선택한 것만 활성화
        await prisma.$transaction([
            // 모든 프리셋 비활성화
            prisma.heroConfig.updateMany({
                where: {},
                data: { isActive: false },
            }),
            // 선택한 프리셋 활성화
            prisma.heroConfig.update({
                where: { id: targetId },
                data: { isActive: true },
            }),
        ]);

        const activatedConfig = await prisma.heroConfig.findUnique({
            where: { id: targetId },
        });

        return NextResponse.json(activatedConfig);
    } catch (error) {
        console.error('Error activating hero config:', error);
        return NextResponse.json(
            { error: 'Failed to activate hero config' },
            { status: 500 }
        );
    }
}
