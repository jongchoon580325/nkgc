import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Papa from 'papaparse';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';

// CSV Template structures for each target type
const CSV_TEMPLATES = {
    'standing-committees': {
        headers: ['부서명', '부장직함', '부장이름', '부장직분', '서기이름', '서기직분', '부원', '회기', '정렬순서'],
        example: ['공천부', '부장', '홍길동', '목사', '김철수', '장로', '이영희,박민수,정수진', '48회기 – 49회기 (2025년-2026년)', '1']
    },
    'fees-status': {
        headers: ['시찰', '교회명', '담임목사', '월상회비', '연상회비'],
        example: ['남부', '사랑교회', '홍길동', '50000', '600000']
    },
    'members': {
        headers: ['이름', '교회명', '직분'],
        example: ['홍길동', '사랑교회', '목사']
    },
    'current-officers': {
        headers: ['직책', '이름', '직분', '교회명', '사진'],
        example: ['노회장', '홍길동', '목사', '사랑교회', '']
    },
    'past-officers': {
        headers: ['연도', '교회명', '노회장', '부노회장', '서기', '부서기', '회록서기', '부회록서기', '회계', '부회계'],
        example: ['2024', '서광교회', '홍길동', '김철수', '이영희', '박민수', '정수진', '최영수', '강민호', '조영수']
    },
    'inspections': {
        headers: ['시찰ID', '시찰명', '시찰장', '시찰장직분', '서기', '서기직분', '설명', '교회명', '담임목사', '주소', '전화번호', '휴대전화', '이메일'],
        example: [] // Dynamic example
    },
    'organizations': {
        headers: ['기관ID', '기관명', '회장', '서기', '임원구분', '임원이름', '임원직분', '임원교회', '임원연락처', '행사월', '행사명', '행사일시', '행사장소', '행사비고'],
        example: [] // Dynamic example
    }
};

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || session.user.role?.toLowerCase() !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const target = searchParams.get('target');

        if (!target || !CSV_TEMPLATES[target as keyof typeof CSV_TEMPLATES]) {
            return NextResponse.json(
                { error: 'Invalid target' },
                { status: 400 }
            );
        }

        const template = CSV_TEMPLATES[target as keyof typeof CSV_TEMPLATES];

        // Create CSV content
        let csvContent = '';

        if (target === 'inspections') {
            // ... (existing inspections logic)
            const filePath = path.join(process.cwd(), 'data', 'inspections.json');
            let inspectionsData = [];
            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                inspectionsData = JSON.parse(fileContent);
            } catch (error) {
                console.error('Failed to read inspections data for template:', error);
            }

            const rows = [];
            rows.push(template.headers.join(','));

            inspectionsData.forEach((inspection: any) => {
                if (inspection.churches && inspection.churches.length > 0) {
                    inspection.churches.forEach((church: any) => {
                        const row = [
                            inspection.id,
                            inspection.name,
                            inspection.leader?.name || '',
                            inspection.leader?.title || '',
                            inspection.secretary?.name || '',
                            inspection.secretary?.title || '',
                            inspection.description || '',
                            church.name,
                            church.pastor,
                            church.address,
                            church.phone,
                            church.mobile,
                            church.email || ''
                        ].map(field => `"${String(field).replace(/"/g, '""')}"`);
                        rows.push(row.join(','));
                    });
                } else {
                    const row = [
                        inspection.id,
                        inspection.name,
                        inspection.leader?.name || '',
                        inspection.leader?.title || '',
                        inspection.secretary?.name || '',
                        inspection.secretary?.title || '',
                        inspection.description || '',
                        '', '', '', '', '', ''
                    ].map(field => `"${String(field).replace(/"/g, '""')}"`);
                    rows.push(row.join(','));
                }
            });
            csvContent = rows.join('\n');

        } else if (target === 'standing-committees') {
            const committees = await prisma.standingCommittee.findMany({
                orderBy: { displayOrder: 'asc' }
            });

            if (committees.length > 0) {
                const rows = [];
                rows.push(template.headers.join(','));
                committees.forEach(committee => {
                    const row = [
                        committee.name,
                        committee.headTitle,
                        committee.head,
                        committee.headRole,
                        committee.secretary,
                        committee.secretaryRole,
                        committee.members,
                        committee.term,
                        committee.displayOrder
                    ].map(field => `"${String(field).replace(/"/g, '""')}"`);
                    rows.push(row.join(','));
                });
                csvContent = rows.join('\n');
            } else {
                csvContent = [template.headers.join(','), template.example.join(',')].join('\n');
            }

        } else if (target === 'fees-status') {
            const fees = await prisma.feeStatus.findMany({
                orderBy: { inspection: 'asc' }
            });

            if (fees.length > 0) {
                const rows = [];
                rows.push(template.headers.join(','));
                fees.forEach(fee => {
                    const row = [
                        fee.inspection,
                        fee.churchName,
                        fee.pastorName,
                        fee.monthlyFee,
                        fee.annualFee
                    ].map(field => `"${String(field).replace(/"/g, '""')}"`);
                    rows.push(row.join(','));
                });
                csvContent = rows.join('\n');
            } else {
                csvContent = [template.headers.join(','), template.example.join(',')].join('\n');
            }

        } else if (target === 'members') {
            const members = await prisma.user.findMany({
                where: { role: { in: ['pastor', 'elder'] } },
                orderBy: { name: 'asc' }
            });

            if (members.length > 0) {
                const rows = [];
                rows.push(template.headers.join(','));
                members.forEach(member => {
                    const row = [
                        member.name,
                        member.churchName,
                        member.position
                    ].map(field => `"${String(field).replace(/"/g, '""')}"`);
                    rows.push(row.join(','));
                });
                csvContent = rows.join('\n');
            } else {
                csvContent = [template.headers.join(','), template.example.join(',')].join('\n');
            }

        } else if (target === 'current-officers') {
            const filePath = path.join(process.cwd(), 'data', 'officers.json');
            let officersData = { officers: [] };
            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                officersData = JSON.parse(fileContent);
            } catch (error) {
                console.error('Failed to read officers data:', error);
            }

            if (officersData.officers && officersData.officers.length > 0) {
                const rows = [];
                rows.push(template.headers.join(','));
                officersData.officers.forEach((officer: any) => {
                    const row = [
                        officer.position,
                        officer.name,
                        officer.title,
                        officer.church,
                        officer.photo
                    ].map(field => `"${String(field).replace(/"/g, '""')}"`);
                    rows.push(row.join(','));
                });
                csvContent = rows.join('\n');
            } else {
                csvContent = [template.headers.join(','), template.example.join(',')].join('\n');
            }

        } else if (target === 'past-officers') {
            const filePath = path.join(process.cwd(), 'data', 'past-officers.json');
            let pastOfficersData = { years: [] };
            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                pastOfficersData = JSON.parse(fileContent);
            } catch (error) {
                console.error('Failed to read past officers data:', error);
            }

            if (pastOfficersData.years && pastOfficersData.years.length > 0) {
                const rows = [];
                rows.push(template.headers.join(','));
                pastOfficersData.years.forEach((yearData: any) => {
                    const row = [
                        yearData.year,
                        yearData.church,
                        yearData.officers['노회장'] || '',
                        yearData.officers['부노회장'] || '',
                        yearData.officers['서기'] || '',
                        yearData.officers['부서기'] || '',
                        yearData.officers['회록서기'] || '',
                        yearData.officers['부회록서기'] || '',
                        yearData.officers['회계'] || '',
                        yearData.officers['부회계'] || ''
                    ].map(field => `"${String(field).replace(/"/g, '""')}"`);
                    rows.push(row.join(','));
                });
                csvContent = rows.join('\n');
            } else {
                csvContent = [template.headers.join(','), template.example.join(',')].join('\n');
            }

        } else if (target === 'organizations') {
            const filePath = path.join(process.cwd(), 'data', 'organizations.json');
            let orgData = { organizations: [] };
            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                orgData = JSON.parse(fileContent);
            } catch (error) {
                console.error('Failed to read organizations data:', error);
            }

            if (orgData.organizations && orgData.organizations.length > 0) {
                const rows = [];
                rows.push(template.headers.join(','));

                orgData.organizations.forEach((org: any) => {
                    // For each organization, we need to create rows for officers and events
                    const maxRows = Math.max(
                        org.officers?.length || 0,
                        org.events?.length || 0,
                        1 // At least one row for basic info
                    );

                    for (let i = 0; i < maxRows; i++) {
                        const officer = org.officers?.[i];
                        const event = org.events?.[i];

                        const row = [
                            i === 0 ? org.id : '', // Only first row has org ID
                            i === 0 ? org.name : '',
                            i === 0 ? org.president || '' : '',
                            i === 0 ? org.secretary || '' : '',
                            officer?.position || '',
                            officer?.name || '',
                            officer?.role || '',
                            officer?.church || '',
                            officer?.phone || '',
                            event?.month || '',
                            event?.name || '',
                            event?.datetime || '',
                            event?.location || '',
                            event?.notes || ''
                        ].map(field => `"${String(field).replace(/"/g, '""')}"`);
                        rows.push(row.join(','));
                    }
                });
                csvContent = rows.join('\n');
            } else {
                csvContent = [template.headers.join(','), template.example.join(',')].join('\n');
            }

        } else {
            // Default static example
            csvContent = [
                template.headers.join(','),
                template.example.join(',')
            ].join('\n');
        }

        // Add BOM for Korean characters in Excel
        const bom = '\uFEFF';
        const buffer = Buffer.from(bom + csvContent, 'utf-8');

        return new Response(buffer, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${target}-template.csv"`,
            },
        });

    } catch (error) {
        console.error('Template download error:', error);
        return NextResponse.json(
            { error: 'Failed to generate template' },
            { status: 500 }
        );
    }
}

