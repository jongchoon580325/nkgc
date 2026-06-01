const fs = require('fs');
const path = require('path');

const rawDataPath = path.join(__dirname, '../data/raw_past_officers.json');
const targetDataPath = path.join(__dirname, '../data/past-officers.json');

const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const processedData = {
    years: rawData.map(item => {
        // Combine Vice Moderators
        let viceModerator = '';
        const pastor = item['부노회장\n(목사)'] || '';
        const elder = item['부노회장\n(장로)'] || item['부노회장\n(장ロ)'] || ''; // Handle typo in 2004 data

        if (pastor && elder) {
            viceModerator = `${pastor}(목사), ${elder}(장로)`;
        } else if (pastor) {
            viceModerator = `${pastor}(목사)`;
        } else if (elder) {
            viceModerator = `${elder}(장로)`;
        }

        return {
            year: item['년도'],
            church: item['노회\n장소'],
            officers: {
                "노회장": item['노회장'],
                "부노회장": viceModerator,
                "서기": item['서기'],
                "부서기": item['부서기'],
                "회록서기": item['회록\n서기'],
                "부회록서기": item['부회록\n서기'],
                "회계": item['회계'],
                "부회계": item['부회계']
            }
        };
    })
};

fs.writeFileSync(targetDataPath, JSON.stringify(processedData, null, 2), 'utf8');
console.log('Successfully processed and updated past-officers.json');
