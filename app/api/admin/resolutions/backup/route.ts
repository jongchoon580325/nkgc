import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/resolutions/backup?format=json
// 전체 결의서 데이터를 JSON 파일로 내보내기 (브라우저 다운로드)
//
// 응답: Content-Disposition: attachment 헤더로 JSON Blob 반환
// 구조: { exportedAt, count, data: Resolution[] }
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
        }

        const resolutions = await prisma.resolution.findMany({
            orderBy: [
                { tabType: 'asc' },
                { displayOrder: 'asc' },
                { meetingNum: 'asc' }
            ]
        })

        const exportData = {
            exportedAt: new Date().toISOString(),
            count: resolutions.length,
            data: resolutions
        }

        const json = JSON.stringify(exportData, null, 2)
        const dateStr = new Date().toISOString().split('T')[0]

        return new NextResponse(json, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="resolutions_export_${dateStr}.json"`
            }
        })
    } catch (error) {
        console.error('결의서 내보내기 오류:', error)
        return NextResponse.json({ error: '내보내기 중 오류가 발생했습니다.' }, { status: 500 })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/resolutions/backup
// JSON 파일을 가져와 DB에 반영
//
// FormData:
//   file : 내보내기로 생성한 JSON 파일
//   mode : 'merge' | 'overwrite'
//
// merge    — fileUrl 기준으로 중복 여부 판단, 새 항목만 추가
// overwrite — 기존 전체 삭제 후 JSON 데이터로 재삽입
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const mode = (formData.get('mode') as string) || 'merge'

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
        }

        // JSON 파싱
        const text = await file.text()
        let parsed: unknown
        try {
            parsed = JSON.parse(text)
        } catch {
            return NextResponse.json({ error: '유효하지 않은 JSON 파일입니다.' }, { status: 400 })
        }

        // { data: [...] } 형식과 순수 배열 형식 모두 지원
        const records: Record<string, unknown>[] = Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as Record<string, unknown>).data)
                ? (parsed as { data: Record<string, unknown>[] }).data
                : []

        if (records.length === 0) {
            return NextResponse.json({ error: '가져올 데이터가 없습니다.' }, { status: 400 })
        }

        // 필수 필드 검증
        const requiredFields = ['tabType', 'meetingNum', 'meetingType', 'title', 'fileType', 'fileName', 'fileUrl']
        const isValid = records.every(r => requiredFields.every(f => f in r && r[f] !== undefined))
        if (!isValid) {
            return NextResponse.json({ error: '데이터 형식이 올바르지 않습니다. (필수 필드 누락)' }, { status: 400 })
        }

        // DB에 저장할 형태로 정규화
        const normalize = (r: Record<string, unknown>) => ({
            tabType:      String(r.tabType),
            meetingNum:   Number(r.meetingNum),
            sessionNum:   r.sessionNum != null ? Number(r.sessionNum) : null,
            meetingType:  String(r.meetingType),
            title:        String(r.title),
            fileType:     String(r.fileType),
            fileName:     String(r.fileName),
            fileUrl:      String(r.fileUrl),
            displayOrder: r.displayOrder != null ? Number(r.displayOrder) : Number(r.meetingNum)
        })

        if (mode === 'overwrite') {
            // 기존 전체 삭제 후 재삽입 (트랜잭션)
            await prisma.$transaction([
                prisma.resolution.deleteMany(),
                prisma.resolution.createMany({ data: records.map(normalize) })
            ])

            return NextResponse.json({
                success: true,
                message: `기존 데이터를 삭제하고 ${records.length}개 결의서를 가져왔습니다.`
            })
        } else {
            // merge: fileUrl 기준 중복 제거 후 신규 항목만 추가
            const existing = await prisma.resolution.findMany({ select: { fileUrl: true } })
            const existingUrls = new Set(existing.map(r => r.fileUrl))

            const newRecords = records.filter(r => !existingUrls.has(String(r.fileUrl)))
            const skipped = records.length - newRecords.length

            if (newRecords.length > 0) {
                await prisma.resolution.createMany({ data: newRecords.map(normalize) })
            }

            return NextResponse.json({
                success: true,
                message: skipped > 0
                    ? `${newRecords.length}개 결의서를 추가했습니다. (${skipped}개 중복 건너뜀)`
                    : `${newRecords.length}개 결의서를 추가했습니다.`
            })
        }
    } catch (error) {
        console.error('결의서 가져오기 오류:', error)
        return NextResponse.json({ error: '가져오기 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