// CSV Import
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || session.user.role?.toLowerCase() !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const target = formData.get('target') as string;
        const file = formData.get('file') as File;

        if (!file || !target) {
            return NextResponse.json(
                { error: 'Missing file or target' },
                { status: 400 }
            );
        }

        // Parse CSV
        const text = await file.text();
        const Papa = (await import('papaparse')).default;
        const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
        });

        if (parsed.errors.length > 0) {
            return NextResponse.json(
                { error: 'CSV parsing failed', details: parsed.errors },
                { status: 400 }
            );
        }

        console.log(`Importing ${parsed.data.length} records for ${target}`);

        // Process based on target type
        switch (target) {
            case 'standing-committees':
                await importStandingCommittees(parsed.data);
                break;
            case 'fees-status':
                await importFeesStatus(parsed.data);
                break;
            case 'members':
                await importMembers(parsed.data);
                break;
            case 'current-officers':
                await importCurrentOfficers(parsed.data);
                break;
            case 'past-officers':
                await importPastOfficers(parsed.data);
                break;
            case 'inspections':
                await importInspections(parsed.data);
                break;
            case 'organizations':
                await importOrganizations(parsed.data);
                break;
            default:
                return NextResponse.json(
                    { error: 'Unsupported target type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            imported: parsed.data.length,
            message: `Successfully imported ${parsed.data.length} records`
        });

    } catch (error) {
        console.error('CSV import error:', error);
        return NextResponse.json(
            { error: 'Failed to import data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Import functions
async function importStandingCommittees(data: any[]) {
    // Delete existing data
    await prisma.standingCommittee.deleteMany({});

    // Insert new data
    const records = data.map((row, index) => ({
        name: row['부서명'] || '',
        headTitle: row['부장직함'] || '부장',
        head: row['부장이름'] || '',
        headRole: row['부장직분'] || '',
        secretary: row['서기이름'] || '',
        secretaryRole: row['서기직분'] || '',
        members: row['부원'] || '',
        term: row['회기'] || '',
        displayOrder: parseInt(row['정렬순서']) || index + 1
    }));

    await prisma.standingCommittee.createMany({
        data: records
    });
    console.log(`Imported ${records.length} standing committees`);
}

async function importFeesStatus(data: any[]) {
    // Delete existing data
    await prisma.feeStatus.deleteMany({});

    // Insert new data
    const records = data.map(row => {
        let inspection = row['시찰'] || '';
        // Normalize inspection name: remove '시찰' suffix if present
        // e.g., '남부시찰' -> '남부'
        if (inspection.endsWith('시찰')) {
            inspection = inspection.replace('시찰', '');
        }

        return {
            inspection: inspection,
            churchName: row['교회명'] || '',
            pastorName: row['담임목사'] || '',
            monthlyFee: parseInt(row['월상회비']) || 0,
            annualFee: parseInt(row['연상회비']) || 0
        };
    });

    await prisma.feeStatus.createMany({
        data: records
    });

    console.log(`Imported ${records.length} fee statuses`);
}

async function importMembers(data: any[]) {
    // Delete existing members (pastors and elders only)
    // We do NOT delete admin users
    await prisma.user.deleteMany({
        where: {
            role: { in: ['pastor', 'elder'] }
        }
    });

    const defaultPassword = await bcrypt.hash('presbytery2024', 10);
    const timestamp = Date.now();

    const records = data.map((row, index) => {
        // Infer role from position (직분)
        let role = 'member';
        const position = row['직분'] || '';

        // Keywords for Pastor
        const pastorKeywords = ['목사', '강도사', '전도사', '위임', '담임', '부목', '시무', '협동', '원로', '은퇴', '공로', '선교'];
        // Keywords for Elder
        const elderKeywords = ['장로'];

        if (pastorKeywords.some(keyword => position.includes(keyword))) {
            role = 'pastor';
        } else if (elderKeywords.some(keyword => position.includes(keyword))) {
            role = 'elder';
        }

        // Generate unique username
        const username = `${role}_${timestamp}_${index}`;

        return {
            username: username,
            password: defaultPassword,
            name: row['이름'] || '',
            churchName: row['교회명'] || '',
            position: position,
            phone: '010-0000-0000', // Default phone as it's removed from CSV
            role: role,
            isApproved: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    });

    await prisma.user.createMany({
        data: records
    });
    console.log(`Imported ${records.length} members`);
}

async function importCurrentOfficers(data: any[]) {
    const officers = data.map(row => ({
        position: row['직책'] || '',
        name: row['이름'] || '',
        title: row['직분'] || '',
        church: row['교회명'] || '',
        photo: row['사진'] || ''
    }));

    // Read existing file to preserve 'term'
    const filePath = path.join(process.cwd(), 'data', 'officers.json');
    let existingData = { term: "제 48-49회기", officers: [] };
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
    } catch (error) {
        // File might not exist or be empty, use default
    }

    const newData = {
        ...existingData,
        officers: officers
    };

    await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log(`Imported ${officers.length} current officers`);
}

async function importPastOfficers(data: any[]) {
    const years = data.map(row => ({
        year: row['연도'] || '',
        church: row['교회명'] || '',
        officers: {
            "노회장": row['노회장'] || '',
            "부노회장": row['부노회장'] || '',
            "서기": row['서기'] || '',
            "부서기": row['부서기'] || '',
            "회록서기": row['회록서기'] || '',
            "부회록서기": row['부회록서기'] || '',
            "회계": row['회계'] || '',
            "부회계": row['부회계'] || ''
        }
    }));

    const newData = {
        years: years
    };

    const filePath = path.join(process.cwd(), 'data', 'past-officers.json');
    await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log(`Imported ${years.length} past officers years`);
}

async function importInspections(data: any[]) {
    // Group by inspection ID
    const inspectionsMap = new Map();

    data.forEach(row => {
        const id = row['시찰ID'];
        if (!id) return;

        if (!inspectionsMap.has(id)) {
            inspectionsMap.set(id, {
                id: id,
                name: row['시찰명'] || '',
                leader: {
                    name: row['시찰장'] || '',
                    title: row['시찰장직분'] || ''
                },
                secretary: {
                    name: row['서기'] || '',
                    title: row['서기직분'] || ''
                },
                description: row['설명'] || '',
                churches: []
            });
        }

        const churchName = row['교회명'];
        if (churchName) {
            const inspection = inspectionsMap.get(id);
            inspection.churches.push({
                name: churchName,
                pastor: row['담임목사'] || '',
                address: row['주소'] || '',
                phone: row['전화번호'] || '',
                mobile: row['휴대전화'] || '',
                email: row['이메일'] || ''
            });
        }
    });

    const newData = Array.from(inspectionsMap.values());
    const filePath = path.join(process.cwd(), 'data', 'inspections.json');
    await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log(`Imported ${newData.length} inspections`);
}

async function importOrganizations(data: any[]) {
    // Group by organization ID
    const orgsMap = new Map();

    data.forEach(row => {
        const id = row['기관ID'];
        if (!id) return;

        if (!orgsMap.has(id)) {
            orgsMap.set(id, {
                id: id,
                name: row['기관명'] || '',
                president: row['회장'] || '',
                secretary: row['서기'] || '',
                officers: [],
                events: []
            });
        }

        const org = orgsMap.get(id);

        // Add officer if position is provided
        const officerPosition = row['임원구분'];
        if (officerPosition) {
            org.officers.push({
                position: officerPosition,
                name: row['임원이름'] || '',
                role: row['임원직분'] || '',
                church: row['임원교회'] || '',
                phone: row['임원연락처'] || ''
            });
        }

        // Add event if month is provided
        const eventMonth = row['행사월'];
        if (eventMonth) {
            org.events.push({
                month: eventMonth,
                name: row['행사명'] || '',
                datetime: row['행사일시'] || '',
                location: row['행사장소'] || '',
                notes: row['행사비고'] || ''
            });
        }
    });

    const newData = {
        organizations: Array.from(orgsMap.values())
    };

    const filePath = path.join(process.cwd(), 'data', 'organizations.json');
    await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log(`Imported ${newData.organizations.length} organizations`);
}
