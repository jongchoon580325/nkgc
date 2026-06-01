
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET_BOARD_TYPE = 'FORM_ADMIN';

async function verify() {
    console.log('Verifying migration for board:', TARGET_BOARD_TYPE);

    const count = await prisma.post.count({
        where: { boardType: TARGET_BOARD_TYPE },
    });

    console.log(`Total Posts: ${count}`);

    const posts = await prisma.post.findMany({
        where: { boardType: TARGET_BOARD_TYPE },
        include: { attachments: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
    });

    console.log('\nSample Posts with Attachments:');
    for (const post of posts) {
        console.log(`\n[${post.id}] ${post.title}`);
        console.log(`  Category: ${post.category}`);
        console.log(`  Attachments: ${post.attachments.length}`);
        post.attachments.forEach(att => {
            const sizeKB = (att.fileSize / 1024).toFixed(2);
            console.log(`    - ${att.fileName} (${sizeKB} KB) @ ${att.fileUrl}`);
        });
    }
}

verify()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
