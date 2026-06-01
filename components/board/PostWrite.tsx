'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { BoardType, BOARD_CONFIG } from '@/lib/board-config';
import PageHeader from '@/components/common/PageHeader';
// import FileUploader from './FileUploader'; // Deprecated
import TiptapEditor from './TiptapEditor';
import MediaPickerModal from '@/components/media/MediaPickerModal';
import NotificationModal from '@/components/common/NotificationModal';
import Image from 'next/image';
import { getFileIcon, isImage } from '@/lib/utils/media';

interface PostWriteProps {
    boardType: BoardType;
}

export default function PostWrite({ boardType }: PostWriteProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [isNotice, setIsNotice] = useState(false);

    // New Attachments State (IMMS)
    const [attachedAssets, setAttachedAssets] = useState<any[]>([]);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

    const [categories, setCategories] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [honeypot, setHoneypot] = useState('');
    const [pageLoadTime] = useState(Date.now());
    const [authorName, setAuthorName] = useState(''); // 작성자 이름

    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const config = BOARD_CONFIG[boardType];
    const userRole = session?.user?.role;
    const isAdmin = userRole === 'admin' || userRole === 'ADMIN';

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

    // Get returnUrl from query params
    const returnUrl = searchParams.get('returnUrl');

    useEffect(() => {
        // Fetch categories for this board
        fetchCategories();

        // Set default author name
        if (session?.user) {
            setAuthorName(isAdmin ? '관리자' : session.user.name || '');
        }
    }, [boardType, session, isAdmin]);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`/api/board-settings/${boardType}`);
            const data = await res.json();
            setCategories(data.categories || []);

            // Set default category if available
            if (data.categories && data.categories.length > 0) {
                setCategory(data.categories[0]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleMediaSelect = (selectedAssets: any[]) => {
        // Filter out duplicates based on ID
        const newAssets = selectedAssets.filter(
            newItem => !attachedAssets.some(existing => existing.id === newItem.id)
        );
        setAttachedAssets(prev => [...prev, ...newAssets]);

        // Auto-insert images into editor content
        let contentToAdd = '';
        newAssets.forEach(asset => {
            if (isImage(asset.mimeType)) {
                contentToAdd += `<img src="${asset.path}" alt="${asset.altText || asset.filename}" />`;
            }
        });

        if (contentToAdd) {
            // Append to existing content (add a newline if needed)
            setContent(prev => prev + (prev ? '<p></p>' : '') + contentToAdd);
        }
    };

    const removeAttachment = (id: string) => {
        setAttachedAssets(prev => prev.filter(a => a.id !== id));
    };

    // Legacy upload function removed.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!title.trim() || !content.trim()) {
            showAlert('입력 오류', '제목과 내용을 입력해주세요.');
            return;
        }

        // Spam check
        if (honeypot) return; // Bot detected
        const elapsedTime = Date.now() - pageLoadTime;
        if (elapsedTime < 3000) {
            showAlert('작성 제한', '너무 빨리 제출되었습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        setSubmitting(true);

        try {
            // 1. Prepare attachments (Map FileAsset to Attachment format)
            const attachments = attachedAssets.map(asset => ({
                fileName: asset.filename,
                fileUrl: asset.path,
                fileSize: asset.size,
                mimeType: asset.mimeType
            }));

            // 2. Create post
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    boardType,
                    category,
                    isNotice,
                    attachments: attachments,
                    authorName, // 작성자 이름 추가
                }),
            });

            if (res.ok) {
                // Use returnUrl if provided, otherwise default to board page
                const redirectUrl = returnUrl || `/board/${boardType}`;
                router.push(redirectUrl);
                router.refresh();
            } else {
                try {
                    const data = await res.json();
                    showAlert('작성 실패', data.error || '글 작성에 실패했습니다.');
                } catch (e) {
                    showAlert('작성 실패', '글 작성에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('Error creating post:', error);
            showAlert('오류', '오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center py-12">
                    <p className="text-gray-600">로그인이 필요합니다.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title={`${config.title} - 글쓰기`} />

            <div className="container mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Honeypot (hidden) */}
                        <input
                            type="text"
                            name="website"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                            style={{ display: 'none' }}
                            tabIndex={-1}
                            autoComplete="off"
                        />

                        {/* 공지사항 & 카테고리 */}
                        <div className="flex flex-wrap gap-4 items-center">
                            {/* 공지사항 체크박스 (관리자만) */}
                            {isAdmin && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isNotice"
                                        checked={isNotice}
                                        onChange={(e) => setIsNotice(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="isNotice" className="text-sm font-semibold">
                                        공지사항
                                    </label>
                                </div>
                            )}

                            {/* 카테고리 선택 */}
                            {categories.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <label htmlFor="category" className="text-sm font-medium">
                                        카테고리
                                    </label>
                                    <select
                                        id="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="border border-gray-300 rounded px-3 py-1 text-sm"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* 작성자 */}
                        <div>
                            <label htmlFor="authorName" className="block text-sm font-medium mb-2">
                                작성자 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="authorName"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                readOnly={!isAdmin}
                                className={`w-full border border-gray-300 rounded-lg px-4 py-2 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                                    }`}
                                placeholder="작성자 이름"
                                required
                            />
                            {!isAdmin && (
                                <p className="text-xs text-gray-500 mt-1">
                                    작성자 이름은 로그인한 사용자 이름으로 자동 설정됩니다.
                                </p>
                            )}
                            {isAdmin && (
                                <p className="text-xs text-gray-500 mt-1">
                                    관리자는 작성자 이름을 직접 입력할 수 있습니다.
                                </p>
                            )}
                        </div>

                        {/* 제목 */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium mb-2">
                                제목 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                placeholder="제목을 입력하세요"
                                required
                            />
                        </div>

                        {/* 내용 */}
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium mb-2">
                                내용 <span className="text-red-500">*</span>
                            </label>
                            <TiptapEditor
                                value={content}
                                onChange={setContent}
                                placeholder="내용을 입력하세요"
                            />
                        </div>

                        {/* 첨부파일 (IMMS) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium">첨부파일</label>
                                <button
                                    type="button"
                                    onClick={() => setIsMediaPickerOpen(true)}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    파일 추가 (미디어 라이브러리)
                                </button>
                            </div>

                            {/* Attachments List */}
                            {attachedAssets.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {attachedAssets.map((asset) => (
                                        <div key={asset.id} className="relative group border rounded-lg bg-gray-50 p-2 flex flex-col gap-2">
                                            {/* Preview */}
                                            <div className="aspect-video relative rounded bg-gray-200 overflow-hidden flex items-center justify-center">
                                                {isImage(asset.mimeType) ? (
                                                    <Image
                                                        src={asset.path}
                                                        alt={asset.filename}
                                                        fill
                                                        className="object-cover"
                                                        sizes="200px"
                                                    />
                                                ) : (
                                                    <span className="text-3xl">{getFileIcon(asset.mimeType)}</span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="text-xs text-gray-600 truncate px-1">
                                                {asset.filename}
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(asset.id)}
                                                className="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1 shadow hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="삭제"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {attachedAssets.length === 0 && (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 bg-gray-50/50">
                                    <p className="text-sm">첨부된 파일이 없습니다.</p>
                                    <p className="text-xs text-gray-400 mt-1">'파일 추가' 버튼을 눌러 이미지를 선택하세요.</p>
                                </div>
                            )}
                        </div>

                        {/* Media Picker Modal */}
                        <MediaPickerModal
                            isOpen={isMediaPickerOpen}
                            onClose={() => setIsMediaPickerOpen(false)}
                            onSelect={handleMediaSelect}
                            selectionMode="multiple"
                        />

                        {/* 버튼 */}
                        <div className="flex gap-2 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? '작성 중...' : '작성하기'}
                            </button>
                        </div>
                    </form>
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
        </main>
    );
}
