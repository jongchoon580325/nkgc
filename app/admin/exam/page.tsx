'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/board/FileUploader';
import BoardSettingsModal from '@/components/admin/BoardSettingsModal';
import { BOARD_TYPES } from '@/lib/board-config';

interface ExamMaterial {
    id: number;
    title: string;
    attachments: {
        id: number;
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
    }[];
    createdAt: string;
}

export default function AdminExamPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [materials, setMaterials] = useState<ExamMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<ExamMaterial | null>(null);
    const [title, setTitle] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [existingFiles, setExistingFiles] = useState<any[]>([]);

    useEffect(() => {
        fetchMaterials();
    }, [page]);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/exam?page=${page}&limit=10`);
            const data = await res.json();
            setMaterials(data.posts || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (material?: ExamMaterial) => {
        if (material) {
            setEditingMaterial(material);
            setTitle(material.title);
            setExistingFiles(material.attachments || []);
        } else {
            setEditingMaterial(null);
            setTitle('');
            setExistingFiles([]);
        }
        setFiles([]);
        setIsModalOpen(true);
    };

    const handleDeleteFile = async (fileId: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        setExistingFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // 1. Upload new files if any
            const newAttachments = [];
            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(file => formData.append('file', file));

                // Assuming your upload API handles multiple files or update logic accordingly
                // Here we use single file upload per request for simplicity if needed, but standard FormData supports multiple.
                // Checking previous code: usages show single file upload loop or bulk.
                // Let's stick to simple single upload loop for robustness if bulk not explicit.
                for (const file of files) {
                    const uploadData = new FormData();
                    uploadData.append('file', file);
                    const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
                    if (res.ok) {
                        const data = await res.json();
                        newAttachments.push({
                            fileName: data.fileName,
                            fileUrl: data.fileUrl,
                            fileSize: data.fileSize,
                            mimeType: data.mimeType
                        });
                    }
                }
            }

            // 2. Prepare payload
            const payload = {
                title,
                attachments: [
                    ...existingFiles, // Keep existing ones (IDs are enough usually, but API might expect objects)
                    ...newAttachments
                ]
            };

            const url = '/api/admin/exam';
            const method = editingMaterial ? 'PUT' : 'POST';
            const body = editingMaterial ? { ...payload, id: editingMaterial.id } : payload;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed to save');

            setIsModalOpen(false);
            fetchMaterials();
        } catch (error) {
            console.error(error);
            alert('저장 실패');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/admin/exam?id=${id}`, { method: 'DELETE' });
            fetchMaterials();
        } catch (error) {
            console.error(error);
            alert('삭제 실패');
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">응시자 자료 관리</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        ⚙️ 게시판 설정
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        + 자료 등록
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 w-16 text-center text-gray-500">ID</th>
                            <th className="p-4 text-gray-500">제목</th>
                            <th className="p-4 w-32 text-center text-gray-500">첨부파일</th>
                            <th className="p-4 w-40 text-center text-gray-500">등록일</th>
                            <th className="p-4 w-32 text-center text-gray-500">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {materials.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4 text-center text-gray-500">{item.id}</td>
                                <td className="p-4 font-medium">{item.title}</td>
                                <td className="p-4 text-center">
                                    {item.attachments?.length > 0 ? (
                                        <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                                            {item.attachments.length}개
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="p-4 text-center text-gray-500 text-sm">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-500 hover:underline text-sm"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {materials.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    등록된 자료가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination ... (Simplified for brevity if needed, but keeping existing is safer if not fully rewriting) 
               Actually I'm replacing the whole file so I should keep pagination logic.
            */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        이전
                    </button>
                    <span className="px-3 py-1">{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        다음
                    </button>
                </div>
            )}

            {/* Post Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editingMaterial ? '자료 수정' : '새 자료 등록'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">제목</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">첨부파일 (PDF 권장)</label>
                                <FileUploader onFilesChange={setFiles} />

                                {existingFiles.length > 0 && (
                                    <ul className="mt-3 space-y-2">
                                        {existingFiles.map((file, idx) => (
                                            <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                                <a href={file.fileUrl} target="_blank" className="text-blue-600 hover:underline truncate max-w-[300px]">
                                                    {file.fileName}
                                                </a>
                                                <button type="button" onClick={() => handleDeleteFile(file.id || file.fileUrl)} className="text-red-500 hover:text-red-700">
                                                    삭제
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">취소</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">저장</button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            {/* Board Settings Modal */}
            <BoardSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                boardType={BOARD_TYPES.EXAM_USER}
            />
        </div >
    );
}
