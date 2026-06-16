import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 결의서 목록 조회
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const tab = searchParams.get('tab')

        if (tab) {
            const resolutions = await prisma.resolution.findMany({
                where: { tabType: tab },
                orderBy: [
                    { displayOrder: 'asc' },
                    { meetingNum: 'asc' }
                ]
            })
            return NextResponse.json({ success: true, data: resolutions })
        }

        const resolutions = await prisma.resolution.findMany({
            orderBy: [
                { tabType: 'asc' },
                { displayOrder: 'asc' },
                { meetingNum: 'asc' }
            ]
        })
        return NextResponse.json({ success: true, data: resolutions })
    } catch (error) {
        console.error('결의서 조회 오류:', error)
        return NextResponse.json(
            { success: false, error: '데이터를 불러올 수 없습니다.' },
            { status: 500 }
        )
    }
}
