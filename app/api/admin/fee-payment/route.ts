import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) return false;
    return true;
}

export async function GET() {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const accounts = await prisma.feePaymentAccount.findMany({
            orderBy: { displayOrder: 'asc' },
        });
        return NextResponse.json({ success: true, data: accounts });
    } catch {
        return NextResponse.json(
            { success: false, error: '데이터를 불러올 수 없습니다.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, bank, accountNumber, accountHolder, displayOrder, isActive } = body;

        if (!title || !bank || !accountNumber || !accountHolder) {
            return NextResponse.json(
                { success: false, error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        const account = await prisma.feePaymentAccount.create({
            data: {
                title,
                bank,
                accountNumber,
                accountHolder,
                displayOrder: displayOrder ?? 0,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json({ success: true, data: account });
    } catch {
        return NextResponse.json(
            { success: false, error: '저장 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
