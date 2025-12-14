'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotificationModal from '@/app/components/common/NotificationModal';

interface GalleryPost {
    id: number;
    title: string;
    content: string;
    viewCount: number;
    createdAt: string;
    author: {
        name: string;
    };
    _count: {
        comments: number;
    };
    attachments: {
        id: number;
        fileName: string;
        fileUrl: string;
    }[];
}

interface GallerySettings {
    gridColumns: number;
    gridRows: number;
    showTitle: boolean;
    showDate: boolean;
    showAuthor: boolean;
    homeEnabled: boolean;
    homeCount: number;
}

const DEFAULT_SETTINGS: GallerySettings = {
    gridColumns: 4,
    gridRows: 3,
    showTitle: true,
    showDate: true,
    showAuthor: true,
    homeEnabled: true,
    homeCount: 6,
};

export default function GallerySettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<GallerySettings>(DEFAULT_SETTINGS);
    const [posts, setPosts] = useState<GalleryPost[]>([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Modal State
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
        isDestructive?: boolean;
    }>({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
    });

    // Backup states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated') {
            const isAdmin = session.user?.role === 'admin' || session.user?.role === 'ADMIN';
            if (!isAdmin) {
                alert('관리자 권한이 필요합니다.');
                router.push('/admin');
                return;
            }
            fetchSettings();
            fetchPosts();
        }
    }, [status]);

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
            const res = await fetch('/api/posts?type=GALLERY&page=1&limit=1000');
            const data = await res.json();
            setPosts(data.posts || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/board-settings/GALLERY', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: JSON.stringify(settings),
                }),
            });

            if (res.ok) {
                showMessage('success', '설정이 저장되었습니다.');
            } else {
                const data = await res.json();
                showMessage('error', data.error || '저장 실패');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('error', '저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePost = (postId: number) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            title: '게시글 삭제',
            message: '정말 이 게시글을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/posts/${postId}`, {
                        method: 'DELETE',
                    });

                    if (res.ok) {
                        showMessage('success', '삭제되었습니다.');
                        fetchPosts();
                        setModal(prev => ({ ...prev, isOpen: false }));
                    } else {
                        const data = await res.json();
                        showMessage('error', data.error || '삭제 실패');
                        setModal(prev => ({ ...prev, isOpen: false }));
                    }
                } catch (error) {
                    console.error('Error deleting post:', error);
                    showMessage('error', '삭제 중 오류가 발생했습니다.');
                    setModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    // 내보내기 (ZIP)
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/admin/gallery/backup');
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gallery_backup_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showMessage('success', '사진자료실 데이터를 내보냈습니다. (JSON + 이미지 ZIP)');
        } catch (error) {
            console.error('Export error:', error);
            showMessage('error', '내보내기 중 오류가 발생했습니다.');
        } finally {
            setIsExporting(false);
        }
    };

    // 가져오기 (ZIP)
    const handleImport = async () => {
        if (!importFile) {
            showMessage('error', '파일을 선택해주세요.');
            return;
        }

        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('mode', importMode);
            formData.append('authorId', String((session?.user as any)?.id || 1));

            const response = await fetch('/api/admin/gallery/backup', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showMessage('success', result.message);
                setShowImportModal(false);
                setImportFile(null);
                fetchPosts();
            } else {
                showMessage('error', result.error || '가져오기에 실패했습니다.');
            }
        } catch (error) {
            console.error('Import error:', error);
            showMessage('error', '가져오기 중 오류가 발생했습니다.');
        } finally {
            setIsImporting(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">사진자료실 관리</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                        {isExporting ? '내보내는 중...' : '📤 내보내기 (ZIP)'}
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                    >
                        📥 가져오기
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Settings Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">갤러리 설정</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Grid Settings */}
                    <div>
                        <h3 className="font-semibold mb-3 text-gray-700">그리드 레이아웃</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">열 개수</label>
                                <input
                                    type="number"
                                    min="3"
                                    max="6"
                                    value={settings.gridColumns}
                                    onChange={(e) => setSettings({ ...settings, gridColumns: parseInt(e.target.value) })}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">3-6 사이의 값 (권장: 4)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">페이지당 행 개수</label>
                                <input
                                    type="number"
                                    min="2"
                                    max="5"
                                    value={settings.gridRows}
                                    onChange={(e) => setSettings({ ...settings, gridRows: parseInt(e.target.value) })}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">2-5 사이의 값 (권장: 3)</p>
                            </div>
                        </div>
                    </div>

                    {/* Display Options */}
                    <div>
                        <h3 className="font-semibold mb-3 text-gray-700">표시 옵션</h3>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={settings.showTitle}
                                    onChange={(e) => setSettings({ ...settings, showTitle: e.target.checked })}
                                    className="mr-2"
                                />
                                <span className="text-sm">제목 표시</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={settings.showDate}
                                    onChange={(e) => setSettings({ ...settings, showDate: e.target.checked })}
                                    className="mr-2"
                                />
                                <span className="text-sm">날짜 표시</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={settings.showAuthor}
                                    onChange={(e) => setSettings({ ...settings, showAuthor: e.target.checked })}
                                    className="mr-2"
                                />
                                <span className="text-sm">작성자 표시</span>
                            </label>
                        </div>
                    </div>

                    {/* HOME Page Settings */}
                    <div className="md:col-span-2">
                        <h3 className="font-semibold mb-3 text-gray-700">HOME 페이지 연동</h3>
                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={settings.homeEnabled}
                                    onChange={(e) => setSettings({ ...settings, homeEnabled: e.target.checked })}
                                    className="mr-2"
                                />
                                <span className="text-sm">HOME 페이지에 갤러리 표시</span>
                            </label>
                            {settings.homeEnabled && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">HOME 표시 개수</label>
                                    <input
                                        type="number"
                                        min="3"
                                        max="12"
                                        value={settings.homeCount}
                                        onChange={(e) => setSettings({ ...settings, homeCount: parseInt(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">3-12 사이의 값 (권장: 6)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        {saving ? '저장 중...' : '설정 저장'}
                    </button>
                </div>
            </div>

            {/* Posts Management */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">게시글 관리 ({posts.length}개)</h2>
                    <Link
                        href="/board/GALLERY/write"
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        새 게시글 작성
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left">제목</th>
                                <th className="px-4 py-2 text-left">작성자</th>
                                <th className="px-4 py-2 text-center">조회수</th>
                                <th className="px-4 py-2 text-center">첨부파일</th>
                                <th className="px-4 py-2 text-center">작성일</th>
                                <th className="px-4 py-2 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post) => (
                                <tr key={post.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/board/GALLERY/${post.id}?from=admin`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {post.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">{post.author.name}</td>
                                    <td className="px-4 py-3 text-center">{post.viewCount}</td>
                                    <td className="px-4 py-3 text-center">
                                        {post.attachments.length > 0 && (
                                            <span className="text-gray-600">
                                                📎 {post.attachments.length}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <Link
                                                href={`/board/GALLERY/edit/${post.id}`}
                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                            >
                                                수정
                                            </Link>
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowImportModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">📥</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">사진자료실 가져오기</h2>
                                <p className="text-sm text-gray-500">ZIP 파일 (메타데이터 + 이미지)</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    백업 ZIP 파일 선택
                                </label>
                                <input
                                    type="file"
                                    accept=".zip"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                                {importFile && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        선택됨: {importFile.name} ({(importFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    가져오기 모드
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="importMode"
                                            value="merge"
                                            checked={importMode === 'merge'}
                                            onChange={() => setImportMode('merge')}
                                            className="text-orange-500"
                                        />
                                        <div>
                                            <div className="font-medium">병합 (권장)</div>
                                            <div className="text-sm text-gray-500">
                                                기존 데이터 유지, 새 데이터만 추가
                                            </div>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="importMode"
                                            value="overwrite"
                                            checked={importMode === 'overwrite'}
                                            onChange={() => setImportMode('overwrite')}
                                            className="text-orange-500"
                                        />
                                        <div>
                                            <div className="font-medium text-red-600">덮어쓰기</div>
                                            <div className="text-sm text-gray-500">
                                                ⚠️ 기존 데이터 및 이미지 삭제 후 대체
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {importMode === 'overwrite' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                                    <p>⚠️ 덮어쓰기 모드는 기존 모든 사진자료실 게시글과 이미지가 삭제됩니다!</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportFile(null);
                                }}
                                disabled={isImporting}
                                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isImporting || !importFile}
                                className="flex-1 px-4 py-3 text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
                            >
                                {isImporting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        가져오는 중...
                                    </span>
                                ) : '가져오기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            <NotificationModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                isDestructive={modal.isDestructive}
            />
        </div>
    );
}
