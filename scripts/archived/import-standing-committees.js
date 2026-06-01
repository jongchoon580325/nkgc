const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 새로운 상비부 데이터
const committeeData = [
    {
        name: '헌의부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 1
    },
    {
        name: '전도부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 2
    },
    {
        name: '정치부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 3
    },
    {
        name: '고시부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 4
    },
    {
        name: '교육부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 5
    },
    {
        name: '규칙부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 6
    },
    {
        name: '재정부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 7
    },
    {
        name: '복지부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 8
    },
    {
        name: '선교부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 9
    },
    {
        name: '군경목부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 10
    },
    {
        name: '면려부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 11
    },
    {
        name: '감사부',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 12
    },
    {
        name: '당회록',
        headTitle: '부장',
        head: '',
        headRole: '목사',
        secretary: '',
        secretaryRole: '목사',
        members: '',
        term: '48회기 – 49회기 (2025년-2026년)',
        displayOrder: 13
    }
];

async function importStandingCommittees() {
    try {
        console.log('🔄 상비부 데이터 임포트 시작...');

        // 기존 데이터 삭제
        await prisma.standingCommittee.deleteMany({});
        console.log('✅ 기존 상비부 데이터 삭제 완료');

        // 새 데이터 추가
        for (const committee of committeeData) {
            await prisma.standingCommittee.create({
                data: committee
            });
        }

        console.log(`✅ 상비부 데이터 추가 완료: ${committeeData.length}개`);
        console.log('\n📊 추가된 상비부:');
        committeeData.forEach((c, i) => {
            console.log(`   ${i + 1}. ${c.name}`);
        });

        // 데이터 확인
        const count = await prisma.standingCommittee.count();
        console.log(`\n✅ 데이터베이스 확인: ${count}개 상비부 저장됨`);

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importStandingCommittees();
