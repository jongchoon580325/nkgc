import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        const block = await prisma.contentBlock.findUnique({ where: { key: 'organizations' } })
        if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const data = block.value as { organizations: any[] }

        if (id) {
            const organization = data.organizations.find((org: any) => org.id === id)
            if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
            return NextResponse.json(organization)
        }

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read organizations data' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const updatedOrg = await request.json()
        const block = await prisma.contentBlock.findUnique({ where: { key: 'organizations' } })
        if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const data = block.value as { organizations: any[] }
        const index = data.organizations.findIndex((org: any) => org.id === updatedOrg.id)
        if (index === -1) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

        data.organizations[index] = updatedOrg
        await prisma.contentBlock.update({
            where: { key: 'organizations' },
            data:  { value: data },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update organizations data' }, { status: 500 })
    }
}
