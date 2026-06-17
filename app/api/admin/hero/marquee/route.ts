import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'HERO_MARQUEE';

export async function GET() {
    try {
        const setting = await prisma.settings.findUnique({ where: { key: SETTING_KEY } });
        const items = setting ? JSON.parse(setting.value) : [];
        return NextResponse.json({ items });
    } catch {
        return NextResponse.json({ items: [] });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { items } = await request.json();
        if (!Array.isArray(items) || items.length > 7) {
            return NextResponse.json({ error: '최대 7개까지 등록 가능합니다.' }, { status: 400 });
        }

        await prisma.settings.upsert({
            where: { key: SETTING_KEY },
            update: { value: JSON.stringify(items) },
            create: { key: SETTING_KEY, value: JSON.stringify(items) },
        });

        return NextResponse.json({ success: true, items });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
