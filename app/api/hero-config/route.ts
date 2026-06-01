import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 모든 프리셋 조회
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const configs = await prisma.heroConfig.findMany({
            orderBy: [
                { isActive: 'desc' },
                { updatedAt: 'desc' },
            ],
        });

        return NextResponse.json(configs);
    } catch (error) {
        console.error('Error fetching hero configs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch hero configs' },
            { status: 500 }
        );
    }
}

// 새 프리셋 생성
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 최대 5개 제한 확인
        const count = await prisma.heroConfig.count();
        if (count >= 5) {
            return NextResponse.json(
                { error: 'Maximum 5 presets allowed' },
                { status: 400 }
            );
        }

        const data = await request.json();

        const newConfig = await prisma.heroConfig.create({
            data: {
                name: data.name,
                backgroundImage: data.backgroundImage || null,
                backgroundImageMobile: data.backgroundImageMobile || null,
                animationType: data.animationType || 'static',
                animationSpeed: data.animationSpeed || 'normal',
                hideText: data.hideText || false,
                titleText: data.titleText || null,
                subtitleText: data.subtitleText || null,
                motto1: data.motto1 || null,
                motto2: data.motto2 || null,
                motto3: data.motto3 || null,
                descriptionText: data.descriptionText || null,
                isActive: false, // 기본적으로 비활성화 상태로 생성
            },
        });

        return NextResponse.json(newConfig);
    } catch (error) {
        console.error('Error creating hero config:', error);
        return NextResponse.json(
            { error: 'Failed to create hero config' },
            { status: 500 }
        );
    }
}
