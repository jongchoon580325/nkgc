import fs from 'fs';
import readline from 'readline';
import path from 'path';

const SQL_DUMP_PATH = path.join(process.cwd(), 'public/db_sql/20251129_greatpeace_DB_Backup.sql');
const TARGET_BOARD_ID = 9; // 영상자료실

interface VideoPost {
    uid: number;
    title: string;
    content: string;
    date: string;
    member_display: string;
    category: string;
}

async function extractVideoPosts() {
    console.log('📹 Extracting all video posts (board_id=9) from SQL dump...\n');

    const fileStream = fs.createReadStream(SQL_DUMP_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    const videoPosts: VideoPost[] = [];
    let currentLine = '';

    for await (const line of rl) {
        currentLine += line;

        // 완전한 INSERT 문이 완성되었는지 체크 (;로 끝나면)
        if (currentLine.includes('INSERT INTO `wp_kboard_board_content`') && currentLine.endsWith(';')) {
            const posts = parseInsertLine(currentLine);
            videoPosts.push(...posts);
            currentLine = '';
        } else if (!currentLine.includes('INSERT INTO `wp_kboard_board_content`')) {
            currentLine = '';
        }
    }

    console.log(`\n✅ Found ${videoPosts.length} video posts\n`);

    // 결과 출력
    videoPosts.forEach((post, index) => {
        console.log(`${index + 1}. [UID: ${post.uid}] ${post.title}`);
        console.log(`   Author: ${post.member_display} | Date: ${post.date}`);
        console.log(`   Content length: ${post.content.length} chars`);
        console.log('');
    });

    return videoPosts;
}

function parseInsertLine(line: string): VideoPost[] {
    const posts: VideoPost[] = [];

    try {
        // VALUES 이후 부분 추출
        const valuesMatch = line.match(/VALUES\s+(.+);$/);
        if (!valuesMatch) return posts;

        const valuesStr = valuesMatch[1];

        // 각 row를 파싱 (매우 복잡한 escape 처리 필요)
        const rows = splitRows(valuesStr);

        for (const row of rows) {
            const values = parseRow(row);

            // board_id is typically at index 1
            if (values.length > 16 && values[1] === TARGET_BOARD_ID.toString()) {
                posts.push({
                    uid: parseInt(values[0]),
                    title: cleanString(values[5] || ''),
                    content: cleanString(values[6] || ''),
                    date: cleanString(values[8] || ''),
                    member_display: cleanString(values[7] || ''),
                    category: cleanString(values[16] || ''),
                });
            }
        }
    } catch (error) {
        console.error('Error parsing line:', error);
    }

    return posts;
}

function splitRows(valuesStr: string): string[] {
    const rows: string[] = [];
    let current = '';
    let inString = false;
    let escapeNext = false;
    let parenLevel = 0;

    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];

        if (escapeNext) {
            current += char;
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            current += char;
            continue;
        }

        if (char === "'" && !escapeNext) {
            inString = !inString;
        }

        if (!inString) {
            if (char === '(') parenLevel++;
            if (char === ')') parenLevel--;

            if (char === ',' && parenLevel === 0) {
                rows.push(current.trim());
                current = '';
                continue;
            }
        }

        current += char;
    }

    if (current.trim()) {
        rows.push(current.trim());
    }

    return rows;
}

function parseRow(row: string): string[] {
    const values: string[] = [];

    // Remove outer parentheses
    row = row.replace(/^\(/, '').replace(/\)$/, '');

    let current = '';
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (escapeNext) {
            current += char;
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            current += char;
            continue;
        }

        if (char === "'") {
            inString = !inString;
            continue;
        }

        if (!inString && char === ',') {
            values.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    if (current) {
        values.push(current);
    }

    return values;
}

function cleanString(str: string): string {
    return str
        .replace(/^'|'$/g, '')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n');
}

extractVideoPosts().catch(console.error);
