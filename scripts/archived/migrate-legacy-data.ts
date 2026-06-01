
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SQL_DUMP_PATH = path.join(process.cwd(), 'public/db_sql/20251129_greatpeace_DB_Backup.sql');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: npx tsx scripts/migrate-legacy-data.ts <board_id> <board_type>');
    console.error('Example: npx tsx scripts/migrate-legacy-data.ts 2 FORM_ADMIN');
    process.exit(1);
}

const TARGET_BOARD_ID = parseInt(args[0]);
const TARGET_BOARD_TYPE = args[1];

if (isNaN(TARGET_BOARD_ID)) {
    console.error('Error: board_id must be a number');
    process.exit(1);
}

interface KBoardPost {
    uid: number;
    board_id: number;
    title: string;
    content: string;
    date: string; // YYYYMMDDHHMMSS
    member_display: string;
    category1: string;
}

interface KBoardAttachment {
    uid: number;
    content_uid: number;
    file_name: string;
    file_path: string;
    file_size: number;
}

async function migrateData() {
    console.log('Starting migration for board:', TARGET_BOARD_TYPE);

    if (!fs.existsSync(SQL_DUMP_PATH)) {
        console.error('SQL dump file not found!');
        return;
    }

    // Clean up existing data for this board type
    console.log(`Cleaning up existing posts for board type: ${TARGET_BOARD_TYPE}...`);
    await prisma.post.deleteMany({
        where: { boardType: TARGET_BOARD_TYPE },
    });
    console.log('Cleanup complete.');

    const fileStream = fs.createReadStream(SQL_DUMP_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    const posts: KBoardPost[] = [];
    const attachments: KBoardAttachment[] = [];

    console.log('Parsing SQL dump...');

    let currentTable = '';
    let lineCount = 0;

    for await (const line of rl) {
        lineCount++;
        if (lineCount % 10000 === 0) process.stdout.write(`\rScanned ${lineCount} lines...`);

        if (line.startsWith('INSERT INTO `wp_kboard_board_content`')) {
            currentTable = 'content';
            parseContentInsert(line, posts);
        } else if (line.startsWith('INSERT INTO `wp_kboard_board_attached`')) {
            currentTable = 'attached';
            parseAttachedInsert(line, attachments);
        }
    }

    console.log(`\nFound ${posts.length} posts and ${attachments.length} attachments.`);

    // Filter attachments for our posts
    const postUids = new Set(posts.map(p => p.uid));
    const relevantAttachments = attachments.filter(a => postUids.has(a.content_uid));

    console.log(`Migrating ${posts.length} posts and ${relevantAttachments.length} relevant attachments...`);

    // Create default admin user if not exists (for author mapping)
    const defaultUser = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin',
            username: 'admin',
            password: 'hashed_password_placeholder', // Should be set properly
            role: 'ADMIN',
            phone: '010-0000-0000',
            churchName: 'Default Church',
            position: 'Admin',
        },
    });

    for (const post of posts) {
        // Parse date
        // Format: YYYYMMDDHHMMSS (e.g., 20150617115101)
        let createdAt = new Date();
        if (post.date && post.date.length >= 14) {
            const year = parseInt(post.date.substring(0, 4));
            const month = parseInt(post.date.substring(4, 6)) - 1;
            const day = parseInt(post.date.substring(6, 8));
            const hour = parseInt(post.date.substring(8, 10));
            const minute = parseInt(post.date.substring(10, 12));
            const second = parseInt(post.date.substring(12, 14));
            createdAt = new Date(year, month, day, hour, minute, second);
        }

        try {
            const createdPost = await prisma.post.create({
                data: {
                    title: post.title,
                    content: post.content,
                    boardType: TARGET_BOARD_TYPE,
                    createdAt: createdAt,
                    updatedAt: createdAt, // Use created date as updated date initially
                    authorId: defaultUser.id, // Map all to admin for now, or try to find user by name
                    authorName: post.member_display || null, // Preserve original author name
                    category: post.category1,
                    viewCount: 0, // Could parse 'view' column if needed
                },
            });

            // Find and create attachments
            const postAttachments = relevantAttachments.filter(a => a.content_uid === post.uid);
            for (const att of postAttachments) {
                await prisma.attachment.create({
                    data: {
                        postId: createdPost.id,
                        fileName: att.file_name,
                        fileUrl: att.file_path, // Note: This path might need adjustment relative to public dir
                        fileSize: att.file_size,
                        mimeType: 'application/octet-stream', // Could be inferred from file extension
                    },
                });
            }
            console.log(`Migrated post: ${post.title} (ID: ${createdPost.id})`);
        } catch (error) {
            console.error(`Failed to migrate post ${post.uid}:`, error);
        }
    }

    console.log('Migration complete.');
}

