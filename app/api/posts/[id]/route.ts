import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// GET: 게시글 상세 조회
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const postId = parseInt((await params).id);

        // 조회수 증가
        await prisma.post.update({
            where: { id: postId },
            data: { viewCount: { increment: 1 } }
        });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        churchName: true,
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                attachments: true,
                _count: {
                    select: { likes: true }
                }
            }
        });

        if (!post) {
            return NextResponse.json(
                { error: '게시글을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json(
            { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// PATCH: 게시글 수정
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const postId = parseInt((await params).id);
        const body = await request.json();
        const { title, content, isNotice, category, newAttachments, deletedFileIds, authorName } = body;

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 작성자 본인 또는 관리자만 수정 가능
        const isAuthor = post.authorId === parseInt(session.user.id);
        const isAdmin = session.user.role === 'admin' || session.user.role === 'ADMIN';

        if (!isAuthor && !isAdmin) {
            return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
        }

        // 공지사항 설정은 관리자만 가능
        if (isNotice !== undefined && isNotice !== post.isNotice && !isAdmin) {
            return NextResponse.json({ error: '공지사항 설정 권한이 없습니다.' }, { status: 403 });
        }

        // 트랜잭션으로 처리
        const updatedPost = await prisma.$transaction(async (tx) => {
            // 1. 게시글 정보 업데이트
            const updated = await tx.post.update({
                where: { id: postId },
                data: {
                    title,
                    content,
                    category,
                    isNotice: isAdmin ? isNotice : undefined,
                    authorName: isAdmin && authorName !== undefined ? (authorName || null) : undefined, // 관리자만 수정 가능 (빈 문자열은 null로)
                }
            });

            // 2. 삭제된 첨부파일 처리
            if (deletedFileIds && deletedFileIds.length > 0) {
                // 파일 정보 조회 (실제 파일 삭제를 위해)
                const filesToDelete = await tx.attachment.findMany({
                    where: {
                        id: { in: deletedFileIds },
                        postId: postId // 안전장치: 해당 게시글의 파일만 삭제
                    }
                });

                // DB에서 삭제
                await tx.attachment.deleteMany({
                    where: {
                        id: { in: deletedFileIds },
                        postId: postId
                    }
                });

                // 실제 파일 삭제 (IMMS 도입으로 인해 물리 파일 삭제 중단)
                // 공유된 자산일 수 있으므로 DB 연결만 끊고 파일은 유지함
                /*
                for (const file of filesToDelete) {
                    try {
                        // fileUrl이 /uploads/... 로 시작한다고 가정
                        // public 폴더 기준 경로 계산
                        let relativePath = file.fileUrl;
                        if (relativePath.startsWith('/')) {
                            relativePath = relativePath.substring(1);
                        }
                        const physicalPath = path.join(process.cwd(), 'public', relativePath);
                        if (fs.existsSync(physicalPath)) {
                            fs.unlinkSync(physicalPath);
                        }
                    } catch (e) {
                        console.error(`Failed to delete file ${file.fileName}:`, e);
                    }
                }
                */
            }

            // 3. 새 첨부파일 추가
            if (newAttachments && newAttachments.length > 0) {
                await tx.attachment.createMany({
                    data: newAttachments.map((file: any) => ({
                        postId: postId,
                        fileName: file.fileName,
                        fileUrl: file.fileUrl,
                        fileSize: file.fileSize,
                        mimeType: file.mimeType || 'application/octet-stream',
                    }))
                });
            }

            return updated;
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json(
            { error: '게시글 수정 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE: 게시글 삭제
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const postId = parseInt((await params).id);

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { attachments: true } // 첨부파일 정보도 가져옴
        });

        if (!post) {
            return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 작성자 본인 또는 관리자만 삭제 가능
        const isAuthor = post.authorId === parseInt(session.user.id);
        const isAdmin = session.user.role === 'admin' || session.user.role === 'ADMIN';

        if (!isAuthor && !isAdmin) {
            return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
        }

        // 실제 파일 삭제 (IMMS 도입으로 인해 물리 파일 삭제 중단)
        /*
        for (const file of post.attachments) {
            try {
                let relativePath = file.fileUrl;
                if (relativePath.startsWith('/')) {
                    relativePath = relativePath.substring(1);
                }
                const physicalPath = path.join(process.cwd(), 'public', relativePath);
                if (fs.existsSync(physicalPath)) {
                    fs.unlinkSync(physicalPath);
                }
            } catch (e) {
                console.error(`Failed to delete file ${file.fileName}:`, e);
            }
        }
        */

        // DB에서 게시글 삭제 (Cascade로 인해 첨부파일, 댓글 등도 자동 삭제됨)
        await prisma.post.delete({
            where: { id: postId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json(
            { error: '게시글 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
