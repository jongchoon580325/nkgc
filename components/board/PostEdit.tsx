'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BoardType, BOARD_CONFIG } from '@/lib/board-config';
import PageHeader from '@/components/common/PageHeader';
// import FileUploader from './FileUploader';
import TiptapEditor from './TiptapEditor';
import MediaPickerModal from '@/components/media/MediaPickerModal';
import NotificationModal from '@/components/common/NotificationModal';
import Image from 'next/image';
import { getFileIcon, isImage } from '@/lib/utils/media';


interface PostEditProps {
    boardType: BoardType;
    postId: string;
}

interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
}

export default function PostEdit({ boardType, postId }: PostEditProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const config = BOARD_CONFIG[boardType];

    // Get returnUrl from query params
    const returnUrl = searchParams.get('returnUrl');

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isNotice, setIsNotice] = useState(false);
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [authorName, setAuthorName] = useState(''); // 작성자 이름

    // File handling
    const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
    const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);
    // const [newFiles, setNewFiles] = useState<File[]>([]); // Deprecated

    // IMMS New Attachments
    const [newAttachedAssets, setNewAttachedAssets] = useState<any[]>([]);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

    // Modal Handling
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

    // Categories state
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
        if (status === 'authenticated') {
            fetchCategories();
            fetchPost();
        }
    }, [status, postId]);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`/api/board-settings/${boardType}`);
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchPost = async () => {
        try {
            const res = await fetch(`/api/posts/${postId}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // 권한 체크
            const isAuthor = session?.user?.id === data.author.id.toString();
            const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'ADMIN';

            if (!isAuthor && !isAdmin) {
                showAlert('권한 없음', '수정 권한이 없습니다.');
                setTimeout(() => router.back(), 1000); // Give time to read
                return;
            }

            setTitle(data.title);
            setContent(data.content);
            setIsNotice(data.isNotice);
            setCategory(data.category || '');
            setAuthorName(data.authorName || data.author.name || ''); // authorName 우선, 없으면 author.name
            setExistingAttachments(data.attachments);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching post:', error);
            showAlert('오류', '게시글을 불러오는 중 오류가 발생했습니다.');
            // router.back(); // Optional: maybe let them stay and try again?
        }
    };

    const handleDeleteExistingFile = (fileId: number) => {
        showConfirm(
            '파일 삭제',
            '이 파일을 삭제하시겠습니까? (저장 시 반영됩니다)',
            () => {
                setDeletedFileIds(prev => [...prev, fileId]);
                setExistingAttachments(prev => prev.filter(f => f.id !== fileId));
            },
            true
        );
    };

    const handleMediaSelect = (selectedAssets: any[]) => {
        // Filter out duplicates based on ID (check both newAssets and existingAttachments providers/paths if possible, but here simple ID check on new assets)
        const newAssets = selectedAssets.filter(
            newItem => !newAttachedAssets.some(existing => existing.id === newItem.id)
        );
        setNewAttachedAssets(prev => [...prev, ...newAssets]);

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

    const removeNewAttachment = (id: string) => {
        setNewAttachedAssets(prev => prev.filter(a => a.id !== id));
    };

    // uploadFiles removed (using Media Library now)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            showAlert('입력 오류', '제목과 내용을 입력해주세요.');
            return;
        }

        if (config.categories && config.categories.length > 0 && !category) {
            showAlert('입력 오류', '카테고리를 선택해주세요.');
            return;
        }

        showConfirm('게시글 수정', '게시글을 수정하시겠습니까?', async () => {
            setSubmitting(true);

            try {
                // 1. Prepare new attachments from selected assets
                const newAttachments = newAttachedAssets.map(asset => ({
                    fileName: asset.filename,
                    fileUrl: asset.path,
                    fileSize: asset.size,
                    mimeType: asset.mimeType
                }));

                // 2. Update post
                const res = await fetch(`/api/posts/${postId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title,
                        content,
                        isNotice,
                        category,
                        newAttachments: newAttachments,
                        deletedFileIds,
                        authorName,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || '게시글 수정 실패');
                }

                // Success
                // Use returnUrl if provided, otherwise default to post detail page
                const redirectUrl = returnUrl || `/board/${boardType}/${postId}`;
                router.push(redirectUrl);
                router.refresh();

            } catch (error) {
                console.error('Error updating post:', error);
                showAlert('수정 실패', error instanceof Error ? error.message : '게시글 수정 중 오류가 발생했습니다.');
                setSubmitting(false);
            }
        });
    };

    if (loading) {
        return <div className="p-8 text-center">로딩 중...</div>;
    }

    const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'ADMIN';
    // const categories = config.categories || []; // Replaced by dynamic state

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title={`${config.title} 수정`} />

            <div className="container mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category & Notice */}
                        <div className="flex gap-4">
                            {categories.length > 0 && (
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium mb-2">카테고리</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">선택하세요</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {isAdmin && (
                                <div className="flex items-center mt-7">
                                    <input
                                        type="checkbox"
                                        id="isNotice"
                                        checked={isNotice}
                                        onChange={(e) => setIsNotice(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="isNotice" className="ml-2 text-sm font-medium text-gray-700">
                                        공지사항으로 등록
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Author Name (Admin Only) */}
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-medium mb-2">작성자</label>
                                <input
                                    type="text"
                                    value={authorName}
                                    onChange={(e) => setAuthorName(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="작성자 이름"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    관리자는 작성자 이름을 수정할 수 있습니다.
                                </p>
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2">제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="제목을 입력하세요"
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium mb-2">내용</label>
                            <TiptapEditor
                                value={content}
                                onChange={setContent}
                            />
                        </div>

                        {/* Existing Files */}
                        {existingAttachments.length > 0 && (
                            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-medium mb-3">기존 첨부파일</h3>
                                <ul className="space-y-2">
                                    {existingAttachments.map((file) => (
                                        <li key={file.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-gray-700">
                                                <span className="mr-2">📎</span>
                                                {file.fileName} ({(file.fileSize / 1024).toFixed(1)} KB)
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteExistingFile(file.id)}
                                                className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                                            >
                                                삭제
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* New File Upload (Media Picker) */}
                        <div className="space-y-4 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium">추가 파일 첨부</label>
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

                            {/* New Attachments List */}
                            {newAttachedAssets.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {newAttachedAssets.map((asset) => (
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
                                                onClick={() => removeNewAttachment(asset.id)}
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
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                            >
                                {submitting ? '저장 중...' : '수정하기'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {/* Components Outside Main Layout */}
            <NotificationModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                isDestructive={modal.isDestructive}
            />

            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                selectionMode="multiple"
            />
        </main>
    );
}
