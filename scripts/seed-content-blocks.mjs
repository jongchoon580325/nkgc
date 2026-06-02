/**
 * data/*.json → content_blocks 테이블 import
 * 실행: node scripts/seed-content-blocks.mjs
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient({ log: ['error'] });

const FILES = [
    { key: 'greeting',      file: 'data/president.json' },
    { key: 'introduction',  file: 'data/introduction.json' },
    { key: 'contact_info',  file: 'data/contact-info.json' },
    { key: 'officers',      file: 'data/officers.json' },
    { key: 'past_officers', file: 'data/past-officers.json' },
    { key: 'inspections',   file: 'data/inspections.json' },
    { key: 'organizations', file: 'data/organizations.json' },
];

async function main() {
    console.log('content_blocks 데이터 import 시작...\n');
    for (const { key, file } of FILES) {
        const value = JSON.parse(readFileSync(file, 'utf-8'));
        await prisma.contentBlock.upsert({
            where:  { key },
            update: { value },
            create: { key, value },
        });
        console.log(`  ${key}: OK`);
    }
    console.log('\n완료');
    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); prisma.$disconnect(); process.exit(1); });
