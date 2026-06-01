'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import FileUploader from '@/components/board/FileUploader';
import { BOARD_TYPES } from '@/lib/board-config';
import NotificationModal from '@/components/common/NotificationModal';
import BoardSettingsModal from '@/components/admin/BoardSettingsModal';

interface MeetingMaterial {
    id: number;
    title: string;
    attachments: any[];
    createdAt: string;
}

export default function MeetingMinutesAdminPage() {
    const [materials, setMaterials] = useState<MeetingMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<MeetingMaterial | null>(null);
    const [title, setTitle] = useState('');
    const [files, setFiles] = useState<File[]>([]); // New files to upload
    const [existingFiles, setExistingFiles] = useState<any[]>([]); // Existing files from DB
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Notification Modal State
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'alert' | 'confirm';
        onConfirm?: () => void;
        isDestructive?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert',
    });

    useEffect(() => {
        fetchMaterials();
    }, [page, search]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/meeting?page=${page}&limit=10&search=${search}`);
            const data = await res.json();
            if (data.posts) {
                setMaterials(data.posts);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (material?: MeetingMaterial) => {
        if (material) {
            setEditingMaterial(material);
            setTitle(material.title);
            setExistingFiles(material.attachments || []);
            setFiles([]);
        } else {
            setEditingMaterial(null);
            setTitle('');
            setExistingFiles([]);
            setFiles([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMaterial(null);
        setTitle('');
        setExistingFiles([]);
        setFiles([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return alert('제목을 입력해주세요.');

        setIsSubmitting(true);
        try {
            // 1. Upload new files first
            const newAttachments = [];
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error('File upload failed');

                const uploadData = await uploadRes.json();
                newAttachments.push({
                    fileName: uploadData.fileName,
                    fileUrl: uploadData.fileUrl,
                    fileSize: uploadData.fileSize,
                    mimeType: uploadData.mimeType,
                });
            }

            // Combine with existing files
            const finalAttachments = [...existingFiles, ...newAttachments];

            const url = '/api/admin/meeting';
            const method = editingMaterial ? 'PUT' : 'POST';
            const body = {
                id: editingMaterial?.id,
                title,
                attachments: finalAttachments,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed to save');

            handleCloseModal();
            fetchMaterials();
        } catch (error) {
            console.error('Error saving material:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        setNotification({
            isOpen: true,
            title: '자료 삭제',
            message: '정말로 이 자료를 삭제하시겠습니까?',
            type: 'confirm',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/meeting?id=${id}`, {
                        method: 'DELETE',
                    });

                    if (!res.ok) throw new Error('Failed to delete');
                    fetchMaterials();
                    setNotification(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error('Error deleting material:', error);
                    alert('삭제에 실패했습니다.');
                }
            }
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="노회록 관리" description="노회록 자료를 등록하고 관리합니다." />

            {/* Actions */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="제목 검색..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        ⚙️ 게시판 설정
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        자료 등록
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">제목</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">첨부파일</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">등록일</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    로딩 중...
                                </td>
                            </tr>
                        ) : materials.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    등록된 자료가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            materials.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {item.attachments?.length > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                {item.attachments.length}개 파일
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination is simplified for now, can be added later if needed */}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingMaterial ? '자료 수정' : '새 자료 등록'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    제목 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="자료 제목을 입력하세요"
                                    required
                                />
                            </div>

                            <div>
                                <FileUploader
                                    onFilesChange={setFiles}
                                    maxFiles={5}
                                    maxSizeMB={50}
                                />
                                {/* Display existing files */}
                                {existingFiles.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-xs font-semibold text-gray-500">기존 파일:</p>
                                        {existingFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                                                <span className="truncate max-w-[200px]">{file.fileName}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setExistingFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Display newly selected files */}
                                {files.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-xs font-semibold text-gray-500">새로 추가될 파일:</p>
                                        {files.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                                                <span className="truncate max-w-[200px]">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? '저장 중...' : '저장하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                onConfirm={notification.onConfirm}
                isDestructive={notification.isDestructive}
            />

            {/* Board Settings Modal */}
            <BoardSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                boardType={BOARD_TYPES.MEETING_MINUTES}
            />
        </div>
    );
}
