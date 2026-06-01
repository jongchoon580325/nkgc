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

