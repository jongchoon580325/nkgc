/**
 * SQLite → JSON export 스크립트
 * 실행: DATABASE_URL="file:./backup/phase0/dev.db.bak" node scripts/export-sqlite.mjs
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

async function exportData() {
    console.log('SQLite 데이터 export 시작...\n');

    const [
        settings,
        users,
        posts,
        attachments,
        feeStatuses,
        feePaymentAccounts,
        standingCommittees,
        separateRegistries,
        resolutions,
        popups,
        heroConfigs,
        boardSettings,
        rules,
        mediaFolders,
        fileAssets,
        comments,
        likes,
    ] = await Promise.all([
        prisma.settings.findMany(),
        prisma.user.findMany(),
        prisma.post.findMany(),
        prisma.attachment.findMany(),
        prisma.feeStatus.findMany(),
        prisma.feePaymentAccount.findMany(),
        prisma.standingCommittee.findMany(),
        prisma.separateRegistry.findMany(),
        prisma.resolution.findMany(),
        prisma.popup.findMany(),
        prisma.heroConfig.findMany(),
        prisma.boardSettings.findMany(),
        prisma.rule.findMany(),
        prisma.mediaFolder.findMany(),
        prisma.fileAsset.findMany(),
        prisma.comment.findMany(),
        prisma.like.findMany(),
    ]);

    const data = {
        settings, users, posts, attachments,
        feeStatuses, feePaymentAccounts, standingCommittees,
        separateRegistries, resolutions, popups, heroConfigs,
        boardSettings, rules, mediaFolders, fileAssets,
        comments, likes,
    };

    writeFileSync('sqlite-export.json', JSON.stringify(data, null, 2), 'utf-8');

    console.log('export 완료:');
    for (const [key, val] of Object.entries(data)) {
        console.log(`  ${key}: ${val.length}건`);
    }

    await prisma.$disconnect();
}

exportData().catch(e => {
    console.error('export 실패:', e);
    prisma.$disconnect();
    process.exit(1);
});
