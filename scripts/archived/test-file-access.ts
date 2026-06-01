import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function testFileAccess() {
    console.log('🔍 Testing file accessibility for 노회행정서식...\n');

    // Get posts with attachments
    const posts = await prisma.post.findMany({
        where: {
            boardType: 'FORM_ADMIN',
            attachments: {
                some: {}
            }
        },
        include: {
            attachments: true
        },
        take: 10,
        orderBy: {
            createdAt: 'desc'
        }
    });

    console.log(`Found ${posts.length} posts with attachments\n`);

    let foundCount = 0;
    let missingCount = 0;

    for (const post of posts) {
        console.log(`\n📄 Post: ${post.title}`);

        for (const attachment of post.attachments) {
            const publicPath = path.join(process.cwd(), 'public', attachment.fileUrl);

            try {
                const stats = await fs.stat(publicPath);
                const sizeKB = (stats.size / 1024).toFixed(2);
                console.log(`  ✅ ${attachment.fileName} (${sizeKB} KB) - EXISTS`);
                foundCount++;
            } catch (error) {
                console.log(`  ❌ ${attachment.fileName} - MISSING`);
                console.log(`     Expected path: ${publicPath}`);
                missingCount++;
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`  ✅ Found: ${foundCount} files`);
    console.log(`  ❌ Missing: ${missingCount} files`);
    console.log('='.repeat(60));

    if (missingCount === 0) {
        console.log('\n🎉 All files are accessible! Ready for download testing.');
    } else {
        console.log('\n⚠️  Some files are missing. Please check the uploads folder.');
    }
}

testFileAccess()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
