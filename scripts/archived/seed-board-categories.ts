import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBoardCategories() {
    console.log('🌱 Seeding board categories from existing posts...\n');

    // Get all board types from BOARD_CONFIG
    const boardTypes = [
        'FORM_ADMIN',     // 노회행정서식
        'FORM_SELF',      // 자립위원회서식 (추정)
        'GALLERY',        // 사진자료실
        'EXAM_DEPT',      // 고시부 자료실
        'EXAM_USER',      // 응시자 자료실
    ];

    for (const boardType of boardTypes) {
        console.log(`\n📋 Processing ${boardType}...`);

        // Get distinct categories for this board
        const posts = await prisma.post.findMany({
            where: {
                boardType,
                category: {
                    not: null,
                },
            },
            select: {
                category: true,
            },
        });

        // Extract unique categories
        const categories = [...new Set(
            posts
                .map(p => p.category)
                .filter(c => c && c.trim() !== '')
        )].sort();

        if (categories.length === 0) {
            console.log(`  ⚠️  No categories found for ${boardType}`);
            continue;
        }

        console.log(`  Found ${categories.length} categories:`, categories);

        // Create or update board settings
        await prisma.boardSettings.upsert({
            where: {
                boardType,
            },
            create: {
                boardType,
                categories: JSON.stringify(categories),
            },
            update: {
                categories: JSON.stringify(categories),
            },
        });

        console.log(`  ✅ Saved categories for ${boardType}`);
    }

    console.log('\n🎉 Board categories seeding complete!');
}

seedBoardCategories()
    .catch((error) => {
        console.error('Error seeding categories:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
