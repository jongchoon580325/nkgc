const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function addTestMembers() {
    try {
        const hashedPassword = await bcrypt.hash('test123', 10);

        // 목사회원 테스트 데이터
        const pastors = [
            {
                username: 'pastor1',
                password: hashedPassword,
                name: '김목사',
                phone: '010-1234-5678',
                churchName: '은혜교회',
                position: '담임목사',
                role: 'pastor',
                isApproved: true
            },
            {
                username: 'pastor2',
                password: hashedPassword,
                name: '이목사',
                phone: '010-2345-6789',
                churchName: '사랑교회',
                position: '담임목사',
                role: 'pastor',
                isApproved: true
            },
            {
                username: 'pastor3',
                password: hashedPassword,
                name: '박목사',
                phone: '010-3456-7890',
                churchName: '믿음교회',
                position: '담임목사',
                role: 'pastor',
                isApproved: true
            }
        ];

        // 장로총대 테스트 데이터
        const elders = [
            {
                username: 'elder1',
                password: hashedPassword,
                name: '최장로',
                phone: '010-4567-8901',
                churchName: '소망교회',
                position: '장로',
                role: 'elder',
                isApproved: true
            },
            {
                username: 'elder2',
                password: hashedPassword,
                name: '정장로',
                phone: '010-5678-9012',
                churchName: '평안교회',
                position: '장로',
                role: 'elder',
                isApproved: true
            },
            {
                username: 'elder3',
                password: hashedPassword,
                name: '강장로',
                phone: '010-6789-0123',
                churchName: '기쁨교회',
                position: '장로',
                role: 'elder',
                isApproved: true
            }
        ];

        // 목사회원 추가
        for (const pastor of pastors) {
            await prisma.user.upsert({
                where: { username: pastor.username },
                update: {},
                create: pastor
            });
        }

        // 장로총대 추가
        for (const elder of elders) {
            await prisma.user.upsert({
                where: { username: elder.username },
                update: {},
                create: elder
            });
        }

        console.log('✅ 테스트 회원 데이터 추가 완료');
        console.log(`- 목사회원: ${pastors.length}명`);
        console.log(`- 장로총대: ${elders.length}명`);

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addTestMembers();
