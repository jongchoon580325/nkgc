// 데이터 마이그레이션 스크립트
// 실행 방법: node scripts/migrate-roles.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== 데이터 마이그레이션 시작 ===\n');

    // 1. 현재 데이터 분포 확인
    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            phone: true,
            position: true,
            role: true,
            createdAt: true
        }
    });

    console.log(`총 회원 수: ${allUsers.length}명`);

    // Role 분포 확인
    const roleDistribution = {};
    const positionDistribution = {};

    allUsers.forEach(user => {
        roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1;
        positionDistribution[user.position] = (positionDistribution[user.position] || 0) + 1;
    });

    console.log('현재 role 분포:', roleDistribution);
    console.log('현재 position 분포:', positionDistribution);

    // 2. 중복 데이터 확인 및 삭제 (같은 name + phone, 나중에 생성된 것 삭제)
    const namePhoneMap = {};
    allUsers.forEach(user => {
        const key = `${user.name}_${user.phone}`;
        if (!namePhoneMap[key]) {
            namePhoneMap[key] = [];
        }
        namePhoneMap[key].push(user);
    });

    const duplicates = Object.entries(namePhoneMap).filter(([k, v]) => v.length > 1);
    if (duplicates.length > 0) {
        console.log('\n=== 중복 데이터 삭제 시작 ===');
        for (const [key, users] of duplicates) {
            // 가장 먼저 생성된 것을 유지하고 나머지 삭제
            const sortedUsers = users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const keepUser = sortedUsers[0];
            const deleteUsers = sortedUsers.slice(1);

            console.log(`  ${key}: ${keepUser.username}(id:${keepUser.id}) 유지, 나머지 ${deleteUsers.length}개 삭제`);

            for (const delUser of deleteUsers) {
                await prisma.user.delete({ where: { id: delUser.id } });
                console.log(`    - 삭제됨: ${delUser.username} (id:${delUser.id})`);
            }
        }
    } else {
        console.log('\n중복 데이터 없음');
    }

    // 3. Role 마이그레이션 (한글 직분명 기준)
    console.log('\n=== Role 마이그레이션 시작 ===');

    // 목사 직분 (한글) → member (정회원)
    const updatePastorsKr = await prisma.user.updateMany({
        where: {
            position: '목사',
            role: { notIn: ['super_admin', 'admin', 'pending', 'member'] }
        },
        data: { role: 'member' }
    });
    console.log(`목사(한글) 직분 → 정회원: ${updatePastorsKr.count}명`);

    // 목사 직분 (영문) → member (정회원)
    const updatePastorsEn = await prisma.user.updateMany({
        where: {
            position: 'pastor',
            role: { notIn: ['super_admin', 'admin', 'pending', 'member'] }
        },
        data: { role: 'member' }
    });
    console.log(`목사(영문) 직분 → 정회원: ${updatePastorsEn.count}명`);

    // 장로 직분 (한글) → member (정회원)
    const updateEldersKr = await prisma.user.updateMany({
        where: {
            position: '장로',
            role: { notIn: ['super_admin', 'admin', 'pending', 'member'] }
        },
        data: { role: 'member' }
    });
    console.log(`장로(한글) 직분 → 정회원: ${updateEldersKr.count}명`);

    // 장로 직분 (영문) → member (정회원)
    const updateEldersEn = await prisma.user.updateMany({
        where: {
            position: 'elder',
            role: { notIn: ['super_admin', 'admin', 'pending', 'member'] }
        },
        data: { role: 'member' }
    });
    console.log(`장로(영문) 직분 → 정회원: ${updateEldersEn.count}명`);

    // 전도사 직분 (한글) → guest (일반회원)
    const updateEvangelistsKr = await prisma.user.updateMany({
        where: {
            position: '전도사',
            role: { notIn: ['super_admin', 'admin', 'pending', 'guest'] }
        },
        data: { role: 'guest' }
    });
    console.log(`전도사(한글) 직분 → 일반회원: ${updateEvangelistsKr.count}명`);

    // 전도사 직분 (영문) → guest (일반회원)
    const updateEvangelistsEn = await prisma.user.updateMany({
        where: {
            position: 'evangelist',
            role: { notIn: ['super_admin', 'admin', 'pending', 'guest'] }
        },
        data: { role: 'guest' }
    });
    console.log(`전도사(영문) 직분 → 일반회원: ${updateEvangelistsEn.count}명`);

    // 일반교인/교인 직분 (한글) → guest (일반회원)
    const updateMembersKr = await prisma.user.updateMany({
        where: {
            position: { in: ['교인', '일반교인'] },
            role: { notIn: ['super_admin', 'admin', 'pending', 'guest'] }
        },
        data: { role: 'guest' }
    });
    console.log(`교인/일반교인(한글) 직분 → 일반회원: ${updateMembersKr.count}명`);

    // 일반교인 직분 (영문) → guest (일반회원)
    const updateMembersEn = await prisma.user.updateMany({
        where: {
            position: 'member',
            role: { notIn: ['super_admin', 'admin', 'pending', 'guest'] }
        },
        data: { role: 'guest' }
    });
    console.log(`일반교인(영문) 직분 → 일반회원: ${updateMembersEn.count}명`);

    // 4. 마이그레이션 후 확인
    const finalUsers = await prisma.user.findMany({
        select: { role: true }
    });

    const finalRoleDistribution = {};
    finalUsers.forEach(user => {
        finalRoleDistribution[user.role] = (finalRoleDistribution[user.role] || 0) + 1;
    });

    console.log('\n마이그레이션 후 role 분포:', finalRoleDistribution);
    console.log(`최종 회원 수: ${finalUsers.length}명`);
    console.log('\n=== 마이그레이션 완료 ===');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
