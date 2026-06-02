/**
 * Neon 테이블 전체 TRUNCATE (import 재실행 전 클린업)
 * 실행: node scripts/truncate-all.mjs
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['error'] });

const tables = [
    'likes', 'comments', 'file_assets', 'media_folders',
    'rules', 'board_settings', 'hero_configs', 'popups',
    'resolutions', 'separate_registries', 'standing_committees',
    'fee_payment_accounts', 'fee_statuses', 'attachments',
    'posts', 'users', 'settings',
];

async function main() {
    for (const t of tables) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
        console.log(`  truncated: ${t}`);
    }
    console.log('done');
    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); prisma.$disconnect(); process.exit(1); });
