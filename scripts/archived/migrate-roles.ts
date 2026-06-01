// 데이터 마이그레이션 스크립트
// 실행 방법: npx ts-node --skip-project scripts/migrate-roles.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== 데이터 마이그레이션 시작 ===\n');

    // 1. 현재 role 분포 확인
    const roleCounts = await prisma.$queryRaw`
        SELECT role, COUNT(*) as count FROM "User" GROUP BY role
    `;
    console.log('현재 role 분포:', roleCounts);

    // 2. 현재 position 분포 확인
    const positionCounts = await prisma.$queryRaw`
        SELECT position, COUNT(*) as count FROM "User" GROUP BY position
    `;
    console.log('현재 position 분포:', positionCounts);

    // 3. 중복 데이터 확인 (같은 username)
    const duplicates = await prisma.$queryRaw`
        SELECT username, COUNT(*) as count 
        FROM "User" 
        GROUP BY username 
        HAVING COUNT(*) > 1
    `;
    console.log('\n중복 username:', duplicates);

    // 4. 중복 데이터 확인 (같은 name + phone)
    const duplicatesByNamePhone = await prisma.$queryRaw`
        SELECT name, phone, COUNT(*) as count 
        FROM "User" 
        GROUP BY name, phone 
        HAVING COUNT(*) > 1
    `;
    console.log('중복 name+phone:', duplicatesByNamePhone);

    // 5. Role 마이그레이션
    // - pastor, elder (구 체계) → member (정회원)
    // - evangelist, member (구 position 기반 role) → guest (일반회원)
    // - pending은 유지
    // - super_admin, admin은 유지

    console.log('\n=== Role 마이그레이션 시작 ===');

    // 목사 직분인 회원들 → member (정회원)
    const updatePastors = await prisma.user.updateMany({
        where: {
            position: 'pastor',
            role: { notIn: ['super_admin', 'admin', 'pending'] }
        },
        data: { role: 'member' }
    });
    console.log(`목사 직분 → 정회원: ${updatePastors.count}명`);

    // 장로 직분인 회원들 → member (정회원)
    const updateElders = await prisma.user.updateMany({
        where: {
            position: 'elder',
            role: { notIn: ['super_admin', 'admin', 'pending'] }
        },
        data: { role: 'member' }
    });
    console.log(`장로 직분 → 정회원: ${updateElders.count}명`);

    // 전도사 직분 → guest (일반회원)
    const updateEvangelists = await prisma.user.updateMany({
        where: {
            position: 'evangelist',
            role: { notIn: ['super_admin', 'admin', 'pending'] }
        },
        data: { role: 'guest' }
    });
    console.log(`전도사 직분 → 일반회원: ${updateEvangelists.count}명`);

    // 일반교인 직분 → guest (일반회원)
    const updateMembers = await prisma.user.updateMany({
        where: {
            position: 'member',
            role: { notIn: ['super_admin', 'admin', 'pending'] }
        },
        data: { role: 'guest' }
    });
    console.log(`일반교인 직분 → 일반회원: ${updateMembers.count}명`);

    // 6. 마이그레이션 후 확인
    const finalRoleCounts = await prisma.$queryRaw`
        SELECT role, COUNT(*) as count FROM "User" GROUP BY role
    `;
    console.log('\n마이그레이션 후 role 분포:', finalRoleCounts);

    console.log('\n=== 마이그레이션 완료 ===');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
