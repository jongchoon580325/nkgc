import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) return false;
    return true;
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { title, bank, accountNumber, accountHolder, displayOrder, isActive } = body;

        if (!title || !bank || !accountNumber || !accountHolder) {
            return NextResponse.json(
                { success: false, error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        const account = await prisma.feePaymentAccount.update({
            where: { id: Number(id) },
            data: { title, bank, accountNumber, accountHolder, displayOrder, isActive },
        });

        return NextResponse.json({ success: true, data: account });
    } catch {
        return NextResponse.json(
            { success: false, error: '수정 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.feePaymentAccount.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { success: false, error: '삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
