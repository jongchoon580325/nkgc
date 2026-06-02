import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const block = await prisma.contentBlock.findUnique({ where: { key: 'contact_info' } })
        if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(block.value)
    } catch (error) {
        console.error('Error reading contact info:', error)
        return NextResponse.json({ error: 'Failed to load contact info' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        if (!data.secretary || !data.president || !data.address || !data.email) {
            return NextResponse.json({ error: 'Invalid data structure' }, { status: 400 })
        }
        await prisma.contentBlock.upsert({
            where:  { key: 'contact_info' },
            update: { value: data },
            create: { key: 'contact_info', value: data },
        })
        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Error updating contact info:', error)
        return NextResponse.json({ error: 'Failed to update contact info' }, { status: 500 })
    }
}
