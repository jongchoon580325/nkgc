
'use client';

import { useEffect, useState, useMemo } from 'react';
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
    category: string | null;
    viewCount: number;
    isNotice: boolean;
    createdAt: string;
    author: {
        username: string;
        name: string;
        churchName: string;
    };
    authorName?: string | null;
    _count: {
        comments: number;
    };
}

interface PostListProps {
    boardType: BoardType;
    showHeader?: boolean;
}

export default function PostList({ boardType, showHeader = true }: PostListProps) {
    const { data: session } = useSession();
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('전체');
    const [categories, setCategories] = useState<string[]>([]);

    // Bulk Action State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [moveTarget, setMoveTarget] = useState<BoardType | ''>('');
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title: string;
        message: string;
        action?: () => void;
        isDestructive?: boolean;
    }>({ isOpen: false, type: 'alert', title: '', message: '' });

    const config = BOARD_CONFIG[boardType];
    const userRole = (session?.user as any)?.role || '';
    const userPosition = (session?.user as any)?.position || '';
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    const canWrite = useMemo(() => {
        if (!session) return false;
        if (isAdmin) return true;
        const isMember = userRole === 'member' ||
            (userPosition && (userPosition.includes('목사') || userPosition === '장로'));
        const isGuest = userRole === 'guest';
        const adminOnlyBoards = ['FORM_ADMIN', 'FORM_SELF', 'GALLERY', 'VIDEO', 'NOTICE', 'EXAM_DEPT', 'EXAM_USER'];
        if (adminOnlyBoards.includes(boardType)) return false;
        if (boardType === 'MEMBER') return isMember;
        if (boardType === 'FREE') return isMember || isGuest;
        return false;
    }, [session, userRole, userPosition, boardType, isAdmin]);

    useEffect(() => {
        fetchPosts();
        fetchCategories();
    }, [boardType]);

    // Clear selection when filters change
    useEffect(() => {
        setSelectedIds([]);
    }, [page, searchInput, selectedCategory, boardType]);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`/api/board-settings/${boardType}`);
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ type: boardType, page: '1', limit: '1000' });
            const res = await fetch(`/api/posts?${params}`);
            const data = await res.json();
            setAllPosts(data.posts || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedPosts.length && paginatedPosts.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedPosts.map(p => p.id));
        }
    };

    const toggleSelectPost = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.length === 0) return;
        setModal({
            isOpen: true,
            type: 'confirm',
            title: '게시글 일괄 삭제',
            message: `선택한 ${selectedIds.length}개의 게시글을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            isDestructive: true,
            action: executeBulkDelete
        });
    };

    const executeBulkDelete = async () => {
        try {
            const res = await fetch('/api/posts/bulk', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });
            if (!res.ok) throw new Error('Failed to delete');

            setModal({
                isOpen: true, type: 'alert', title: '삭제 완료',
                message: '선택한 게시글이 삭제되었습니다.'
            });
            setSelectedIds([]);
            fetchPosts();
        } catch (error) {
            setModal({
                isOpen: true, type: 'alert', title: '오류',
                message: '삭제 중 오류가 발생했습니다.'
            });
        }
    };

    const handleBulkMoveClick = () => {
        if (selectedIds.length === 0) return;
        if (!moveTarget) {
            setModal({ isOpen: true, type: 'alert', title: '알림', message: '이동할 게시판을 선택해주세요.' });
            return;
        }

        const targetName = BOARD_CONFIG[moveTarget as BoardType]?.title || moveTarget;
        setModal({
            isOpen: true,
            type: 'confirm',
            title: '게시글 이동',
            message: `선택한 ${selectedIds.length}개의 게시글을 [${targetName}] 게시판으로 이동하시겠습니까?`,
            action: executeBulkMove
        });
    };

    const executeBulkMove = async () => {
        try {
            const res = await fetch('/api/posts/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, targetBoardType: moveTarget })
            });
            if (!res.ok) throw new Error('Failed to move');

            setModal({
                isOpen: true, type: 'alert', title: '이동 완료',
                message: '선택한 게시글이 이동되었습니다.'
            });
            setSelectedIds([]);
            fetchPosts();
        } catch (error) {
            setModal({
                isOpen: true, type: 'alert', title: '오류',
                message: '이동 중 오류가 발생했습니다.'
            });
        }
    };

    const filteredPosts = useMemo(() => {
        let filtered = allPosts;
        if (selectedCategory !== '전체') {
            filtered = filtered.filter(post => post.category === selectedCategory);
        }
        if (searchInput.trim()) {
            const searchLower = searchInput.toLowerCase();
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(searchLower) ||
                post.content.toLowerCase().includes(searchLower)
            );
        }
        return filtered;
    }, [allPosts, searchInput, selectedCategory]);

    const postsPerPage = 20;
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const paginatedPosts = filteredPosts.slice((page - 1) * postsPerPage, page * postsPerPage);

    useEffect(() => {
        setPage(1);
    }, [searchInput, selectedCategory]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    const renderContent = () => (
        <>
            {/* Category Filter */}
            {categories.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory('전체')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === '전체' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        전체
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            {/* Admin Bulk Action Bar */}
            {isAdmin && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">관리자 일괄 관리</span>
                        <span className="text-sm text-gray-500">
                            ({selectedIds.length}개 선택됨 / 현재 페이지 {paginatedPosts.length}개 중)
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={moveTarget}
                            onChange={(e) => setMoveTarget(e.target.value as BoardType)}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm min-w-[150px]"
                        >
                            <option value="">이동할 게시판 선택</option>
                            {Object.entries(BOARD_CONFIG).map(([key, conf]) => (
                                <option key={key} value={key} disabled={key === boardType}>
                                    {conf.title}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleBulkMoveClick}
                            disabled={selectedIds.length === 0 || !moveTarget}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            이동
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        <button
                            onClick={handleBulkDeleteClick}
                            disabled={selectedIds.length === 0}
                            className="px-4 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            삭제
                        </button>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6 flex justify-between items-center">
                <div className="flex-1 max-w-md">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="검색어 입력 시 자동 검색..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                    {searchInput && (
                        <p className="text-sm text-gray-500 mt-1">
                            {filteredPosts.length}개의 게시글이 검색되었습니다.
                        </p>
                    )}
                </div>
                {canWrite && (
                    <Link
                        href={`/board/${boardType}/write`}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                        글쓰기
                    </Link>
                )}
            </div>

            {/* Post Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {isAdmin && (
                                <th className="px-4 py-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={paginatedPosts.length > 0 && selectedIds.length === paginatedPosts.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                                    />
                                </th>
                            )}
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">번호</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">제목</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">작성자</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">작성일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedPosts.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                                    게시글이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            paginatedPosts.map((post) => (
                                <tr key={post.id} className={`hover:bg-gray-50 ${post.isNotice ? 'bg-yellow-50' : ''} transition-colors`}>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(post.id)}
                                                onChange={() => toggleSelectPost(post.id)}
                                                className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                                            />
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {post.isNotice ? <span className="text-red-600 font-semibold">공지</span> : post.id}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link href={`/board/${boardType}/${post.id}`} className="text-blue-600 hover:underline">
                                            {post.category && (
                                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                                                    {post.category}
                                                </span>
                                            )}
                                            {post.title}
                                            {post._count.comments > 0 && (
                                                <span className="text-red-500 ml-1">[{post._count.comments}]</span>
                                            )}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{post.authorName || post.author.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(post.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                    <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        처음으로
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        이전
                    </button>
                    <div className="px-6 py-2 border border-gray-300 rounded-md bg-white text-gray-900 font-semibold min-w-[100px] text-center">
                        {page} / {totalPages}
                    </div>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        다음
                    </button>
                    <button
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        마지막
                    </button>
                </div>
            )}

            <NotificationModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.action}
                isDestructive={modal.isDestructive}
                confirmText="확인"
                cancelText="취소"
            />
        </>
    );

    if (!showHeader) return renderContent();

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title={config.title} />
            <div className="container mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {renderContent()}
                </div>
            </div>
        </main>
    );
}
