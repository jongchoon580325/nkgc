import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const block = await prisma.contentBlock.findUnique({ where: { key: 'officers' } })
        if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(block.value)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read officers data' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        if (!body.term || !Array.isArray(body.officers)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        await prisma.contentBlock.upsert({
            where:  { key: 'officers' },
            update: { value: body },
            create: { key: 'officers', value: body },
        })
        return NextResponse.json({ success: true, data: body })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update officers data' }, { status: 500 })
    }
}
