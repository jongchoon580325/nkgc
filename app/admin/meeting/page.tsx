'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import FileUploader from '@/components/board/FileUploader';
import { BOARD_TYPES } from '@/lib/board-config';
import NotificationModal from '@/components/common/NotificationModal';
import BoardSettingsModal from '@/components/admin/BoardSettingsModal';

interface MeetingMaterial {
    id: number;
    title: string;
    displayOrder: number;
    attachments: {
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
    }[];
    createdAt: string;
}

export default function MeetingMinutesAdminPage() {
    // ── 목록 상태 ──────────────────────────────────────────────────────────
    const [materials, setMaterials] = useState<MeetingMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    // ── 피드백 배너 ────────────────────────────────────────────────────────
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ── 등록/수정 모달 ─────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<MeetingMaterial | null>(null);
    const [title, setTitle] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [existingFiles, setExistingFiles] = useState<MeetingMaterial['attachments']>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── 게시판 설정 모달 ───────────────────────────────────────────────────
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // ── 삭제 확인 모달 (NotificationModal) ────────────────────────────────
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'alert' | 'confirm';
        onConfirm?: () => void;
        isDestructive?: boolean;
    }>({ isOpen: false, title: '', message: '', type: 'alert' });

    // ── 가져오기 모달 ──────────────────────────────────────────────────────
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
    const [isImporting, setIsImporting] = useState(false);

    // ── 공통 확인 모달 (내보내기/가져오기용) ──────────────────────────────
    const [confirmModal, setConfirmModal] = useState<{
        title: string;
        message: string;
        confirmLabel: string;
        confirmStyle: 'green' | 'orange' | 'red';
        onConfirm: () => void;
    } | null>(null);

    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => { fetchMaterials(); }, [search]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/meeting?page=1&limit=200&search=${encodeURIComponent(search)}`);
            const data = await res.json();
            if (data.posts) setMaterials(data.posts);
        } catch {
            showMessage('error', '목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // ── D&D ───────────────────────────────────────────────────────────────
    const handleDragEnd = async (result: DropResult) => {
        const { source, destination } = result;
        if (!destination || destination.index === source.index) return;

        const reordered = [...materials];
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);
        setMaterials(reordered);

        const orders = reordered.map((m, idx) => ({ id: m.id, displayOrder: idx }));
        setIsSavingOrder(true);
        try {
            const res = await fetch('/api/admin/meeting', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders }),
            });
            const json = await res.json();
            if (!json.success) {
                setMaterials(materials);
                showMessage('error', '순서 저장에 실패했습니다.');
            } else {
                showMessage('success', '순서가 저장되었습니다.');
            }
        } catch {
            setMaterials(materials);
            showMessage('error', '순서 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSavingOrder(false);
        }
    };

    // ── 등록/수정 모달 ─────────────────────────────────────────────────────
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
        if (!title.trim()) { showMessage('error', '제목을 입력해주세요.'); return; }

        setIsSubmitting(true);
        try {
            const newAttachments: MeetingMaterial['attachments'] = [];
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error('파일 업로드 실패');
                const uploadData = await uploadRes.json();
                newAttachments.push({
                    fileName: uploadData.fileName,
                    fileUrl: uploadData.fileUrl,
                    fileSize: uploadData.fileSize,
                    mimeType: uploadData.mimeType,
                });
            }

            const method = editingMaterial ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/meeting', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingMaterial?.id,
                    title,
                    attachments: [...existingFiles, ...newAttachments],
                }),
            });

            if (!res.ok) throw new Error('저장 실패');
            showMessage('success', editingMaterial ? '수정되었습니다.' : '등록되었습니다.');
            handleCloseModal();
            fetchMaterials();
        } catch {
            showMessage('error', '저장에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── 삭제 ──────────────────────────────────────────────────────────────
    const handleDelete = (id: number) => {
        setNotification({
            isOpen: true,
            title: '자료 삭제',
            message: '정말로 이 자료를 삭제하시겠습니까?',
            type: 'confirm',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/meeting?id=${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('삭제 실패');
                    showMessage('success', '삭제되었습니다.');
                    fetchMaterials();
                } catch {
                    showMessage('error', '삭제에 실패했습니다.');
                } finally {
                    setNotification(prev => ({ ...prev, isOpen: false }));
                }
            },
        });
    };

    // ── 내보내기 ──────────────────────────────────────────────────────────
    const execExport = async () => {
        try {
            const res = await fetch('/api/admin/meeting/backup?format=json');
            if (!res.ok) throw new Error('내보내기 실패');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meeting_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showMessage('success', '노회록 데이터를 내보냈습니다.');
        } catch {
            showMessage('error', '내보내기 중 오류가 발생했습니다.');
        }
    };

    const handleExport = () => {
        setConfirmModal({
            title: '노회록 내보내기',
            message: '전체 노회록 데이터를 JSON 파일로 내보냅니다.\n계속하시겠습니까?',
            confirmLabel: '내보내기',
            confirmStyle: 'green',
            onConfirm: execExport,
        });
    };

    // ── 가져오기 ──────────────────────────────────────────────────────────
    const execImport = async () => {
        if (!importFile) return;
        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('mode', importMode);
            const res = await fetch('/api/admin/meeting/backup', { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
                showMessage('success', result.message);
                setShowImportModal(false);
                setImportFile(null);
                fetchMaterials();
            } else {
                showMessage('error', result.error || '가져오기에 실패했습니다.');
            }
        } catch {
            showMessage('error', '가져오기 중 오류가 발생했습니다.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleImport = () => {
        if (!importFile) { showMessage('error', '파일을 선택해주세요.'); return; }
        const isOverwrite = importMode === 'overwrite';
        setConfirmModal({
            title: isOverwrite ? '⚠️ 덮어쓰기 가져오기' : '노회록 가져오기',
            message: isOverwrite
                ? '기존 노회록 데이터가 모두 삭제되고\n새 데이터로 교체됩니다.\n\n정말 진행하시겠습니까?'
                : `"${importFile.name}" 파일의 데이터를\n기존 데이터에 병합합니다.\n계속하시겠습니까?`,
            confirmLabel: isOverwrite ? '덮어쓰기 실행' : '가져오기',
            confirmStyle: isOverwrite ? 'red' : 'orange',
            onConfirm: execImport,
        });
    };

    // ── 검색 중일 때 D&D 비활성화 ──────────────────────────────────────────
    const isDraggable = search.trim() === '';

    return (
        <div className="space-y-6">

            {/* ── 헤더 ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">노회록 관리</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        노회록 자료를 등록하고 관리합니다.
                        {isSavingOrder && (
                            <span className="ml-2 text-blue-500 font-medium animate-pulse">
                                순서 저장 중…
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-sm"
                    >
                        ⚙️ 게시판 설정
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                    >
                        📤 내보내기
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                    >
                        📥 가져오기
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                    >
                        + 자료 등록
                    </button>
                </div>
            </div>

            {/* ── 피드백 배너 ───────────────────────────────────────────── */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* ── 테이블 영역 ───────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">

                {/* 검색 바 */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="제목 검색..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-72"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="text-sm text-gray-400 hover:text-gray-600"
                        >
                            ✕ 초기화
                        </button>
                    )}
                    {!isDraggable && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            검색 중에는 순서 변경이 비활성화됩니다
                        </span>
                    )}
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                        </div>
                    ) : materials.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {search ? '검색 결과가 없습니다.' : '등록된 자료가 없습니다.'}
                        </div>
                    ) : (
                        <>
                            {isDraggable && (
                                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                                    <span>☰</span> 행을 드래그해 순서를 변경할 수 있습니다.
                                </p>
                            )}

                            <DragDropContext onDragEnd={handleDragEnd}>
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b">
                                            {isDraggable && <th className="px-3 py-4 w-8" />}
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">제목</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">첨부파일</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-700">관리</th>
                                        </tr>
                                    </thead>

                                    <Droppable droppableId="meeting-table" isDropDisabled={!isDraggable}>
                                        {(provided) => (
                                            <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                                {materials.map((item, index) => (
                                                    <Draggable
                                                        key={item.id}
                                                        draggableId={String(item.id)}
                                                        index={index}
                                                        isDragDisabled={!isDraggable}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <tr
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`border-b transition-colors ${
                                                                    snapshot.isDragging
                                                                        ? 'bg-blue-50 shadow-lg opacity-90'
                                                                        : 'hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {isDraggable && (
                                                                    <td
                                                                        className="px-3 py-4 text-gray-400 cursor-grab active:cursor-grabbing"
                                                                        {...provided.dragHandleProps}
                                                                    >
                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                            <circle cx="7" cy="5" r="1.5" />
                                                                            <circle cx="13" cy="5" r="1.5" />
                                                                            <circle cx="7" cy="10" r="1.5" />
                                                                            <circle cx="13" cy="10" r="1.5" />
                                                                            <circle cx="7" cy="15" r="1.5" />
                                                                            <circle cx="13" cy="15" r="1.5" />
                                                                        </svg>
                                                                    </td>
                                                                )}

                                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                                    {item.title}
                                                                </td>

                                                                <td className="px-6 py-4">
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

                                                                <td className="px-6 py-4 text-center">
                                                                    <div className="flex justify-center gap-2">
                                                                        <button
                                                                            onClick={() => handleOpenModal(item)}
                                                                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                                                        >
                                                                            수정
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(item.id)}
                                                                            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                                        >
                                                                            삭제
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </tbody>
                                        )}
                                    </Droppable>
                                </table>
                            </DragDropContext>
                        </>
                    )}
                </div>
            </div>

            {/* ── 등록/수정 모달 ────────────────────────────────────────── */}
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
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="자료 제목을 입력하세요"
                                    required
                                />
                            </div>

                            <div>
                                <FileUploader onFilesChange={setFiles} maxFiles={5} maxSizeMB={50} />
                                {existingFiles.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-xs font-semibold text-gray-500">기존 파일:</p>
                                        {existingFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                                                <span className="truncate max-w-[200px]">{file.fileName}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setExistingFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {files.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-xs font-semibold text-gray-500">새로 추가될 파일:</p>
                                        {files.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                                                <span className="truncate max-w-[200px]">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-700 text-xs"
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

            {/* ── 가져오기 모달 ─────────────────────────────────────────── */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">📥</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">노회록 가져오기</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">JSON 파일 선택</label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={e => setImportFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                                {importFile && (
                                    <p className="mt-1 text-sm text-gray-500">선택됨: {importFile.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">가져오기 모드</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input type="radio" name="importMode" value="merge" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} />
                                        <div>
                                            <div className="font-medium">병합 (권장)</div>
                                            <div className="text-sm text-gray-500">기존 데이터 유지, 새 데이터만 추가</div>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input type="radio" name="importMode" value="overwrite" checked={importMode === 'overwrite'} onChange={() => setImportMode('overwrite')} />
                                        <div>
                                            <div className="font-medium text-red-600">덮어쓰기</div>
                                            <div className="text-sm text-gray-500">⚠️ 기존 데이터 삭제 후 새 데이터로 대체</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {importMode === 'overwrite' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                                    ⚠️ 덮어쓰기 모드는 기존 모든 노회록 데이터가 삭제됩니다!
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={() => { setShowImportModal(false); setImportFile(null); }}
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
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        가져오는 중...
                                    </span>
                                ) : '가져오기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 공통 확인 모달 ────────────────────────────────────────── */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                confirmModal.confirmStyle === 'red' ? 'bg-red-100' :
                                confirmModal.confirmStyle === 'orange' ? 'bg-orange-100' : 'bg-green-100'
                            }`}>
                                <span className="text-xl">
                                    {confirmModal.confirmStyle === 'red' ? '⚠️' : confirmModal.confirmStyle === 'orange' ? '📥' : '📤'}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{confirmModal.title}</h2>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{confirmModal.message}</p>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => { setConfirmModal(null); confirmModal.onConfirm(); }}
                                className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium text-sm ${
                                    confirmModal.confirmStyle === 'red' ? 'bg-red-600 hover:bg-red-700' :
                                    confirmModal.confirmStyle === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
                                    'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {confirmModal.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 삭제 확인 모달 ────────────────────────────────────────── */}
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                onConfirm={notification.onConfirm}
                isDestructive={notification.isDestructive}
            />

            {/* ── 게시판 설정 모달 ──────────────────────────────────────── */}
            <BoardSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                boardType={BOARD_TYPES.MEETING_MINUTES}
            />
        </div>
    );
}