function parseContentInsert(line: string, posts: KBoardPost[]) {
    // Simple parser for VALUES (...), (...)
    // This is tricky with regex. We'll use a basic state machine or split by '),(' if safe.
    // Given the complexity, let's try a regex that matches the specific columns we need.
    // Structure: `uid`, `board_id`, ..., `title`, `content`, `date`, ...

    // Remove 'INSERT INTO ... VALUES '
    const valuesPart = line.substring(line.indexOf('VALUES') + 7);

    // Split by '),(' is risky if content has it.
    // But for this specific dump, let's try to iterate.

    // A safer way for this specific task without a full SQL parser:
    // We know the column indices.
    // uid: 0, board_id: 1, ..., title: 5, content: 6, date: 7, ...

    // We can use a library like 'sql-values-parser' but we can't install new packages easily.
    // Let's try a regex that captures the tuple.
    // \((.*?)\) matches a tuple? No, nested parens.

    // Let's assume standard mysqldump format.
    // We will use a simple character scanner.

    let currentVal = '';
    let inQuote = false;
    let escape = false;
    let values: string[] = [];
    let rowValues: string[][] = [];

    for (let i = 0; i < valuesPart.length; i++) {
        const char = valuesPart[i];

        if (escape) {
            currentVal += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            // Keep the backslash for now? Or handle escape sequences.
            // SQL dump usually escapes quotes with backslash.
            currentVal += char;
            continue;
        }

        if (char === "'" && !escape) {
            inQuote = !inQuote;
            currentVal += char;
            continue;
        }

        if (char === ',' && !inQuote) {
            // End of value
            values.push(cleanValue(currentVal));
            currentVal = '';
            continue;
        }

        if (char === '(' && !inQuote && values.length === 0 && currentVal.trim() === '') {
            // Start of row
            continue;
        }

        if (char === ')' && !inQuote) {
            // End of row
            values.push(cleanValue(currentVal));
            rowValues.push(values);
            values = [];
            currentVal = '';
            // Skip comma after )
            while (i + 1 < valuesPart.length && (valuesPart[i + 1] === ',' || valuesPart[i + 1] === ' ')) {
                i++;
            }
            continue;
        }

        currentVal += char;
    }

    // Process rows
    for (const row of rowValues) {
        if (row.length > 1) {
            const boardId = parseInt(row[1]);
            if (boardId === TARGET_BOARD_ID) {
                posts.push({
                    uid: parseInt(row[0]),
                    board_id: boardId,
                    title: row[5],
                    content: row[6],
                    date: row[7],
                    member_display: row[4], // Check index
                    category1: row[16] // Check index
                });
            }
        }
    }
}

function parseAttachedInsert(line: string, attachments: KBoardAttachment[]) {
    // Similar parser
    const valuesPart = line.substring(line.indexOf('VALUES') + 7);

    let currentVal = '';
    let inQuote = false;
    let escape = false;
    let values: string[] = [];
    let rowValues: string[][] = [];

    for (let i = 0; i < valuesPart.length; i++) {
        const char = valuesPart[i];
        if (escape) { currentVal += char; escape = false; continue; }
        if (char === '\\') { escape = true; currentVal += char; continue; }
        if (char === "'" && !escape) { inQuote = !inQuote; currentVal += char; continue; }
        if (char === ',' && !inQuote) { values.push(cleanValue(currentVal)); currentVal = ''; continue; }
        if (char === '(' && !inQuote && values.length === 0 && currentVal.trim() === '') { continue; }
        if (char === ')' && !inQuote) {
            values.push(cleanValue(currentVal));
            rowValues.push(values);
            values = [];
            currentVal = '';
            while (i + 1 < valuesPart.length && (valuesPart[i + 1] === ',' || valuesPart[i + 1] === ' ')) { i++; }
            continue;
        }
        currentVal += char;
    }

    for (const row of rowValues) {
        if (row.length > 7) {
            attachments.push({
                uid: parseInt(row[0]),
                content_uid: parseInt(row[1]),
                file_path: row[4],
                file_name: row[5],
                file_size: parseInt(row[7]) || 0
            });
        }
    }
}

function cleanValue(val: string): string {
    val = val.trim();
    if (val.startsWith("'") && val.endsWith("'")) {
        val = val.substring(1, val.length - 1);
        // Unescape SQL escapes
        val = val.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    return val;
}

migrateData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
