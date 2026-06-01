import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

// GET: 규칙 목록 조회
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get('type')


        if (type) {
            const rule = await prisma.rule.findUnique({
                where: { type }
            })
            return NextResponse.json({ success: true, data: rule })
        }

        const rules = await prisma.rule.findMany()
        return NextResponse.json({ success: true, data: rules })
    } catch (error) {
        console.error('규칙 조회 오류:', error)
        return NextResponse.json(
            { success: false, error: '데이터를 불러올 수 없습니다.' },
            { status: 500 }
        )
    }
}

// POST: 규칙 생성 또는 수정 (Upsert)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // 관리자 권한 확인
        if (!session || !['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json(
                { success: false, error: '권한이 없습니다.' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { type, content } = body


        if (!type || !content) {
            return NextResponse.json(
                { success: false, error: '필수 항목이 누락되었습니다.' },
                { status: 400 }
            )
        }



        const rule = await prisma.rule.upsert({
            where: { type },
            update: { content },
            create: { type, content }
        })


        // Cache Invalidation
        revalidatePath('/admin/rules')
        revalidatePath('/resources/rules')
        revalidatePath('/api/admin/rules')

        return NextResponse.json({ success: true, data: rule })
    } catch (error) {
        console.error('규칙 저장 오류:', error)
        return NextResponse.json(
            { success: false, error: '저장 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
