/**
 * SQLite → PostgreSQL raw INSERT import (Prisma $executeRawUnsafe 사용)
 * 실행: node scripts/raw-import.mjs
 * 전제: DATABASE_URL이 Neon PostgreSQL을 가리켜야 함
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient({ log: ['error'] });

// Unix ms 타임스탬프 또는 ISO 문자열 → PostgreSQL 타임스탬프 문자열
function toTimestamp(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return new Date(v).toISOString();
    if (typeof v === 'string' && v.trim() !== '') return new Date(v).toISOString();
    return null;
}

// 값 → SQL 리터럴 문자열 (injection 안전)
function sqlVal(v) {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') return String(v);
    // 문자열 — 작은따옴표 이스케이프
    return `'${String(v).replace(/'/g, "''")}'`;
}

// BOOLEAN 컬럼 목록 (SQLite 0/1 → PostgreSQL TRUE/FALSE)
const BOOLEAN_COLS = {
    users:                ['is_approved'],
    posts:                ['is_notice'],
    popups:               ['is_active'],
    fee_payment_accounts: ['is_active'],
    hero_configs:         ['is_active', 'hide_text'],
};

// TIMESTAMP 컬럼 목록 (테이블명 → 컬럼명 배열)
const TIMESTAMP_COLS = {
    settings:            ['created_at', 'updated_at'],
    users:               ['approved_at', 'rejected_at', 'created_at', 'updated_at', 'last_login_at'],
    posts:               ['created_at', 'updated_at'],
    attachments:         ['created_at'],
    fee_statuses:        ['created_at', 'updated_at'],
    fee_payment_accounts:['created_at', 'updated_at'],
    standing_committees: ['created_at', 'updated_at'],
    separate_registries: ['created_at', 'updated_at'],
    resolutions:         ['created_at', 'updated_at'],
    popups:              ['start_at', 'end_at', 'created_at', 'updated_at'],
    hero_configs:        ['created_at', 'updated_at'],
    board_settings:      ['created_at', 'updated_at'],
    rules:               ['updated_at'],
    media_folders:       ['created_at', 'updated_at'],
    file_assets:         ['uploaded_at'],
    comments:            ['created_at', 'updated_at'],
    likes:               ['created_at'],
};

async function insertRows(tableName, rows) {
    if (!rows || rows.length === 0) {
        console.log(`  ${tableName}: 0건 (skip)`);
        return;
    }
    const tsCols  = new Set(TIMESTAMP_COLS[tableName] || []);
    const boolCols = new Set(BOOLEAN_COLS[tableName] || []);
    let ok = 0, skip = 0;
    for (const row of rows) {
        const cols = Object.keys(row);
        const vals = cols.map(col => {
            const v = row[col];
            if (tsCols.has(col))   return sqlVal(toTimestamp(v));
            if (boolCols.has(col)) return v ? 'TRUE' : 'FALSE';
            return sqlVal(v);
        });
        const sql = `INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING`;
        try {
            await prisma.$executeRawUnsafe(sql);
            ok++;
        } catch (e) {
            skip++;
            if (skip <= 3) console.error(`    WARN row skip: ${e.message.slice(0, 120)}`);
        }
    }
    console.log(`  ${tableName}: ${ok}건 삽입, ${skip}건 skip`);
}

async function main() {
    console.log('PostgreSQL raw INSERT import 시작...\n');
    const data = JSON.parse(readFileSync('sqlite-export.json', 'utf-8'));

    // FK 의존 순서 보장
    await insertRows('settings',             data.settings);
    await insertRows('users',                data.users);
    await insertRows('posts',                data.posts);
    await insertRows('attachments',          data.attachments);
    await insertRows('fee_statuses',         data.feeStatuses);
    await insertRows('fee_payment_accounts', data.feePaymentAccounts);
    await insertRows('standing_committees',  data.standingCommittees);
    await insertRows('separate_registries',  data.separateRegistries);
    await insertRows('resolutions',          data.resolutions);
    await insertRows('popups',               data.popups);
    await insertRows('hero_configs',         data.heroConfigs);
    await insertRows('board_settings',       data.boardSettings);
    await insertRows('rules',                data.rules);

    // media_folders: 부모 먼저
    const rootFolders  = data.mediaFolders.filter(f => !f.parent_id);
    const childFolders = data.mediaFolders.filter(f =>  f.parent_id);
    await insertRows('media_folders', [...rootFolders, ...childFolders]);

    await insertRows('file_assets',   data.fileAssets);
    await insertRows('comments',      data.comments);
    await insertRows('likes',         data.likes);

    console.log('\n임포트 완료!');
    await prisma.$disconnect();
}

main().catch(e => {
    console.error('임포트 실패:', e.message);
    prisma.$disconnect();
    process.exit(1);
});
