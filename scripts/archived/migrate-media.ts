
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import mime from 'mime-types'; // Note: Need to install this or use simple map

// Simple mime map to avoid dependency if possible, or install mime-types
function getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const map: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.zip': 'application/zip'
    };
    return map[ext] || 'application/octet-stream';
}

async function migrate() {
    console.log("🚀 Starting media migration...");

    // Root uploads dir
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
        console.log("No public/uploads directory found.");
        return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    async function scanDir(dir: string) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                await scanDir(fullPath);
            } else {
                // It's a file
                try {
                    const relativePath = path.relative(uploadsDir, fullPath);
                    // public URL path: /uploads/2024/12/abc.jpg
                    // normalize for Windows/Unix
                    const publicPath = '/uploads/' + relativePath.split(path.sep).join('/');

                    // 1. Calculate Hash
                    const buffer = fs.readFileSync(fullPath);
                    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

                    // 2. Check if exists
                    const existing = await prisma.fileAsset.findUnique({ where: { hash } });
                    if (existing) {
                        console.log(`[SKIP] ${file} (Already exists)`);
                        skipCount++;
                        continue;
                    }

                    // 3. Register
                    await prisma.fileAsset.create({
                        data: {
                            filename: file, // Original name lost, use current filename
                            storedName: file,
                            mimeType: getMimeType(file),
                            size: stat.size,
                            path: publicPath,
                            provider: 'local',
                            hash: hash,
                            uploadedAt: stat.birthtime // Preserve original create time if possible
                        }
                    });
                    console.log(`[OK] ${file}`);
                    successCount++;

                } catch (e) {
                    console.error(`[ERROR] ${file}:`, e);
                    errorCount++;
                }
            }
        }
    }

    await scanDir(uploadsDir);

    console.log(`\n🎉 Migration Complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️ Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
}

migrate()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
