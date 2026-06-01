'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BoardType, BOARD_CONFIG } from '@/lib/board-config';
import PageHeader from '@/components/common/PageHeader';

interface Post {
    id: number;
    title: string;
    content: string;
    boardType: string;
    viewCount: number;
    createdAt: string;
    author: {
        username: string;
        name: string;
        churchName: string;
    };
    authorName?: string | null; // 작성자 이름 (직접 입력)
    _count: {
        comments: number;
    };
    attachments: {
        id: number;
        fileUrl: string;
        fileName: string;
    }[];
}

interface GalleryListProps {
    boardType: BoardType;
}

interface GallerySettings {
    gridColumns: number;
    gridRows: number;
    showTitle: boolean;
    showDate: boolean;
    showAuthor: boolean;
}

const DEFAULT_SETTINGS: GallerySettings = {
    gridColumns: 4,
    gridRows: 3,
    showTitle: true,
    showDate: true,
    showAuthor: true,
};

export default function GalleryList({ boardType }: GalleryListProps) {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [settings, setSettings] = useState<GallerySettings>(DEFAULT_SETTINGS);
    const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

    const searchParams = useSearchParams();
    const config = BOARD_CONFIG[boardType];
    const userRole = (session?.user as any)?.role || '';

    // 권한 체크: GALLERY, VIDEO는 admin만 글쓰기 가능
    const canWrite = useMemo(() => {
        if (!session) return false;
        return userRole === 'admin' || userRole === 'super_admin';
    }, [session, userRole]);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [boardType, page, settings]);

    // URL 파라미터로 Lightbox 자동 오픈
    useEffect(() => {
        const openId = searchParams.get('open');
        if (openId && posts.length > 0) {
            const index = posts.findIndex(p => p.id === parseInt(openId));
            if (index !== -1) {
                setSelectedPostIndex(index);
            }
        }
    }, [posts, searchParams]);

    // Lightbox 제어
    const openLightbox = (index: number) => setSelectedPostIndex(index);
    const closeLightbox = () => setSelectedPostIndex(null);

    const showPrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedPostIndex !== null) {
            setSelectedPostIndex((prev) => (prev === null || prev === 0 ? posts.length - 1 : prev - 1));
        }
    };

    const showNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedPostIndex !== null) {
            setSelectedPostIndex((prev) => (prev === null || prev === posts.length - 1 ? 0 : prev + 1));
        }
    };

    // 키보드 이벤트 처리
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedPostIndex === null) return;

            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPostIndex, posts]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/board-settings/GALLERY');
            const data = await res.json();

            if (res.ok && data.settings) {
                const parsed = JSON.parse(data.settings);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const limit = settings.gridColumns * settings.gridRows;
            const params = new URLSearchParams({
                type: boardType,
                page: page.toString(),
                limit: limit.toString(),
            });

            const res = await fetch(`/api/posts?${params}`);
            const data = await res.json();

            setPosts(data.posts || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    // 이미지 URL 추출
    const extractThumbnail = (post: Post): { url: string | null, isVideo: boolean, youtubeId?: string, isMp4?: boolean } => {
        // 1. Content에서 이미지 찾기
        const imgMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) return { url: imgMatch[1], isVideo: false };

        // 2. Attachments에서 이미지 찾기
        if (post.attachments && post.attachments.length > 0) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const imageAttachment = post.attachments.find(att =>
                imageExtensions.some(ext => att.fileName.toLowerCase().endsWith(ext))
            );
            if (imageAttachment) {
                return { url: imageAttachment.fileUrl, isVideo: false };
            }
        }

        // 3. VIDEO 게시판인 경우
        if (boardType === 'VIDEO') {
            // 3-1. MP4 비디오 찾기 (video 태그)
            const videoMatch = post.content.match(/<video[^>]+src="([^">]+)"/);
            if (videoMatch) {
                return {
                    url: videoMatch[1],
                    isVideo: true,
                    isMp4: true
                };
            }

            // 3-2. 유튜브 썸네일 찾기
            // iframe src에서 찾기
            const iframeMatch = post.content.match(/src="([^"]+)"/);
            if (iframeMatch) {
                const url = iframeMatch[1];
                const youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                if (youtubeMatch) {
                    return {
                        url: `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`,
                        isVideo: true,
                        youtubeId: youtubeMatch[1]
                    };
                }
            }

            // 텍스트 링크에서 찾기
            const linkMatch = post.content.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (linkMatch) {
                return {
                    url: `https://img.youtube.com/vi/${linkMatch[1]}/hqdefault.jpg`,
                    isVideo: true,
                    youtubeId: linkMatch[1]
                };
            }
        }

        return { url: null, isVideo: false };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <style jsx global>{`
                @keyframes ripple {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.5; }
                    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
                }
                .ripple-circle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100px;
                    height: 100px;
                    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
                    border-radius: 50%;
                    opacity: 0;
                    pointer-events: none;
                    z-index: 10;
                }
                .group:hover .ripple-circle {
                    animation: ripple 1.5s infinite linear;
                }
            `}</style>
            <PageHeader title={config.title} />

            {/* Content Section */}
            <div className="container mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {canWrite && (
                        <div className="mb-6 flex justify-end">
                            <Link
                                href={`/board/${boardType}/write`}
                                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                            >
                                글쓰기
                            </Link>
                        </div>
                    )}

                    {/* 갤러리 그리드 */}
                    {posts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            게시글이 없습니다.
                        </div>
                    ) : (
                        <div
                            className={`grid gap-6`}
                            style={{
                                gridTemplateColumns: `repeat(${settings.gridColumns}, minmax(0, 1fr))`,
                            }}
                        >
                            {posts.map((post, index) => {
                                const { url: imageUrl, isVideo, isMp4 } = extractThumbnail(post);
                                return (
                                    <div
                                        key={post.id}
                                        className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                    >
                                        {/* 썸네일 - 클릭 시 Lightbox 오픈 */}
                                        <div
                                            className="aspect-square bg-gray-100 overflow-hidden flex items-center justify-center relative"
                                            onClick={() => openLightbox(index)}
                                        >
                                            {imageUrl ? (
                                                <>
                                                    {isMp4 ? (
                                                        <video
                                                            src={imageUrl}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                            playsInline
                                                            onMouseOver={e => e.currentTarget.play()}
                                                            onMouseOut={e => {
                                                                e.currentTarget.pause();
                                                                e.currentTarget.currentTime = 0;
                                                            }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={imageUrl}
                                                            alt={post.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 delay-500"
                                                        />
                                                    )}
                                                    <div className="ripple-circle" />
                                                    {isVideo && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all pointer-events-none">
                                                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-gray-400 text-sm">No Image</div>
                                            )}
                                        </div>

                                        {/* 정보 - 제목 클릭 시 상세 페이지 이동 */}
                                        <div className="p-4 text-center">
                                            {settings.showTitle && (
                                                <Link href={`/board/${boardType}/${post.id}`}>
                                                    <h3 className="text-base font-normal group-hover:font-bold transition-all line-clamp-2 text-gray-900 hover:text-blue-600">
                                                        {post.title}
                                                    </h3>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center items-center gap-2">
                            {/* 처음으로 */}
                            <button
                                onClick={() => setPage(1)}
                                disabled={page === 1}
                                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                            >
                                처음으로
                            </button>

                            {/* 이전 */}
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                            >
                                이전
                            </button>

                            {/* 페이지 표시 */}
                            <span className="px-4 py-2 text-gray-700 font-medium">
                                {page} / {totalPages}
                            </span>

                            {/* 다음 */}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                            >
                                다음
                            </button>

                            {/* 마지막 */}
                            <button
                                onClick={() => setPage(totalPages)}
                                disabled={page === totalPages}
                                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                            >
                                마지막
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedPostIndex !== null && posts[selectedPostIndex] && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={closeLightbox}
                >
                    {/* 닫기 버튼 */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white/70 hover:text-white z-50 p-2"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* 이전 버튼 */}
                    <button
                        onClick={showPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-50 p-4 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* 다음 버튼 */}
                    <button
                        onClick={showNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-50 p-4 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* 이미지 컨테이너 */}
                    <div
                        className="relative max-w-7xl max-h-[90vh] w-full flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-full h-[80vh] flex items-center justify-center">
                            {(() => {
                                const { url, isVideo, youtubeId, isMp4 } = extractThumbnail(posts[selectedPostIndex]);

                                if (isVideo) {
                                    if (youtubeId) {
                                        return (
                                            <div className="w-full h-full max-w-5xl aspect-video flex items-center justify-center bg-black">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                                                    title="YouTube video player"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="w-full h-full"
                                                ></iframe>
                                            </div>
                                        );
                                    } else if (isMp4 && url) {
                                        return (
                                            <div className="w-full h-full max-w-5xl aspect-video flex items-center justify-center bg-black">
                                                <video
                                                    src={url}
                                                    controls
                                                    autoPlay
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        );
                                    }
                                }

                                return url ? (
                                    <img
                                        src={url}
                                        alt={posts[selectedPostIndex].title}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-white text-xl">이미지가 없습니다</div>
                                );
                            })()}
                        </div>

                        {/* 하단 정보 */}
                        <div className="mt-4 text-center text-white">
                            <h3 className="text-xl font-semibold mb-2">
                                {posts[selectedPostIndex].title}
                            </h3>
                            <div className="flex justify-center gap-4 text-sm text-gray-400">
                                <span>{posts[selectedPostIndex].authorName || posts[selectedPostIndex].author.name}</span>
                                <span>{new Date(posts[selectedPostIndex].createdAt).toLocaleDateString()}</span>
                                <Link
                                    href={`/board/${boardType}/${posts[selectedPostIndex].id}`}
                                    className="text-blue-400 hover:text-blue-300 hover:underline ml-2"
                                >
                                    상세보기 &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
