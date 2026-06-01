import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// POST: CSV Import Members
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        const userRole = session?.user?.role;
        if (!session || (userRole !== 'admin' && userRole !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { members } = body;

        if (!members || !Array.isArray(members)) {
            return NextResponse.json(
                { success: false, error: 'Invalid members data' },
                { status: 400 }
            );
        }

        let count = 0;
        let skipped = 0;

        for (const member of members) {
            const { name, churchName, position, category, phone, role, username, password } = member;

            if (!name) continue;

            // Check for duplicate username
            const existingUser = await prisma.user.findUnique({
                where: { username: username }
            });

            if (existingUser) {
                console.log(`Skipped duplicate username: ${username}`);
                skipped++;
                continue;
            }

            try {
                // Hash the password
                const hashedPassword = await bcrypt.hash(password || '123456', 10);

                await prisma.user.create({
                    data: {
                        username: username || `${name}_4214`,
                        password: hashedPassword,
                        name: name,
                        email: null,
                        phone: phone || '010-0000-0000',
                        churchName: churchName || '',
                        position: position || '',
                        category: category || null,
                        role: role || 'member',
                        isApproved: true,
                        approvedAt: new Date()
                    },
                });
                count++;
            } catch (error) {
                console.error(`Failed to import member ${name}:`, error);
                // Continue with next member
            }
        }

        return NextResponse.json({
            success: true,
            count,
            message: `${count}명의 회원을 가져왔습니다.`
        });
    } catch (error) {
        console.error('CSV Import error:', error);
        return NextResponse.json(
            { success: false, error: 'CSV 가져오기 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
