import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const block = await prisma.contentBlock.findUnique({ where: { key: 'inspections' } })
        if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(block.value)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read inspections data' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Data must be an array of inspections' }, { status: 400 })
        }
        for (const inspection of body) {
            if (!inspection.id || !inspection.name || !inspection.leader || !inspection.secretary || !Array.isArray(inspection.churches)) {
                return NextResponse.json({ error: 'Invalid inspection data structure' }, { status: 400 })
            }
        }
        await prisma.contentBlock.upsert({
            where:  { key: 'inspections' },
            update: { value: body },
            create: { key: 'inspections', value: body },
        })
        return NextResponse.json({ success: true, data: body })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update inspections data' }, { status: 500 })
    }
}
