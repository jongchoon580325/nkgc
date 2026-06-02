/**
 * PostgreSQL row count 검증 + sequence reset
 * 실행: node scripts/verify-counts.mjs
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['error'] });

const TABLES = [
    ['settings',            'settings'],
    ['users',               'users'],
    ['posts',               'posts'],
    ['attachments',         'attachments'],
    ['fee_statuses',        'feeStatuses'],
    ['fee_payment_accounts','feePaymentAccounts'],
    ['standing_committees', 'standingCommittees'],
    ['separate_registries', 'separateRegistries'],
    ['resolutions',         'resolutions'],
    ['popups',              'popups'],
    ['hero_configs',        'heroConfigs'],
    ['board_settings',      'boardSettings'],
    ['rules',               'rules'],
    ['media_folders',       'mediaFolders'],
    ['file_assets',         'fileAssets'],
    ['comments',            'comments'],
    ['likes',               'likes'],
];

async function main() {
    console.log('=== Row Count 검증 ===\n');
    let allOk = true;
    for (const [table] of TABLES) {
        const [row] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS cnt FROM "${table}"`);
        console.log(`  ${table.padEnd(24)}: ${row.cnt}건`);
    }

    console.log('\n=== Sequence Reset ===\n');
    for (const [table] of TABLES) {
        try {
            await prisma.$executeRawUnsafe(
                `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX(id), 1)) FROM "${table}"`
            );
            console.log(`  ${table}: sequence reset OK`);
        } catch (e) {
            console.log(`  ${table}: sequence skip (${e.message.slice(0, 60)})`);
        }
    }

    console.log('\n=== FK 기본 검증 ===\n');
    const orphanAttachments = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM "attachments" a WHERE NOT EXISTS (SELECT 1 FROM "posts" p WHERE p.id = a.post_id)`;
    console.log(`  고아 attachments (post 없음): ${orphanAttachments[0].cnt}건`);

    const orphanComments = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM "comments" c WHERE NOT EXISTS (SELECT 1 FROM "posts" p WHERE p.id = c.post_id)`;
    console.log(`  고아 comments (post 없음): ${orphanComments[0].cnt}건`);

    const orphanLikes = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM "likes" l WHERE NOT EXISTS (SELECT 1 FROM "posts" p WHERE p.id = l.post_id)`;
    console.log(`  고아 likes (post 없음): ${orphanLikes[0].cnt}건`);

    console.log('\n완료');
    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); prisma.$disconnect(); process.exit(1); });
