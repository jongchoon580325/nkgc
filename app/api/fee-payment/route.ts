import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const accounts = await prisma.feePaymentAccount.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                title: true,
                bank: true,
                accountNumber: true,
                accountHolder: true,
            },
        });

        return NextResponse.json({ success: true, data: accounts });
    } catch {
        return NextResponse.json(
            { success: false, error: '데이터를 불러올 수 없습니다.' },
            { status: 500 }
        );
    }
}
