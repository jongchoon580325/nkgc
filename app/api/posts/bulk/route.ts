
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (userRole !== 'admin' && userRole !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        await prisma.post.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        console.error('Bulk delete error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;

        if (userRole !== 'admin' && userRole !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { ids, targetBoardType } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0 || !targetBoardType) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        await prisma.post.updateMany({
            where: {
                id: {
                    in: ids
                }
            },
            data: {
                boardType: targetBoardType
            }
        });

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        console.error('Bulk move error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
