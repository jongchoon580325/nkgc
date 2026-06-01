/**
 * SQLite → PostgreSQL 데이터 임포트 스크립트
 * 실행: node scripts/import-to-postgres.mjs
 * 전제조건: DATABASE_URL이 PostgreSQL을 가리켜야 함
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

async function importData() {
    const raw = readFileSync('sqlite-export.json', 'utf-8');
    const data = JSON.parse(raw);

    console.log('PostgreSQL 데이터 임포트 시작...\n');

    // 날짜 문자열 → Date 변환 헬퍼
    const toDate = (v) => v ? new Date(v) : null;

    // 1. Settings
    console.log('1/17 Settings...');
    for (const r of data.settings) {
        await prisma.settings.upsert({
            where: { key: r.key },
            update: { value: r.value },
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 2. Users
    console.log('2/17 Users...');
    for (const r of data.users) {
        await prisma.user.upsert({
            where: { id: r.id },
            update: {},
            create: {
                ...r,
                email: r.email || null,
                approvedAt: toDate(r.approvedAt),
                rejectedAt: toDate(r.rejectedAt),
                lastLoginAt: toDate(r.lastLoginAt),
                createdAt: toDate(r.createdAt),
                updatedAt: toDate(r.updatedAt),
            }
        });
    }

    // 3. Posts
    console.log('3/17 Posts...');
    for (const r of data.posts) {
        await prisma.post.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 4. Attachments
    console.log('4/17 Attachments...');
    for (const r of data.attachments) {
        await prisma.attachment.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt) }
        });
    }

    // 5. FeeStatuses
    console.log('5/17 FeeStatuses...');
    for (const r of data.feeStatuses) {
        await prisma.feeStatus.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 6. FeePaymentAccounts
    console.log('6/17 FeePaymentAccounts...');
    for (const r of data.feePaymentAccounts) {
        await prisma.feePaymentAccount.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 7. StandingCommittees
    console.log('7/17 StandingCommittees...');
    for (const r of data.standingCommittees) {
        await prisma.standingCommittee.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 8. SeparateRegistries
    console.log('8/17 SeparateRegistries...');
    for (const r of data.separateRegistries) {
        await prisma.separateRegistry.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 9. Resolutions
    console.log('9/17 Resolutions...');
    for (const r of data.resolutions) {
        await prisma.resolution.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 10. Popups
    console.log('10/17 Popups...');
    for (const r of data.popups) {
        await prisma.popup.upsert({
            where: { id: r.id },
            update: {},
            create: {
                ...r,
                startAt: toDate(r.startAt),
                endAt: toDate(r.endAt),
                createdAt: toDate(r.createdAt),
                updatedAt: toDate(r.updatedAt)
            }
        });
    }

    // 11. HeroConfigs
    console.log('11/17 HeroConfigs...');
    for (const r of data.heroConfigs) {
        await prisma.heroConfig.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 12. BoardSettings
    console.log('12/17 BoardSettings...');
    for (const r of data.boardSettings) {
        await prisma.boardSettings.upsert({
            where: { boardType: r.boardType },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 13. Rules
    console.log('13/17 Rules...');
    for (const r of data.rules) {
        await prisma.rule.upsert({
            where: { type: r.type },
            update: {},
            create: { ...r, updatedAt: toDate(r.updatedAt) }
        });
    }

    // 14. MediaFolders (계층 구조 - 부모 먼저)
    console.log('14/17 MediaFolders...');
    const rootFolders = data.mediaFolders.filter(f => !f.parentId);
    const childFolders = data.mediaFolders.filter(f => f.parentId);
    for (const r of [...rootFolders, ...childFolders]) {
        await prisma.mediaFolder.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 15. FileAssets
    console.log('15/17 FileAssets...');
    for (const r of data.fileAssets) {
        await prisma.fileAsset.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, uploadedAt: toDate(r.uploadedAt) }
        });
    }

    // 16. Comments
    console.log('16/17 Comments...');
    for (const r of data.comments) {
        await prisma.comment.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) }
        });
    }

    // 17. Likes
    console.log('17/17 Likes...');
    for (const r of data.likes) {
        await prisma.like.upsert({
            where: { id: r.id },
            update: {},
            create: { ...r, createdAt: toDate(r.createdAt) }
        });
    }

    console.log('\n✓ 임포트 완료!');
    await prisma.$disconnect();
}

importData().catch(e => {
    console.error('임포트 실패:', e);
    prisma.$disconnect();
    process.exit(1);
});
