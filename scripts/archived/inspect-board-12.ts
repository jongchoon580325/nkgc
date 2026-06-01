import fs from 'fs';
import readline from 'readline';
import path from 'path';

const SQL_DUMP_PATH = path.join(process.cwd(), 'public/db_sql/20251129_greatpeace_DB_Backup.sql');
const TARGET_BOARD_ID = 12; // 자립위원회서식

async function extractSelfPosts() {
    console.log('Extracting posts for board_id=12...\n');

    const fileStream = fs.createReadStream(SQL_DUMP_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        if (line.includes(`VALUES (${TARGET_BOARD_ID},`) || line.includes(`(${TARGET_BOARD_ID},`)) {
            // 간단히 라인 전체를 출력해서 구조 확인
            if (line.includes('INSERT INTO `wp_kboard_board_content`')) {
                console.log(line.substring(0, 500)); // 너무 기니까 앞부분만
            }
        }
    }
}

extractSelfPosts().catch(console.error);
