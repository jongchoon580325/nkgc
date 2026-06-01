'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getFolderContents, createFolder, getAllFolders } from '@/app/actions/folders';
import { bulkDeleteAssets, moveAssets, updateAssetMetadata } from '@/app/actions/media';
import { getFileIcon, isImage, buildFolderTree } from '@/lib/utils/media';
import MediaUploader from './MediaUploader';
import NotificationModal from '@/components/common/NotificationModal';

interface MediaManagerProps {
    initialFolderId?: string | null;
    onSelect?: (assets: any[]) => void;
    selectionMode?: 'single' | 'multiple';
}

export default function MediaManager({
    initialFolderId = null,
    onSelect,
    selectionMode = 'multiple'
}: MediaManagerProps) {
    const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
    const [items, setItems] = useState<{ folders: any[]; assets: any[]; breadcrumbs: any[] }>({ folders: [], assets: [], breadcrumbs: [] });

    // Selection
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());

    // Detail Panel State
    const [detailAsset, setDetailAsset] = useState<any | null>(null);
    const [isSavingMeta, setIsSavingMeta] = useState(false);
    const [metaForm, setMetaForm] = useState({ filename: '', altText: '', caption: '', description: '' });

    // Move Modal State
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [folderTree, setFolderTree] = useState<any[]>([]);
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert' as 'alert' | 'confirm',
        onConfirm: undefined as (() => void) | undefined,
        isDestructive: false
    });

    const showAlert = (title: string, message: string) => {
        setModal({ isOpen: true, title, message, type: 'alert', onConfirm: undefined, isDestructive: false });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
        setModal({ isOpen: true, title, message, type: 'confirm', onConfirm, isDestructive });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    // Load Folder Contents
    const refresh = useCallback(async () => {
        const data = await getFolderContents(currentFolderId);
        setItems(data as any);
        setSelectedAssets(new Set());
        setSelectedFolders(new Set());
        setDetailAsset(null);
    }, [currentFolderId]);

    useEffect(() => { refresh(); }, [refresh]);

    // Update Detail Panel when selection changes (Single Select priority)
    useEffect(() => {
        if (selectedAssets.size === 1) {
            const id = Array.from(selectedAssets)[0];
            const asset = items.assets.find((a: any) => a.id === id);
            if (asset) {
                setDetailAsset(asset);
                setMetaForm({
                    filename: asset.filename || '',
                    altText: asset.altText || '',
                    caption: asset.caption || '',
                    description: asset.description || ''
                });
                return;
            }
        }
        setDetailAsset(null);
    }, [selectedAssets, items.assets]);


    // Actions
    const handleDeleteClick = () => {
        const totalCount = selectedAssets.size + selectedFolders.size;
        if (totalCount === 0) return;

        showConfirm(
            '항목 삭제',
            `${totalCount}개의 항목을 삭제하시겠습니까?\n주의: 폴더 삭제 시 내부 파일도 모두 삭제됩니다.`,
            executeDelete,
            true
        );
    };

    const executeDelete = async () => {
        // Delete Assets
        if (selectedAssets.size > 0) {
            const result = await bulkDeleteAssets(Array.from(selectedAssets));
            if (!result.success) {
                showAlert('삭제 실패', '파일 삭제 실패: ' + result.error);
                return;
            }
        }

        // Delete Folders
        if (selectedFolders.size > 0) {
            const { deleteFolders } = await import('@/app/actions/folders');
            const result = await deleteFolders(Array.from(selectedFolders));
            if (!result.success) {
                showAlert('삭제 실패', '폴더 삭제 실패: ' + result.error);
                return;
            }
        }

        showAlert('삭제 완료', '선택한 항목이 삭제되었습니다.');
        refresh();
        closeModal(); // Close confirm modal if still implicitly handled (though onConfirm closes it usually, our modal auto-closes on action, but we might want to chain)
        // Note: NotificationModal implementation closes on button click. But since execute is async, we might want to keep it open or show loading?
        // Current implementation of NotificationModal closes immediately when button clicked. 
        // So this function runs *after* modal is closed. 
        // Then we show new alert.
    };

    const openMoveModal = async () => {
        const res = await getAllFolders();
        if (res.success && res.folders) {
            const tree = buildFolderTree(res.folders);
            setFolderTree(tree);
            setIsMoveModalOpen(true);
            setTargetFolderId(null);
        }
    };

    const handleMove = async () => {
        const result = await moveAssets(Array.from(selectedAssets), targetFolderId);
        if (result.success) {
            showAlert('이동 완료', '파일이 이동되었습니다.');
            setIsMoveModalOpen(false);
            refresh();
        } else {
            showAlert('이동 실패', '이동 실패: ' + result.error);
        }
    };

    const handleCreateFolder = async () => {
        const name = prompt("새 폴더 이름:");
        if (!name) return;
        const res = await createFolder(name, currentFolderId);
        if (res.success) {
            refresh();
            // Optional: showAlert('성공', '폴더가 생성되었습니다.'); -> Native behavior didn't have success alert for this usually to be fast, but previous code had invalid logic (refresh OR alert error). 
            // I will stick to error alert only for speed, or add success toast later. 
            // User asked to replace alerts. Previous code: if error -> alert.
        }
        else showAlert('생성 실패', res.error || '알 수 없는 오류');
    };

    const handleSaveMetadata = async () => {
        if (!detailAsset) return;
        setIsSavingMeta(true);
        const res = await updateAssetMetadata(detailAsset.id, metaForm);
        setIsSavingMeta(false);
        if (res.success) {
            // Update local state to reflect changes immediately
            const updatedAssets = items.assets.map(a => a.id === detailAsset.id ? { ...a, ...metaForm } : a);
            setItems(prev => ({ ...prev, assets: updatedAssets }));
            showAlert('저장 완료', '메타데이터가 저장되었습니다.');
        } else {
            showAlert('저장 실패', '저장 실패: ' + res.error);
        }
    };

    const toggleSelection = (id: string | number, multi: boolean) => {
        const strId = String(id);
        if (selectionMode === 'single') {
            setSelectedAssets(new Set([strId]));
            return;
        }
        const newSet = new Set(multi ? selectedAssets : []);
        if (newSet.has(strId)) newSet.delete(strId);
        else newSet.add(strId);
        setSelectedAssets(newSet);
    };

    const toggleFolderSelection = (id: string, multi: boolean) => {
        const newSet = new Set(multi ? selectedFolders : []);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedFolders(newSet);
    };

    return (
        <div className="flex h-[calc(100vh-200px)] min-h-[600px] bg-white rounded-lg shadow border overflow-hidden">
            {/* Modal Injection */}
            <NotificationModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                isDestructive={modal.isDestructive}
            />

            {/* Left: Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="h-16 border-b flex items-center justify-between px-4 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveTab('library')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'library' ? 'bg-white text-blue-600 shadow-sm border' : 'text-gray-600 hover:bg-gray-100'}`}>
                            🗂️ 라이브러리
                        </button>
                        <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'upload' ? 'bg-white text-blue-600 shadow-sm border' : 'text-gray-600 hover:bg-gray-100'}`}>
                            📤 업로드
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-2" />
                        <button onClick={handleCreateFolder} className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-gray-200 transition-all flex items-center gap-1">
                            📁 새 폴더
                        </button>
                    </div>

                    {/* Bulk Actions or Selection Confirm */}
                    {(selectedAssets.size > 0 || selectedFolders.size > 0) && activeTab === 'library' && (
                        <div className="flex items-center gap-2 animate-fadeIn">
                            <span className="text-sm font-medium text-blue-600 mr-2">
                                {selectedAssets.size + selectedFolders.size}개 선택
                            </span>

                            {onSelect ? (
                                <button
                                    onClick={() => {
                                        const selected = items.assets.filter(a => selectedAssets.has(String(a.id)));
                                        onSelect(selected);
                                    }}
                                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm font-medium"
                                >
                                    선택 완료
                                </button>
                            ) : (
                                <>
                                    <button onClick={openMoveModal} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 shadow-sm">
                                        이동
                                    </button>
                                    <button onClick={handleDeleteClick} className="px-3 py-1.5 text-sm bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 shadow-sm">
                                        삭제
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Breadcrumbs */}
                {activeTab === 'library' && (
                    <div className="px-4 py-3 border-b flex items-center gap-2 text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
                        <button onClick={() => setCurrentFolderId(null)} className={`hover:text-blue-600 ${!currentFolderId ? 'font-bold text-gray-900' : ''}`}>Root</button>
                        {items.breadcrumbs.map((b: any) => (
                            <span key={b.id} className="flex items-center">
                                <span className="mx-1 text-gray-400">/</span>
                                <button onClick={() => setCurrentFolderId(b.id)} className="hover:text-blue-600 hover:underline">{b.name}</button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Main Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                    {activeTab === 'upload' ? (
                        <MediaUploader
                            initialFolderId={currentFolderId}
                            onUploadComplete={() => {
                                setActiveTab('library');
                                refresh();
                            }}
                            onShowAlert={showAlert}
                        />
                    ) : (
                        <>
                            {items.folders.length === 0 && items.assets.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <span className="text-4xl mb-3 opacity-50">📂</span>
                                    <p>폴더가 비어있습니다.</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 content-start">
                                {/* Folders */}
                                {items.folders.map((f: any) => (
                                    <div
                                        key={f.id}
                                        onDoubleClick={() => setCurrentFolderId(f.id)}
                                        onClick={(e) => toggleFolderSelection(f.id, e.metaKey || e.ctrlKey)} // Click to select
                                        className={`aspect-[4/3] p-3 border rounded-xl cursor-pointer flex flex-col items-center justify-center transition-all group relative
                                            ${selectedFolders.has(f.id) ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 ring-offset-2' : 'bg-yellow-50/80 hover:bg-yellow-100 border-gray-200 hover:shadow-md'}
                                        `}
                                    >
                                        <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📁</span>
                                        <span className="text-sm font-medium text-center truncate w-full text-gray-700">{f.name}</span>

                                        {/* Folder Checkbox */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFolderSelection(f.id, true);
                                            }}
                                            className={`absolute top-2 left-2 w-5 h-5 rounded border bg-white/80 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-white z-20 shadow-sm transition-all
                                             ${selectedFolders.has(f.id) ? 'border-blue-500 bg-white text-black' : 'border-gray-300 opacity-0 group-hover:opacity-100'}
                                            `}
                                        >
                                            {selectedFolders.has(f.id) && (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Assets */}
                                {items.assets.map((a: any) => (
                                    <div
                                        key={a.id}
                                        onClick={(e) => {
                                            if (onSelect) {
                                                toggleSelection(a.id, selectionMode === 'multiple' ? (e.metaKey || e.ctrlKey) : false);
                                            } else {
                                                toggleSelection(a.id, e.metaKey || e.ctrlKey);
                                            }
                                        }}
                                        className={`relative aspect-square border rounded-xl overflow-hidden cursor-pointer group transition-all
                                            ${selectedAssets.has(a.id) ? 'ring-2 ring-blue-500 ring-offset-2 border-transparent shadow-md' : 'border-gray-200 hover:shadow-md'}
                                        `}
                                    >
                                        {isImage(a.mimeType) ? (
                                            <Image src={a.path} alt={a.filename} fill className="object-cover bg-gray-100" sizes="200px" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-4xl">
                                                {getFileIcon(a.mimeType)}
                                            </div>
                                        )}

                                        {/* Link Link / Checkbox for Multi-Select */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelection(a.id, true);
                                            }}
                                            className={`absolute top-2 left-2 w-5 h-5 rounded border bg-white/80 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-white z-20 shadow-sm transition-all
                                             ${selectedAssets.has(a.id) ? 'border-blue-500 bg-white text-black' : 'border-gray-300 opacity-0 group-hover:opacity-100'}
                                            `}
                                        >
                                            {selectedAssets.has(a.id) && (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>

                                        {selectedAssets.has(a.id) && (
                                            <div className="absolute inset-0 bg-blue-500/10 z-10 pointer-events-none" />
                                        )}
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-[2px] p-1.5">
                                            <p className="text-xs text-white truncate text-center">{a.filename}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Detail View Panel */}
            {detailAsset && (
                <div className="w-80 border-l bg-white flex flex-col h-full shadow-xl transition-all z-20">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">상세 정보</h3>
                        <button onClick={() => setDetailAsset(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Preview */}
                        <div className="aspect-video bg-gray-100 rounded-lg relative overflow-hidden border flex items-center justify-center">
                            {isImage(detailAsset.mimeType) ? (
                                <Image
                                    src={detailAsset.path}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 320px"
                                />
                            ) : (
                                <div className="text-6xl">{getFileIcon(detailAsset.mimeType)}</div>
                            )}
                        </div>

                        {/* Metadata Form */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">파일 이름</label>
                                <input
                                    type="text"
                                    value={metaForm.filename}
                                    onChange={e => setMetaForm({ ...metaForm, filename: e.target.value })}
                                    className="w-full text-sm border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">대체 텍스트 (Alt)</label>
                                <input
                                    type="text"
                                    value={metaForm.altText}
                                    placeholder="이미지 설명 (시각장애인용)"
                                    onChange={e => setMetaForm({ ...metaForm, altText: e.target.value })}
                                    className="w-full text-sm border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">캡션 (Caption)</label>
                                <input
                                    type="text"
                                    value={metaForm.caption}
                                    placeholder="이미지 하단 표시 텍스트"
                                    onChange={e => setMetaForm({ ...metaForm, caption: e.target.value })}
                                    className="w-full text-sm border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">상세 설명 / 메모</label>
                                <textarea
                                    value={metaForm.description}
                                    placeholder="관리자용 메모"
                                    onChange={e => setMetaForm({ ...metaForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full text-sm border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Info Table */}
                        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                            <div className="flex justify-between"><span>크기:</span> <span>{(detailAsset.size / 1024).toFixed(1)} KB</span></div>
                            <div className="flex justify-between"><span>해상도:</span> <span>{detailAsset.width} x {detailAsset.height}</span></div>
                            <div className="flex justify-between"><span>업로드:</span> <span>{new Date(detailAsset.uploadedAt).toLocaleDateString()}</span></div>
                            <div className="flex justify-between"><span>유형:</span> <span className="uppercase">{detailAsset.mimeType.split('/')[1]}</span></div>
                        </div>

                        {/* Links */}
                        <div className="pt-2">
                            <a href={detailAsset.path} target="_blank" rel="noopener noreferrer" className="block w-full text-center text-sm text-blue-600 hover:underline mb-2">
                                원본 보기 ↗
                            </a>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin + detailAsset.path);
                                    showAlert('복사 완료', 'URL이 클립보드에 복사되었습니다.');
                                }}
                                className="w-full py-2 border rounded-md text-sm hover:bg-gray-50 text-gray-600"
                            >
                                🔗 URL 복사
                            </button>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-gray-50">
                        <button
                            onClick={handleSaveMetadata}
                            disabled={isSavingMeta}
                            className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {isSavingMeta ? '저장 중...' : '변경사항 저장'}
                        </button>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {isMoveModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-lg p-6 w-[400px] shadow-2xl scale-100 animate-scaleIn">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">폴더 이동</h3>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">이동할 위치 선택:</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                onChange={(e) => setTargetFolderId(e.target.value || null)}
                                value={targetFolderId || ''}
                                size={8} // List box style
                            >
                                <option value="">🏠 Root (최상위)</option>
                                {folderTree.map((f: any) => (
                                    <option key={f.id} value={f.id}>
                                        {'\u00A0\u00A0'.repeat(f.depth)}📁 {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 text-sm">
                            <button
                                onClick={() => setIsMoveModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleMove}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm"
                            >
                                {selectedAssets.size}개 항목 이동
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
