import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: 상비부 정보 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const committeeId = parseInt((await params).id);
        const body = await request.json();
        const { name, headTitle, head, headRole, secretary, secretaryRole, members, term, displayOrder } = body;

        // 필수 항목 검증
        if (!name || !headTitle || !head || !headRole || !secretary || !secretaryRole || !term) {
            return NextResponse.json(
                { success: false, error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        const committee = await prisma.standingCommittee.update({
            where: { id: committeeId },
            data: {
                name,
                headTitle,
                head,
                headRole,
                secretary,
                secretaryRole,
                members: members || '',
                term,
                displayOrder: displayOrder || 999
            }
        });

        return NextResponse.json({
            success: true,
            data: committee,
            message: '상비부 정보가 수정되었습니다.'
        });
    } catch (error) {
        console.error('상비부 수정 오류:', error);
        return NextResponse.json(
            { success: false, error: '상비부 정보 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE: 상비부 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const committeeId = parseInt((await params).id);

        await prisma.standingCommittee.delete({
            where: { id: committeeId }
        });

        return NextResponse.json({
            success: true,
            message: '상비부가 삭제되었습니다.'
        });
    } catch (error) {
        console.error('상비부 삭제 오류:', error);
        return NextResponse.json(
            { success: false, error: '상비부 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
