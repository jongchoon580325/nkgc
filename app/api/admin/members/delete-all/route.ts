import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE: Delete all members except admin/master
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        const userRole = session?.user?.role;
        if (!session || (userRole !== 'admin' && userRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete all users except admin, master, super_admin roles
        const result = await prisma.user.deleteMany({
            where: {
                AND: [
                    { username: { notIn: ['admin', 'master'] } },
                    { role: { notIn: ['super_admin', 'admin'] } }
                ]
            }
        });

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `${result.count}명의 회원이 삭제되었습니다.`
        });
    } catch (error) {
        console.error('Delete all members error:', error);
        return NextResponse.json(
            { success: false, error: '회원 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
