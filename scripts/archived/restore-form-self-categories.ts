import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreFormSelfCategories() {
    console.log('🔄 Restoring categories for FORM_SELF posts...');

    const posts = await prisma.post.findMany({
        where: { boardType: 'FORM_SELF' },
    });

    console.log(`Found ${posts.length} posts.`);

    let updatedCount = 0;

    for (const post of posts) {
        let category = '기타';
        const title = post.title;

        if (title.includes('지원') || title.includes('신청') || title.includes('서약') || title.includes('협조전')) {
            category = '지원/신청';
        }

        if (title.includes('보고서') || title.includes('현황') || title.includes('순위')) {
            category = '보고서/현황';
        }

        if (title.includes('세칙') || title.includes('규정')) {
            category = '규정/세칙';
        }

        // 우선순위 조정 (중복될 경우 더 구체적인 것으로)
        if (title.includes('심사표') || title.includes('근거')) {
            category = '심사/근거';
        }

        if (title.includes('전체서류')) {
            category = '전체서류';
        }

        console.log(`[${post.id}] ${title} -> ${category}`);

        await prisma.post.update({
            where: { id: post.id },
            data: { category },
        });

        updatedCount++;
    }

    console.log(`\n✅ Updated ${updatedCount} posts.`);
}

restoreFormSelfCategories()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
