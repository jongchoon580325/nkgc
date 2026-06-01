import fs from 'fs';
import readline from 'readline';
import path from 'path';

const SQL_DUMP_PATH = path.join(process.cwd(), 'public/db_sql/20251129_greatpeace_DB_Backup.sql');

async function inspectExam() {
    console.log('Inspecting Board ID 15 and 2 for Exam related content...');

    const fileStream = fs.createReadStream(SQL_DUMP_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        if (line.startsWith('INSERT INTO `wp_kboard_board_content`')) {
            parseContentInsert(line);
        }
    }
}

function parseContentInsert(line: string) {
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
        if (row.length > 5) {
            const boardId = parseInt(row[1]);
            const title = row[5];
            // Check index for category. In migrate script: category1 is row[16] if available.
            // Let's check row length.
            const category = row.length > 16 ? row[16] : 'N/A';

            if (boardId === 15) {
                console.log(`[ID 15] ${title} (Category: ${category})`);
            }
            if (boardId === 2 && (title.includes('고시') || title.includes('응시'))) {
                console.log(`[ID 2] ${title} (Category: ${category})`);
            }
        }
    }
}

function cleanValue(val: string): string {
    val = val.trim();
    if (val.startsWith("'") && val.endsWith("'")) {
        val = val.substring(1, val.length - 1);
        val = val.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    return val;
}

inspectExam();
