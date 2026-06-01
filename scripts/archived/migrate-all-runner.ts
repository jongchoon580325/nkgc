
import { migrateBoard } from './migrate-legacy-data.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BOARD_MAP = [
    { id: 1, type: 'NOTICE', name: '노회공지' },
    { id: 2, type: 'FORM_ADMIN', name: '노회서식' },
    { id: 3, type: 'DATA_GENERAL', name: '일반자료' },
    { id: 4, type: 'FREE', name: '자유게시판' },
    { id: 5, type: 'MEMBER', name: '정회원게시판' },
    { id: 7, type: 'MINUTES', name: '노회록열람' },
    { id: 8, type: 'GALLERY', name: '사진자료' },
    { id: 9, type: 'VIDEO_DATA', name: '영상자료' },
    { id: 10, type: 'VIDEO_BOARD', name: '영상게시판' },
    { id: 12, type: 'INDEP_COM', name: '노회자립위원회' },
    { id: 13, type: 'INDEP_NOTICE', name: '노회자립위원회_알림' },
    { id: 14, type: 'MEMBER_CARD', name: '교역자신상카드' },
    { id: 15, type: 'EXAM_DATA', name: '고시부자료실' },
    { id: 17, type: 'GALLERY_OLD', name: '사진자료실-1' },
    { id: 18, type: 'MEMBER_OLD', name: '정회원.게시판' },
];

async function runAll() {
    console.log('🚀 Starting Full Migration for All Boards...');

    const summary = [];

    for (const board of BOARD_MAP) {
        try {
            const result = await migrateBoard(board.id, board.type);
            summary.push({
                name: board.name,
                type: board.type,
                total: result.total,
                success: result.success,
                failed: result.failed
            });
        } catch (error) {
            console.error(`Error migrating ${board.name}:`, error);
            summary.push({
                name: board.name,
                type: board.type,
                total: 0,
                success: 0,
                failed: -1
            });
        }
    }

    console.log('\n=============================================');
    console.log('📊 MIGRATION SUMMARY REPORT');
    console.log('=============================================');
    console.table(summary);

    await prisma.$disconnect();
}

runAll().catch(console.error);
