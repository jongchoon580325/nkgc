const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeSettings() {
    try {
        // 회기 설정이 없으면 생성
        const existing = await prisma.settings.findUnique({
            where: { key: 'current_term' }
        });

        if (!existing) {
            await prisma.settings.create({
                data: {
                    key: 'current_term',
                    value: '48회기 – 49회기 (2025년-2026년)'
                }
            });
            console.log('✅ 기본 회기 설정 생성 완료');
        } else {
            console.log('✅ 회기 설정이 이미 존재합니다:', existing.value);
        }

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

initializeSettings();
