import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const isActiveOnly = searchParams.get('active') === 'true';

        const where: Prisma.PopupWhereInput = {};

        if (isActiveOnly) {
            const now = new Date();
            where.isActive = true;
            where.startAt = { lte: now };
            where.endAt = { gte: now };
        }

        const popups = await prisma.popup.findMany({
            where,
            orderBy: [
                { priority: 'desc' },
                { id: 'desc' }
            ],
        });

        return NextResponse.json({ popups });
    } catch (error) {
        console.error('Error fetching popups:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !['admin', 'super_admin'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, contentHtml, imageUrl, linkUrl, startAt, endAt, priority, isActive, width, height, positionX, positionY } = body;

        const popup = await prisma.popup.create({
            data: {
                title,
                contentHtml,
                imageUrl,
                linkUrl,
                startAt: new Date(startAt),
                endAt: new Date(endAt),
                priority: parseInt(priority) || 0,
                isActive: isActive ?? true,
                width: parseInt(width) || 400,
                height: parseInt(height) || 500,
                positionX: positionX !== '' && positionX !== null ? parseInt(positionX) : null,
                positionY: positionY !== '' && positionY !== null ? parseInt(positionY) : null,
            },
        });

        return NextResponse.json({ success: true, popup });
    } catch (error) {
        console.error('Error creating popup:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !['admin', 'super_admin'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, title, contentHtml, imageUrl, linkUrl, startAt, endAt, priority, isActive, width, height, positionX, positionY } = body;

        const popup = await prisma.popup.update({
            where: { id: parseInt(id) },
            data: {
                title,
                contentHtml,
                imageUrl,
                linkUrl,
                startAt: new Date(startAt),
                endAt: new Date(endAt),
                priority: parseInt(priority) || 0,
                isActive: isActive,
                width: parseInt(width) || 400,
                height: parseInt(height) || 500,
                positionX: positionX !== '' && positionX !== null ? parseInt(positionX) : null,
                positionY: positionY !== '' && positionY !== null ? parseInt(positionY) : null,
            },
        });

        return NextResponse.json({ success: true, popup });
    } catch (error) {
        console.error('Error updating popup:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !['admin', 'super_admin'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.popup.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting popup:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
