import fs from 'fs';
import readline from 'readline';
import path from 'path';

const SQL_DUMP_PATH = path.join(process.cwd(), 'public/db_sql/20251129_greatpeace_DB_Backup.sql');

async function scanBoards() {
    console.log('Scanning boards from SQL dump...');

    const fileStream = fs.createReadStream(SQL_DUMP_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    const boardSamples: Record<number, string[]> = {};
    const boardCounts: Record<number, number> = {};

    for await (const line of rl) {
        if (line.startsWith('INSERT INTO `wp_kboard_board_content`')) {
            parseContentInsert(line, boardSamples, boardCounts);
        }
    }

    console.log('\n--- Board Scan Results ---');
    const sortedIds = Object.keys(boardSamples).map(Number).sort((a, b) => a - b);

    for (const id of sortedIds) {
        console.log(`\nBoard ID: ${id} (Total Posts: ${boardCounts[id]})`);
        console.log('Sample Titles:');
        boardSamples[id].forEach(title => console.log(`  - ${title}`));
    }
}

function parseContentInsert(line: string, samples: Record<number, string[]>, counts: Record<number, number>) {
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

            if (!counts[boardId]) counts[boardId] = 0;
            counts[boardId]++;

            if (!samples[boardId]) samples[boardId] = [];
            if (samples[boardId].length < 5) {
                samples[boardId].push(title);
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

scanBoards();
