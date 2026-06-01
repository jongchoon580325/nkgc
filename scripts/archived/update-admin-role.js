const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminRole() {
    try {
        // admin 계정의 role을 super_admin으로 업데이트
        const result = await prisma.user.updateMany({
            where: {
                username: 'admin'
            },
            data: {
                role: 'super_admin'
            }
        });

        console.log('✅ Admin 계정 권한 업데이트 완료:', result);

        // 업데이트된 admin 계정 확인
        const adminUser = await prisma.user.findFirst({
            where: { username: 'admin' }
        });

        console.log('Admin 계정 정보:', {
            username: adminUser?.username,
            name: adminUser?.name,
            role: adminUser?.role
        });
    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAdminRole();
