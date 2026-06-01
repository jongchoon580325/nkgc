
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const SQL_DUMP_PATH = path.join(process.cwd(), 'public/db_sql/20251129_greatpeace_DB_Backup.sql');

async function analyzeDump() {
    console.log(`Analyzing SQL dump at: ${SQL_DUMP_PATH}`);

    if (!fs.existsSync(SQL_DUMP_PATH)) {
        console.error('SQL dump file not found!');
        return;
    }

    const fileStream = fs.createReadStream(SQL_DUMP_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    console.log('Scanning for KBoard settings...');

    for await (const line of rl) {
        if (line.startsWith('INSERT INTO `wp_kboard_board_setting`')) {
            // Print the values to identify board IDs and names
            console.log('Found KBoard Setting:', line.substring(0, 500));
        }
    }

    console.log('\nDone.');
}

analyzeDump().catch(console.error);
