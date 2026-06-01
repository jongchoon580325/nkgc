import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const prisma = new PrismaClient();
const SQL_DUMP_PATH = path.join(process.cwd(), 'public/db_sql/20251129_greatpeace_DB_Backup.sql');

interface WpUser {
    id: number;
    username: string;
    email: string;
    name: string;
    registeredAt: Date;
}

interface WpUserMeta {
    userId: number;
    key: string;
    value: string;
}

async function migrateUsers() {
    console.log('🚀 Starting user migration...');

    const users = new Map<number, WpUser>();
    const userMeta = new Map<number, Record<string, string>>();

    const fileStream = fs.createReadStream(SQL_DUMP_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let isProcessingUsers = false;
    let isProcessingMeta = false;

    for await (const line of rl) {
        if (line.startsWith('INSERT INTO `wp_users`')) {
            const valuesPart = line.substring(line.indexOf('VALUES') + 7);
            const rows = splitRows(valuesPart);
            for (const row of rows) {
                const values = parseRow(row);
                if (values.length >= 10) {
                    const id = parseInt(values[0]);
                    users.set(id, {
                        id,
                        username: cleanString(values[1]),
                        email: cleanString(values[4]),
                        name: cleanString(values[9]), // display_name
                        registeredAt: new Date(cleanString(values[6])),
                    });
                }
            }
        }

        if (line.startsWith('INSERT INTO `wp_usermeta`')) {
            const valuesPart = line.substring(line.indexOf('VALUES') + 7);
            const rows = splitRows(valuesPart);
            for (const row of rows) {
                const values = parseRow(row);
                if (values.length >= 4) {
                    const userId = parseInt(values[1]);
                    const key = cleanString(values[2]);
                    const value = cleanString(values[3]);

                    if (!userMeta.has(userId)) {
                        userMeta.set(userId, {});
                    }
                    userMeta.get(userId)![key] = value;
                }
            }
        }
    }

    console.log(`Found ${users.size} users and metadata for ${userMeta.size} users.`);

    let successCount = 0;
    let errorCount = 0;

    for (const [id, user] of users) {
        const meta = userMeta.get(id) || {};

        const churchName = meta['church_name'] || '';
        const position = meta['duty_name'] || '교인'; // 기본값
        const phone = meta['mobile'] || meta['phone1'] || '';

        let role = 'member';
        if (position.includes('목사')) role = 'pastor';
        if (position.includes('장로')) role = 'elder';
        if (position.includes('전도사')) role = 'evangelist';

        // Check for admin capability (simplified check)
        if (meta['wp_capabilities'] && meta['wp_capabilities'].includes('administrator')) {
            role = 'admin';
        }

        // Skip if username is empty
        if (!user.username) continue;

        try {
            await prisma.user.upsert({
                where: { username: user.username },
                update: {
                    name: user.name,
                    email: user.email || undefined, // email이 비어있으면 업데이트 안 함 (unique constraint 때문)
                    phone: phone,
                    churchName: churchName,
                    position: position,
                    role: role,
                    isApproved: true, // 기존 회원은 승인 처리
                    createdAt: user.registeredAt,
                },
                create: {
                    username: user.username,
                    password: '$2a$10$PlaceholderPasswordForMigration', // 임시 비밀번호 (로그인 불가)
                    name: user.name,
                    email: user.email || null,
                    phone: phone,
                    churchName: churchName,
                    position: position,
                    role: role,
                    isApproved: true,
                    createdAt: user.registeredAt,
                },
            });
            successCount++;
            // console.log(`Migrated user: ${user.username} (${role})`);
        } catch (error) {
            console.error(`Failed to migrate user ${user.username}:`, error);
            errorCount++;
        }
    }

    console.log(`\nMigration complete. Success: ${successCount}, Errors: ${errorCount}`);
}

// Helper functions (reused from other scripts)
function splitRows(valuesStr: string): string[] {
    const rows: string[] = [];
    let currentRow = '';
    let inQuote = false;
    let escape = false;
    let depth = 0; // Parenthesis depth

    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];

        if (escape) {
            currentRow += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            currentRow += char;
            continue;
        }

        if (char === "'") {
            inQuote = !inQuote;
            currentRow += char;
            continue;
        }

        if (!inQuote) {
            if (char === '(') {
                if (depth === 0) currentRow = '(';
                else currentRow += char;
                depth++;
            } else if (char === ')') {
                depth--;
                currentRow += char;
                if (depth === 0) {
                    rows.push(currentRow);
                    currentRow = '';
                    // Skip comma and space after closing parenthesis
                    while (i + 1 < valuesStr.length && (valuesStr[i + 1] === ',' || valuesStr[i + 1] === ' ')) {
                        i++;
                    }
                }
            } else {
                if (depth > 0) currentRow += char;
            }
        } else {
            currentRow += char;
        }
    }
    return rows;
}

function parseRow(row: string): string[] {
    // Remove outer parentheses
    const content = row.substring(1, row.length - 1);
    const values: string[] = [];
    let currentVal = '';
    let inQuote = false;
    let escape = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (escape) {
            currentVal += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            // Don't add backslash to value if it's escaping a quote
            // But we might need it for other escapes. For simplicity, let's keep it if not quote
            // Actually, in SQL dump, \' becomes '
            continue;
        }

        if (char === "'") {
            inQuote = !inQuote;
            continue;
        }

        if (!inQuote && char === ',') {
            values.push(currentVal);
            currentVal = '';
            continue;
        }

        currentVal += char;
    }
    values.push(currentVal);
    return values;
}

function cleanString(str: string): string {
    if (!str) return '';
    return str.trim();
}

migrateUsers()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
