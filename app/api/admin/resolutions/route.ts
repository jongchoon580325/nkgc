import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// POST: 결의서 업로드
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

        const formData = await request.formData()
        const file = formData.get('file') as File
        const tabType = formData.get('tabType') as string
        const meetingNum = parseInt(formData.get('meetingNum') as string)
        const meetingType = formData.get('meetingType') as string
        const sessionNum = formData.get('sessionNum') ? parseInt(formData.get('sessionNum') as string) : null
        const title = formData.get('title') as string

        console.log('Upload request:', { tabType, meetingNum, meetingType, sessionNum, title, fileName: file?.name })

        if (!file || !tabType || !meetingNum || !title || !meetingType) {
            return NextResponse.json(
                { success: false, error: '필수 항목이 누락되었습니다.' },
                { status: 400 }
            )
        }

        // 파일 타입 확인
        const fileType = file.type.startsWith('image/') ? 'IMAGE' : 'PDF'
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: '지원하지 않는 파일 형식입니다.' },
                { status: 400 }
            )
        }

        // 파일명 생성 (timestamp + original name)
        const timestamp = Date.now()
        const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileName = `${timestamp}_${originalName}`

        // 탭별 폴더 결정
        const tabFolder =
            tabType === '1-20' ? 'tab1' :
                tabType === '21-40' ? 'tab2' :
                    tabType === '41-60' ? 'tab3' : 'tab4'
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resolutions', tabFolder)
        const filePath = path.join(uploadDir, fileName)
        const fileUrl = `/uploads/resolutions/${tabFolder}/${fileName}`

        // 디렉토리가 없으면 생성
        if (!existsSync(uploadDir)) {
            console.log('Creating directory:', uploadDir)
            await mkdir(uploadDir, { recursive: true })
        }

        // 파일 저장
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)
        console.log('File saved:', filePath)

        // DB에 저장
        const resolution = await prisma.resolution.create({
            data: {
                tabType,
                meetingNum,
                sessionNum,
                meetingType,
                title,
                fileType,
                fileName,
                fileUrl,
                displayOrder: meetingNum
            }
        })

        console.log('Resolution created:', resolution.id)
        return NextResponse.json({ success: true, data: resolution })
    } catch (error) {
        console.error('결의서 업로드 오류:', error)
        return NextResponse.json(
            { success: false, error: '업로드 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}

// PUT: 결의서 수정
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // 관리자 권한 확인
        if (!session || !['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json(
                { success: false, error: '권한이 없습니다.' },
                { status: 403 }
            )
        }

        const formData = await request.formData()
        const id = parseInt(formData.get('id') as string)
        const meetingNum = parseInt(formData.get('meetingNum') as string)
        const meetingType = formData.get('meetingType') as string
        const sessionNum = formData.get('sessionNum') ? parseInt(formData.get('sessionNum') as string) : null
        const title = formData.get('title') as string
        const file = formData.get('file') as File | null

        if (!id || !meetingNum || !title || !meetingType) {
            return NextResponse.json(
                { success: false, error: '필수 항목이 누락되었습니다.' },
                { status: 400 }
            )
        }

        // 기존 데이터 조회
        const existingResolution = await prisma.resolution.findUnique({ where: { id } })
        if (!existingResolution) {
            return NextResponse.json(
                { success: false, error: '결의서를 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        let updateData: any = {
            meetingNum,
            sessionNum,
            meetingType,
            title,
            displayOrder: meetingNum
        }

        // 파일이 새로 업로드된 경우
        if (file && file.size > 0) {
            // 파일 타입 확인
            const fileType = file.type.startsWith('image/') ? 'IMAGE' : 'PDF'
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { success: false, error: '지원하지 않는 파일 형식입니다.' },
                    { status: 400 }
                )
            }

            // 기존 파일 삭제
            const oldFilePath = path.join(process.cwd(), 'public', existingResolution.fileUrl)
            try {
                await unlink(oldFilePath)
            } catch (error) {
                console.error('기존 파일 삭제 실패:', error)
            }

            // 새 파일 저장
            const timestamp = Date.now()
            const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
            const fileName = `${timestamp}_${originalName}`

            const tabFolder =
                existingResolution.tabType === '1-20' ? 'tab1' :
                    existingResolution.tabType === '21-40' ? 'tab2' :
                        existingResolution.tabType === '41-60' ? 'tab3' : 'tab4'
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resolutions', tabFolder)
            const filePath = path.join(uploadDir, fileName)
            const fileUrl = `/uploads/resolutions/${tabFolder}/${fileName}`

            // 디렉토리가 없으면 생성
            if (!existsSync(uploadDir)) {
                console.log('Creating directory:', uploadDir)
                await mkdir(uploadDir, { recursive: true })
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            await writeFile(filePath, buffer)

            updateData.fileType = fileType
            updateData.fileName = fileName
            updateData.fileUrl = fileUrl
        }

        // DB 업데이트
        const resolution = await prisma.resolution.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({ success: true, data: resolution })
    } catch (error) {
        console.error('결의서 수정 오류:', error)
        return NextResponse.json(
            { success: false, error: '수정 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}

// DELETE: 결의서 삭제
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // 관리자 권한 확인
        if (!session || !['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json(
                { success: false, error: '권한이 없습니다.' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = parseInt(searchParams.get('id') || '0')

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID가 필요합니다.' },
                { status: 400 }
            )
        }

        // DB에서 파일 정보 조회
        const resolution = await prisma.resolution.findUnique({ where: { id } })
        if (!resolution) {
            return NextResponse.json(
                { success: false, error: '결의서를 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        // 파일 삭제
        const filePath = path.join(process.cwd(), 'public', resolution.fileUrl)
        try {
            await unlink(filePath)
        } catch (error) {
            console.error('파일 삭제 실패:', error)
        }

        // DB에서 삭제
        await prisma.resolution.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('결의서 삭제 오류:', error)
        return NextResponse.json(
            { success: false, error: '삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
