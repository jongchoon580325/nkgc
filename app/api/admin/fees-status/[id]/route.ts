import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: 상회비 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id);
        const body = await request.json();
        const {
            inspection,
            churchName,
            pastorName,
            monthlyFee,
            annualFee
        } = body;

        const fee = await prisma.feeStatus.update({
            where: { id },
            data: {
                inspection,
                churchName,
                pastorName,
                monthlyFee: parseInt(monthlyFee),
                annualFee: parseInt(annualFee)
            }
        });

        return NextResponse.json({
            success: true,
            data: fee
        });
    } catch (error) {
        console.error('상회비 수정 오류:', error);
        return NextResponse.json(
            { success: false, error: '수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE: 상회비 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id);

        await prisma.feeStatus.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: '삭제되었습니다.'
        });
    } catch (error) {
        console.error('상회비 삭제 오류:', error);
        return NextResponse.json(
            { success: false, error: '삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
