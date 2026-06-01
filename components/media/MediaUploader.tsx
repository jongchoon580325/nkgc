'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { buildFolderTree } from '@/lib/utils/media';
import { getAllFolders, createFolder } from '@/app/actions/folders';

interface MediaUploaderProps {
    initialFolderId?: string | null;
    onUploadComplete?: () => void;
    allowFolderSelection?: boolean;
    onShowAlert?: (title: string, message: string) => void;
}

export default function MediaUploader({
    initialFolderId = null,
    onUploadComplete,
    allowFolderSelection = true,
    onShowAlert
}: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    // Initialize with prop, but allow internal changes
    const [targetFolderId, setTargetFolderId] = useState<string | null>(initialFolderId);

    // Sync state if prop changes (e.g. user navigates in library then switches tab)
    useEffect(() => {
        if (initialFolderId !== undefined) {
            setTargetFolderId(initialFolderId);
        }
    }, [initialFolderId]);

    const [folderTree, setFolderTree] = useState<any[]>([]);

    // Folder Creation State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const safeAlert = (title: string, message: string) => {
        if (onShowAlert) onShowAlert(title, message);
        else alert(`${title}: ${message}`);
    };

    // Load folders for dropdown
    const loadFolders = useCallback(async () => {
        if (!allowFolderSelection) return;
        const res = await getAllFolders();
        if (res.success && res.folders) {
            setFolderTree(buildFolderTree(res.folders));
        }
    }, [allowFolderSelection]);

    useEffect(() => { loadFolders(); }, [loadFolders]);

    // Handle File Drop
    const onDrop = useCallback(async (files: File[]) => {
        setUploading(true);
        console.log("Starting upload. Target Folder ID:", targetFolderId); // DEBUG LOG

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            // Explicitly append folderId if it exists
            if (targetFolderId) {
                console.log("Appending folderId to FormData:", targetFolderId);
                formData.append('folderId', targetFolderId);
            } else {
                console.log("No targetFolderId, uploading to ROOT");
            }

            try {
                const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Upload failed');
                const result = await res.json();
                console.log("Upload result:", result);
            }
            catch (e: any) {
                console.error(e);
                safeAlert('업로드 실패', e.message || file.name);
            }
        }
        setUploading(false);
        onUploadComplete?.();
    }, [targetFolderId, onUploadComplete, onShowAlert]); // Dependency ensures closure has latest targetFolderId

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    // Handle New Folder
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        const res = await createFolder(newFolderName, targetFolderId);
        if (res.success) {
            safeAlert('완료', '폴더가 생성되었습니다.');
            setNewFolderName('');
            setIsCreatingFolder(false);
            if (res.folder) {
                console.log("Created element, setting ID:", res.folder.id);
                setTargetFolderId(res.folder.id); // Auto-select new folder
                // Note: onDrop will pick this up on next render via dependency array
            }
            loadFolders(); // Refresh tree
        } else {
            safeAlert('오류', '폴더 생성 실패: ' + res.error);
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Folder Selection Bar */}
            {allowFolderSelection && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <span className="text-sm font-medium text-gray-700 min-w-fit">저장 위치:</span>

                    {!isCreatingFolder ? (
                        <>
                            <select
                                value={targetFolderId || ''}
                                onChange={(e) => {
                                    const val = e.target.value || null;
                                    console.log("Folder selection changed to:", val);
                                    setTargetFolderId(val);
                                }}
                                className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5"
                            >
                                <option value="">🏠 Root (최상위)</option>
                                {folderTree.map((f: any) => (
                                    <option key={f.id} value={f.id}>
                                        {'\u00A0\u00A0'.repeat(f.depth)}📁 {f.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                className="px-2 py-1.5 text-sm bg-white border rounded hover:bg-gray-50 text-gray-600"
                                title="새 폴더 만들기"
                            >
                                ➕
                            </button>
                        </>
                    ) : (
                        <div className="flex-1 flex gap-2 animate-fadeIn">
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="새 폴더 이름"
                                className="flex-1 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 px-2"
                                autoFocus
                            />
                            <button onClick={handleCreateFolder} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">확인</button>
                            <button onClick={() => setIsCreatingFolder(false)} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300">취소</button>
                        </div>
                    )}
                </div>
            )}

            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all min-h-[300px]
                    ${isDragActive ? 'border-blue-500 bg-blue-50 scale-[0.99]' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 bg-white'}
                `}
            >
                <input {...getInputProps()} />
                <div className="text-6xl mb-4 transition-transform group-hover:scale-110">☁️</div>
                {uploading ? (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-gray-600 font-medium text-lg">파일을 업로드하고 있습니다...</p>
                        <p className="text-gray-400 text-sm mt-1">잠시만 기다려주세요.</p>
                    </div>
                ) : (
                    <div className="text-center space-y-2">
                        <p className="text-xl font-bold text-gray-700">파일을 드래그하여 놓거나 클릭하세요</p>
                        <p className="text-sm text-gray-500">이미지, 동영상, 문서 파일 지원</p>
                        {targetFolderId ? (
                            <p className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">
                                📂 <b>{folderTree.find(f => f.id === targetFolderId)?.name || '선택된 폴더'}</b>에 저장됩니다
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">🏠 최상위(Root)에 저장됩니다</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

