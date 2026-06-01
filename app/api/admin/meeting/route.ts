import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BOARD_TYPES } from '@/lib/board-config';

// Define the board type for Meeting Minutes
const BOARD_TYPE = BOARD_TYPES.MEETING_MINUTES;

// GET: 자료 목록 조회
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 페이지네이션 처리
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        const where: any = {
            boardType: BOARD_TYPE,
        };

        if (search) {
            where.title = { contains: search };
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    attachments: true,
                },
            }),
            prisma.post.count({ where }),
        ]);

        return NextResponse.json({
            posts,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error('Error fetching meeting minutes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: 자료 등록
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, attachments } = body;

        if (!title) {
            return NextResponse.json({ error: '제목은 필수입니다.' }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                title,
                content: '', // 내용은 선택사항이므로 빈 문자열
                boardType: BOARD_TYPE,
                authorId: parseInt(session.user.id),
                authorName: session.user.name || '관리자',
                attachments: {
                    create: attachments?.map((att: any) => ({
                        fileName: att.fileName,
                        fileUrl: att.fileUrl,
                        fileSize: att.fileSize,
                        mimeType: att.mimeType,
                    })) || [],
                },
            },
            include: {
                attachments: true,
            },
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error creating meeting minutes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: 자료 삭제
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.post.delete({
            where: {
                id: parseInt(id),
                boardType: BOARD_TYPE,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting meeting minutes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: 자료 수정
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, title, attachments } = body;

        if (!id || !title) {
            return NextResponse.json({ error: 'ID and Title are required' }, { status: 400 });
        }

        // 트랜잭션으로 기존 첨부파일 삭제 후 재생성
        const post = await prisma.$transaction(async (tx) => {
            // 1. 기존 첨부파일 삭제
            await tx.attachment.deleteMany({
                where: { postId: id },
            });

            // 2. 게시글 업데이트 및 새 첨부파일 생성
            return await tx.post.update({
                where: {
                    id: id,
                    boardType: BOARD_TYPE,
                },
                data: {
                    title,
                    attachments: {
                        create: attachments?.map((att: any) => ({
                            fileName: att.fileName,
                            fileUrl: att.fileUrl,
                            fileSize: att.fileSize,
                            mimeType: att.mimeType,
                        })) || [],
                    },
                },
                include: {
                    attachments: true,
                },
            });
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error updating meeting minutes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
