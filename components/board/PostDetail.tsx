'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BoardType, BOARD_CONFIG } from '@/lib/board-config';
import PageHeader from '@/components/common/PageHeader';
import NotificationModal from '@/components/common/NotificationModal';

interface Post {
    id: number;
    title: string;
    content: string;
    boardType: string;
    viewCount: number;
    isNotice: boolean;
    createdAt: string;
    updatedAt: string;
    author: {
        id: number;
        username: string;
        name: string;
        churchName: string;
    };
    authorName?: string | null; // 작성자 이름 (직접 입력)
    comments: Comment[];
    attachments: Attachment[];
    _count: {
        likes: number;
    };
}

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    author: {
        id: number;
        username: string;
        name: string;
    };
}

interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
}

interface PostDetailProps {
    boardType: BoardType;
    postId: string;
}

export default function PostDetail({ boardType, postId }: PostDetailProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        type: 'alert' as 'alert' | 'confirm'
    });

    const showAlert = (title: string, message: string) => {
        setModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => setModal(prev => ({ ...prev, isOpen: false })),
            isDestructive: false,
            type: 'alert'
        });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
        setModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setModal(prev => ({ ...prev, isOpen: false }));
            },
            isDestructive,
            type: 'confirm'
        });
    };

    const from = searchParams.get('from');
    const listLink = from === 'admin' ? '/admin/gallery-settings' : `/board/${boardType}`;

    const config = BOARD_CONFIG[boardType];

    useEffect(() => {
        fetchPost();
    }, [postId]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/posts/${postId}`);
            const data = await res.json();
            setPost(data);
        } catch (error) {
            console.error('Error fetching post:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        showConfirm(
            '게시글 삭제',
            '정말 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.',
            async () => {
                try {
                    const res = await fetch(`/api/posts/${postId}`, {
                        method: 'DELETE',
                    });

                    if (res.ok) {
                        // showConfirm의 내부 onConfirm에서 모달을 닫으므로, alert 대신 모달을 다시 띄우지 않고 바로 이동하거나,
                        // UX상 삭제 완료 알림을 띄우고 이동할 수 있음. 
                        // 여기서는 router.push가 있기 때문에 Alert을 띄우고 확인 시 이동하는게 좋음.
                        // 하지만 비동기 처리 상 모달이 닫힌 후 다시 열어야 함.

                        // 약간의 딜레이를 주거나, 별도 상태 관리 없이 바로 이동하면 사용자 경험이 빠름.
                        // 사용자의 명시적 확인을 위해 alert 모달을 띄우고 확인 누르면 이동.

                        // Note: setState batching / async might clash if immediately showing another modal.
                        // But NotificationModal implementation is simple.

                        // Let's use a workaround: The confirm modal closes. We set a new modal for success.
                        // Waiting a tick might be needed if they share state (which they do).
                        setTimeout(() => {
                            setModal({
                                isOpen: true,
                                title: '삭제 완료',
                                message: '게시글이 삭제되었습니다.',
                                type: 'alert',
                                isDestructive: false,
                                onConfirm: () => router.push(listLink)
                            });
                        }, 100);
                    } else {
                        const data = await res.json();
                        setTimeout(() => showAlert('삭제 실패', data.error || '삭제 실패'), 100);
                    }
                } catch (error) {
                    console.error('Error deleting post:', error);
                    setTimeout(() => showAlert('오류', '삭제 중 오류가 발생했습니다.'), 100);
                }
            },
            true
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-gray-500">게시글을 찾을 수 없습니다.</div>
            </div>
        );
    }

    const canEdit = session?.user?.id === post.author.id.toString() || (session?.user?.role === 'admin' || session?.user?.role === 'ADMIN');

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title={config.title} />

            {/* Content Section */}
            <div className="container mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* 게시글 정보 */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                            <h2 className="text-xl font-semibold mb-2">
                                {post.isNotice && (
                                    <span className="text-red-600 mr-2">[공지]</span>
                                )}
                                {post.title}
                            </h2>
                            <div className="flex gap-4 text-sm text-gray-600">
                                <span>{post.authorName || post.author.name} ({post.author.churchName})</span>
                                <span>조회 {post.viewCount}</span>
                                <span>{new Date(post.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* 본문 */}
                        <div className="px-6 py-6">
                            <div
                                className="post-content"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                            <style jsx>{`
                                .post-content table {
                                    border-collapse: collapse;
                                    width: 100%;
                                    border: 1px solid #888;
                                    margin: 1em 0;
                                }
                                .post-content th,
                                .post-content td {
                                    border: 1px solid #888;
                                    padding: 8px 12px;
                                    text-align: left;
                                }
                                .post-content th {
                                    background-color: #f0f0f0;
                                    font-weight: 600;
                                }
                                .post-content img {
                                    max-width: 100%;
                                    height: auto;
                                }
                                .post-content iframe {
                                    max-width: 100%;
                                }
                                .post-content ul {
                                    list-style-type: disc;
                                    padding-left: 1.5em;
                                    margin-bottom: 1em;
                                }
                                .post-content ol {
                                    list-style-type: decimal;
                                    padding-left: 1.5em;
                                    margin-bottom: 1em;
                                }
                                .post-content li {
                                    margin-bottom: 0.5em;
                                }
                            `}</style>
                        </div>

                        {/* 첨부파일 */}
                        {post.attachments.length > 0 && (
                            <div className="border-t border-gray-200 px-6 py-4">
                                <h3 className="font-semibold mb-2">첨부파일</h3>
                                <ul className="space-y-1">
                                    {post.attachments.map((file) => (
                                        <li key={file.id}>
                                            <a
                                                href={`/api/attachments/${file.id}`}
                                                download={file.fileName}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {file.fileName} ({(file.fileSize / 1024).toFixed(1)} KB)
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 버튼 */}
                        <div className="border-t border-gray-200 px-6 py-4 flex gap-2 justify-end">
                            <Link
                                href={listLink}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            >
                                목록보기
                            </Link>
                            {canEdit && (
                                <>
                                    <Link
                                        href={`/board/${boardType}/edit/${postId}`}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        수정
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                    >
                                        삭제
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 댓글 섹션 */}
                    {config.canComment && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-4">
                                댓글 ({post.comments.length})
                            </h3>
                            <div className="space-y-4">
                                {post.comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold">{comment.author.name}</span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-700">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>


            <NotificationModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                isDestructive={modal.isDestructive}
            />
        </main >
    );
}
