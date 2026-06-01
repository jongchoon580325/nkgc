import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 개별 프리셋 수정
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await request.json();

        const updatedConfig = await prisma.heroConfig.update({
            where: { id: parseInt(id) },
            data: {
                name: data.name,
                backgroundImage: data.backgroundImage || null,
                backgroundImageMobile: data.backgroundImageMobile || null,
                animationType: data.animationType,
                animationSpeed: data.animationSpeed || 'normal',
                hideText: data.hideText ?? false,
                titleText: data.titleText || null,
                subtitleText: data.subtitleText || null,
                motto1: data.motto1 || null,
                motto2: data.motto2 || null,
                motto3: data.motto3 || null,
                descriptionText: data.descriptionText || null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
        });

        return NextResponse.json(updatedConfig);
    } catch (error) {
        console.error('Error updating hero config:', error);
        return NextResponse.json(
            { error: 'Failed to update hero config' },
            { status: 500 }
        );
    }
}

// 프리셋 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // 활성화된 프리셋은 삭제 불가
        const config = await prisma.heroConfig.findUnique({
            where: { id: parseInt(id) },
        });

        if (config?.isActive) {
            return NextResponse.json(
                { error: 'Cannot delete active preset' },
                { status: 400 }
            );
        }

        await prisma.heroConfig.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting hero config:', error);
        return NextResponse.json(
            { error: 'Failed to delete hero config' },
            { status: 500 }
        );
    }
}
