import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'MENU_VISIBILITY';

export async function GET(request: NextRequest) {
    try {
        const setting = await prisma.settings.findUnique({
            where: { key: SETTING_KEY },
        });

        const visibility = setting ? JSON.parse(setting.value) : {};
        return NextResponse.json({ visibility }, {
            headers: { 'Cache-Control': 'no-store, max-age=0' },
        });
    } catch (error) {
        console.error('Error fetching menu settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !['admin', 'super_admin'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { visibility } = body;

        const setting = await prisma.settings.upsert({
            where: { key: SETTING_KEY },
            update: { value: JSON.stringify(visibility) },
            create: { key: SETTING_KEY, value: JSON.stringify(visibility) },
        });

        return NextResponse.json({ success: true, visibility: JSON.parse(setting.value) });
    } catch (error) {
        console.error('Error saving menu settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
