import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: 별명부 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id);
        const body = await request.json();
        const {
            name,
            position,
            birthDate,
            registrationDate,
            registrationReason,
            cancellationDate,
            cancellationReason
        } = body;

        const registry = await prisma.separateRegistry.update({
            where: { id },
            data: {
                name,
                position,
                birthDate,
                registrationDate,
                registrationReason,
                cancellationDate,
                cancellationReason
            }
        });

        return NextResponse.json({
            success: true,
            data: registry
        });
    } catch (error) {
        console.error('별명부 수정 오류:', error);
        return NextResponse.json(
            { success: false, error: '수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE: 별명부 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id);

        await prisma.separateRegistry.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: '삭제되었습니다.'
        });
    } catch (error) {
        console.error('별명부 삭제 오류:', error);
        return NextResponse.json(
            { success: false, error: '삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
