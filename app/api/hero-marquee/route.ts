import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'HERO_MARQUEE';

export async function GET() {
    try {
        const setting = await prisma.settings.findUnique({ where: { key: SETTING_KEY } });
        const items = setting ? JSON.parse(setting.value) : [];
        return NextResponse.json({ items }, {
            headers: { 'Cache-Control': 'no-store, max-age=0' },
        });
    } catch {
        return NextResponse.json({ items: [] });
    }
}
