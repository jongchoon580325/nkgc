import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const boardType = searchParams.get('type') || undefined;

        const skip = (page - 1) * limit;

        const whereClause: any = {};

        // 게시판 타입 필터링
        if (boardType) {
            whereClause.boardType = boardType;
        }

        // 검색 필터링
        if (search) {
            whereClause.OR = [
                { title: { contains: search } }, // SQLite는 대소문자 구분 없음 (기본적으로)
                { content: { contains: search } }
            ];
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: whereClause,
                include: {
                    author: {
                        select: {
                            username: true,
                            name: true,
                            churchName: true,
                        }
                    },
                    _count: {
                        select: { comments: true }
                    },
                    attachments: true,
                },
                orderBy: [
                    { isNotice: 'desc' }, // 공지사항 우선
                    { createdAt: 'desc' } // 최신순
                ],
                skip,
                take: limit
            }),
            prisma.post.count({ where: whereClause })
        ]);

        return NextResponse.json({
            posts,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        console.log('Post creation - Session:', session?.user);

        if (!session || !session.user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, boardType, category, isNotice, attachments, authorName } = body;

        console.log('Post creation - Request body:', { title, boardType, category, isNotice, authorName, attachmentCount: attachments?.length });

        if (!title || !content || !boardType) {
            return NextResponse.json(
                { error: '제목, 내용, 게시판 타입은 필수입니다.' },
                { status: 400 }
            );
        }

        // 관리자 권한 체크 (공지사항 등록 시)
        const userRole = session.user.role;
        const isAdmin = userRole === 'admin' || userRole === 'ADMIN';

        if (isNotice && !isAdmin) {
            return NextResponse.json(
                { error: '공지사항은 관리자만 등록할 수 있습니다.' },
                { status: 403 }
            );
        }

        // 게시판별 쓰기 권한 체크
        const adminOnlyBoards = ['NOTICE', 'FORM_ADMIN', 'FORM_SELF'];
        if (adminOnlyBoards.includes(boardType) && !isAdmin) {
            return NextResponse.json(
                { error: '이 게시판에는 관리자만 글을 쓸 수 있습니다.' },
                { status: 403 }
            );
        }

        // Ensure authorId is a valid number
        const authorId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
        console.log('Post creation - Author ID:', authorId, typeof authorId);

        if (isNaN(authorId)) {
            console.error('Invalid author ID:', session.user.id);
            return NextResponse.json(
                { error: '사용자 정보가 올바르지 않습니다.' },
                { status: 400 }
            );
        }

        // Create post with attachments
        const post = await prisma.post.create({
            data: {
                title,
                content,
                boardType,
                category: category || null,
                isNotice: isNotice || false,
                authorId,
                authorName: authorName || null, // 작성자 이름 저장 (빈 문자열은 null로)
                attachments: attachments && attachments.length > 0 ? {
                    create: attachments.map((att: any) => ({
                        fileName: att.fileName,
                        fileUrl: att.fileUrl,
                        fileSize: att.fileSize,
                        mimeType: att.mimeType || 'application/octet-stream',
                    }))
                } : undefined,
            },
            include: {
                attachments: true,
            }
        });

        console.log('Post created successfully:', post.id);
        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json(
            { error: '게시글 작성 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
