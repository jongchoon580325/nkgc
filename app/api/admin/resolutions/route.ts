import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put, del } from '@vercel/blob'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

function blobPath(tabType: string, fileName: string) {
    const tabFolder =
        tabType === '1-20'  ? 'tab1' :
        tabType === '21-40' ? 'tab2' :
        tabType === '41-60' ? 'tab3' : 'tab4'
    return `resolutions/${tabFolder}/${fileName}`
}

// POST: 결의서 업로드
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        const formData = await request.formData()
        const file      = formData.get('file') as File
        const tabType   = formData.get('tabType') as string
        const meetingNum  = parseInt(formData.get('meetingNum') as string)
        const meetingType = formData.get('meetingType') as string
        const sessionNum  = formData.get('sessionNum') ? parseInt(formData.get('sessionNum') as string) : null
        const title     = formData.get('title') as string

        if (!file || !tabType || !meetingNum || !title || !meetingType) {
            return NextResponse.json({ success: false, error: '필수 항목이 누락되었습니다.' }, { status: 400 })
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ success: false, error: '지원하지 않는 파일 형식입니다.' }, { status: 400 })
        }

        const fileType    = file.type.startsWith('image/') ? 'IMAGE' : 'PDF'
        const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileName    = `${Date.now()}_${originalName}`
        const pathname    = blobPath(tabType, fileName)

        const { url: fileUrl } = await put(pathname, file, { access: 'public', contentType: file.type })

        const resolution = await prisma.resolution.create({
            data: { tabType, meetingNum, sessionNum, meetingType, title, fileType, fileName, fileUrl, displayOrder: meetingNum }
        })

        return NextResponse.json({ success: true, data: resolution })
    } catch (error) {
        console.error('결의서 업로드 오류:', error)
        return NextResponse.json({ success: false, error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
    }
}

// PUT: 결의서 수정
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        const formData    = await request.formData()
        const id          = parseInt(formData.get('id') as string)
        const meetingNum  = parseInt(formData.get('meetingNum') as string)
        const meetingType = formData.get('meetingType') as string
        const sessionNum  = formData.get('sessionNum') ? parseInt(formData.get('sessionNum') as string) : null
        const title       = formData.get('title') as string
        const file        = formData.get('file') as File | null

        if (!id || !meetingNum || !title || !meetingType) {
            return NextResponse.json({ success: false, error: '필수 항목이 누락되었습니다.' }, { status: 400 })
        }

        const existing = await prisma.resolution.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ success: false, error: '결의서를 찾을 수 없습니다.' }, { status: 404 })
        }

        const updateData: Record<string, unknown> = { meetingNum, sessionNum, meetingType, title, displayOrder: meetingNum }

        if (file && file.size > 0) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json({ success: false, error: '지원하지 않는 파일 형식입니다.' }, { status: 400 })
            }

            // 기존 Blob 파일 삭제 (Blob URL인 경우만)
            if (existing.fileUrl.startsWith('https://')) {
                try { await del(existing.fileUrl) } catch { /* ignore */ }
            }

            const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
            const fileName     = `${Date.now()}_${originalName}`
            const pathname     = blobPath(existing.tabType, fileName)
            const { url: fileUrl } = await put(pathname, file, { access: 'public', contentType: file.type })

            updateData.fileType = file.type.startsWith('image/') ? 'IMAGE' : 'PDF'
            updateData.fileName = fileName
            updateData.fileUrl  = fileUrl
        }

        const resolution = await prisma.resolution.update({ where: { id }, data: updateData })
        return NextResponse.json({ success: true, data: resolution })
    } catch (error) {
        console.error('결의서 수정 오류:', error)
        return NextResponse.json({ success: false, error: '수정 중 오류가 발생했습니다.' }, { status: 500 })
    }
}

// DELETE: 결의서 삭제
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = parseInt(searchParams.get('id') || '0')
        if (!id) {
            return NextResponse.json({ success: false, error: 'ID가 필요합니다.' }, { status: 400 })
        }

        const resolution = await prisma.resolution.findUnique({ where: { id } })
        if (!resolution) {
            return NextResponse.json({ success: false, error: '결의서를 찾을 수 없습니다.' }, { status: 404 })
        }

        if (resolution.fileUrl.startsWith('https://')) {
            try { await del(resolution.fileUrl) } catch { /* ignore */ }
        }

        await prisma.resolution.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('결의서 삭제 오류:', error)
        return NextResponse.json({ success: false, error: '삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
