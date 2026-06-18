import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BOARD_TYPES } from '@/lib/board-config';

const BOARD_TYPE = BOARD_TYPES.MEETING_MINUTES;

// GET /api/admin/meeting/backup?format=json
// 전체 노회록 목록을 JSON 파일로 내보내기
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const posts = await prisma.post.findMany({
            where: { boardType: BOARD_TYPE },
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
            include: { attachments: true },
        });

        const exportData = {
            exportedAt: new Date().toISOString(),
            count: posts.length,
            data: posts.map(p => ({
                title: p.title,
                displayOrder: p.displayOrder,
                attachments: p.attachments.map(a => ({
                    fileName: a.fileName,
                    fileUrl: a.fileUrl,
                    fileSize: a.fileSize,
                    mimeType: a.mimeType,
                })),
            })),
        };

        const json = JSON.stringify(exportData, null, 2);
        const dateStr = new Date().toISOString().split('T')[0];

        return new NextResponse(json, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="meeting_export_${dateStr}.json"`,
            },
        });
    } catch (error) {
        console.error('노회록 내보내기 오류:', error);
        return NextResponse.json({ error: '내보내기 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// POST /api/admin/meeting/backup
// JSON 파일을 가져와 DB에 반영
// FormData: file (JSON), mode ('merge' | 'overwrite')
// merge    — title 기준 중복 제거, 새 항목만 추가
// overwrite — 기존 전체 삭제 후 재삽입
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const mode = (formData.get('mode') as string) || 'merge';

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
        }

        const text = await file.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            return NextResponse.json({ error: '유효하지 않은 JSON 파일입니다.' }, { status: 400 });
        }

        type RawRecord = { title?: unknown; displayOrder?: unknown; attachments?: unknown[] };
        const records: RawRecord[] = Array.isArray(parsed)
            ? (parsed as RawRecord[])
            : Array.isArray((parsed as { data?: unknown }).data)
                ? ((parsed as { data: RawRecord[] }).data)
                : [];

        if (records.length === 0) {
            return NextResponse.json({ error: '가져올 데이터가 없습니다.' }, { status: 400 });
        }

        const isValid = records.every(r => typeof r.title === 'string' && r.title.trim() !== '');
        if (!isValid) {
            return NextResponse.json({ error: '데이터 형식이 올바르지 않습니다. (title 누락)' }, { status: 400 });
        }

        const authorId = parseInt((session.user as { id: string }).id);

        if (mode === 'overwrite') {
            await prisma.$transaction(async (tx) => {
                const existing = await tx.post.findMany({
                    where: { boardType: BOARD_TYPE },
                    select: { id: true },
                });
                const ids = existing.map(p => p.id);
                await tx.attachment.deleteMany({ where: { postId: { in: ids } } });
                await tx.post.deleteMany({ where: { boardType: BOARD_TYPE } });

                for (let i = 0; i < records.length; i++) {
                    const r = records[i];
                    const atts = Array.isArray(r.attachments) ? r.attachments as Array<Record<string, unknown>> : [];
                    await tx.post.create({
                        data: {
                            boardType: BOARD_TYPE,
                            title: String(r.title),
                            content: '',
                            authorId,
                            authorName: session.user.name || '관리자',
                            displayOrder: r.displayOrder != null ? Number(r.displayOrder) : i,
                            attachments: {
                                create: atts.map(a => ({
                                    fileName: String(a.fileName ?? ''),
                                    fileUrl: String(a.fileUrl ?? ''),
                                    fileSize: a.fileSize != null ? Number(a.fileSize) : 0,
                                    mimeType: String(a.mimeType ?? 'application/octet-stream'),
                                })),
                            },
                        },
                    });
                }
            });

            return NextResponse.json({
                success: true,
                message: `기존 데이터를 삭제하고 ${records.length}개 노회록을 가져왔습니다.`,
            });
        } else {
            // merge: title 기준 중복 제거
            const existing = await prisma.post.findMany({
                where: { boardType: BOARD_TYPE },
                select: { title: true },
            });
            const existingTitles = new Set(existing.map(p => p.title));

            const newRecords = records.filter(r => !existingTitles.has(String(r.title)));
            const skipped = records.length - newRecords.length;

            for (let i = 0; i < newRecords.length; i++) {
                const r = newRecords[i];
                const atts = Array.isArray(r.attachments) ? r.attachments as Array<Record<string, unknown>> : [];
                await prisma.post.create({
                    data: {
                        boardType: BOARD_TYPE,
                        title: String(r.title),
                        content: '',
                        authorId,
                        authorName: session.user.name || '관리자',
                        displayOrder: r.displayOrder != null ? Number(r.displayOrder) : i,
                        attachments: {
                            create: atts.map(a => ({
                                fileName: String(a.fileName ?? ''),
                                fileUrl: String(a.fileUrl ?? ''),
                                fileSize: a.fileSize != null ? Number(a.fileSize) : 0,
                                mimeType: String(a.mimeType ?? 'application/octet-stream'),
                            })),
                        },
                    },
                });
            }

            return NextResponse.json({
                success: true,
                message: skipped > 0
                    ? `${newRecords.length}개 노회록을 추가했습니다. (${skipped}개 중복 건너뜀)`
                    : `${newRecords.length}개 노회록을 추가했습니다.`,
            });
        }
    } catch (error) {
        console.error('노회록 가져오기 오류:', error);
        return NextResponse.json({ error: '가져오기 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
