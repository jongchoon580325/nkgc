import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ContactInfo, DEFAULT_CONTACT_INFO, normalizeContactInfo } from '@/lib/contact-info'
import { Prisma } from '@prisma/client'

export async function GET() {
    try {
        const block = await prisma.contentBlock.findUnique({ where: { key: 'contact_info' } })
        if (!block) return NextResponse.json(DEFAULT_CONTACT_INFO)
        return NextResponse.json(normalizeContactInfo(block.value as unknown as Partial<ContactInfo>))
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
        const normalized = normalizeContactInfo(data)
        const value = normalized as unknown as Prisma.InputJsonObject
        await prisma.contentBlock.upsert({
            where:  { key: 'contact_info' },
            update: { value },
            create: { key: 'contact_info', value },
        })
        return NextResponse.json({ success: true, data: normalized })
    } catch (error) {
        console.error('Error updating contact info:', error)
        return NextResponse.json({ error: 'Failed to update contact info' }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        await prisma.contentBlock.deleteMany({ where: { key: 'contact_info' } })
        return NextResponse.json({ success: true, data: DEFAULT_CONTACT_INFO })
    } catch (error) {
        console.error('Error deleting contact info:', error)
        return NextResponse.json({ error: 'Failed to delete contact info' }, { status: 500 })
    }
}
