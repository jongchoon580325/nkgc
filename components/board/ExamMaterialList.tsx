import { useEffect, useState } from 'react';
import { BoardType } from '@/lib/board-config';
import dynamic from 'next/dynamic';

// Dynamic import for PDFFlipViewer to avoid SSR issues with canvas/window
const PDFFlipViewer = dynamic(() => import('./PDFFlipViewer'), { ssr: false });

interface Post {
    id: number;
    title: string;
    attachments: {
        id: number;
        fileUrl: string;
        fileName: string;
    }[];
}

interface ExamMaterialListProps {
    boardType: BoardType;
}

export default function ExamMaterialList({ boardType }: ExamMaterialListProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [gridColumns, setGridColumns] = useState(4);
    const [viewMode, setViewMode] = useState<'new_tab' | 'flip_book'>('flip_book');
    const [search, setSearch] = useState('');

    // Viewer State
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [page, search]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/board-settings/${boardType}`);
            const data = await res.json();
            if (data.settings) {
                const settings = typeof data.settings === 'string'
                    ? JSON.parse(data.settings)
                    : data.settings;
                setGridColumns(settings.gridColumns || 4);
                setViewMode(settings.viewMode || 'flip_book');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const limit = gridColumns * 3; // 3 rows per page
            const params = new URLSearchParams({
                type: boardType,
                page: page.toString(),
                limit: limit.toString(),
                search,
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

    const handleCardClick = (post: Post) => {
        if (post.attachments && post.attachments.length > 0) {
            const fileUrl = post.attachments[0].fileUrl;

            if (viewMode === 'flip_book' && fileUrl.toLowerCase().endsWith('.pdf')) {
                // Open Flip Viewer for PDF
                setSelectedFile(fileUrl);
            } else {
                // Default: Open in new tab (also for non-PDFs)
                window.open(fileUrl, '_blank');
            }
        } else {
            alert('첨부된 파일이 없습니다.');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchPosts();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Search Bar */}
            <div className="mb-8 max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="검색어 입력 시 자동 검색..."
                        className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    <svg
                        className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </form>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">로딩 중...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">등록된 자료가 없습니다.</div>
            ) : (
                <div
                    className="grid gap-6"
                    style={{
                        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                    }}
                >
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => handleCardClick(post)}
                            className="aspect-[3/4] max-w-[180px] mx-auto rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center group transform hover:-translate-y-1 relative overflow-hidden"
                            style={{
                                backgroundImage: 'url(/pdf/노회록/00-겉표지.jpg)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                            {/* Content Wrapper */}
                            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-4">
                                {/* Title Area - Centered */}
                                <div className="flex items-center justify-center w-full h-full">
                                    <h3
                                        className="text-white drop-shadow-md font-bold text-lg leading-snug line-clamp-3 break-keep"
                                    >
                                        {post.title}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        이전
                    </button>
                    <span className="px-4 py-2 font-medium text-gray-700">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        다음
                    </button>
                </div>
            )}

            {/* PDF Flip Viewer Modal */}
            {selectedFile && (
                <PDFFlipViewer
                    fileUrl={selectedFile}
                    onClose={() => setSelectedFile(null)}
                />
            )}
        </div>
    );
}
