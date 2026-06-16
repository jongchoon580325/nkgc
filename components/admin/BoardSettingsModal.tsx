'use client';

import { useState, useEffect } from 'react';
import { BoardType } from '@/lib/board-config';
import Image from 'next/image';
import MediaPickerModal from '@/components/media/MediaPickerModal';

interface BoardSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardType: BoardType;
}

interface BoardSettingsData {
    gridColumns?: number;
    viewMode?: 'new_tab' | 'flip_book';
    coverImage?: string;
    titleColor?: string;
    titleSize?: string;
}

export default function BoardSettingsModal({ isOpen, onClose, boardType }: BoardSettingsModalProps) {
    const [loading, setLoading] = useState(false);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [settings, setSettings] = useState<BoardSettingsData>({
        gridColumns: 4,
        viewMode: 'flip_book',
        coverImage: '',
        titleColor: '#000000',
        titleSize: '1.25rem',
    });

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen, boardType]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/board-settings/${boardType}`);
            const data = await res.json();
            if (data.settings) {
                setSettings({
                    gridColumns: data.settings.gridColumns || 4,
                    viewMode: data.settings.viewMode || 'flip_book',
                    coverImage: data.settings.coverImage || '',
                    titleColor: data.settings.titleColor || '#000000',
                    titleSize: data.settings.titleSize || '1.25rem',
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/board-settings/${boardType}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: settings,
                    categories: [], // Keep categories as is or empty if not managed here
                }),
            });

            if (!res.ok) throw new Error('Failed to save settings');

            alert('설정이 저장되었습니다.');
            onClose();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('설정 저장 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleMediaSelect = (assets: any[]) => {
        if (assets.length === 0) return;
        setSettings(prev => ({ ...prev, coverImage: assets[0].path }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg">게시판 설정 ({boardType})</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Cover Image Setting */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">기본 표지 이미지</label>
                        <div className="space-y-3">
                            {settings.coverImage ? (
                                <div className="relative aspect-[3/4] w-32 mx-auto rounded-lg overflow-hidden border shadow-sm group">
                                    <Image
                                        src={settings.coverImage}
                                        alt="Cover Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={() => setSettings(prev => ({ ...prev, coverImage: '' }))}
                                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                        삭제
                                    </button>
                                </div>
                            ) : (
                                <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 text-center space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsMediaPickerOpen(true)}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        미디어 라이브러리에서 선택
                                    </button>
                                    <p className="text-xs text-gray-500">PDF 목록에 표시될 기본 이미지입니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">보기 모드</label>
                        <select
                            value={settings.viewMode}
                            onChange={(e) => setSettings(prev => ({ ...prev, viewMode: e.target.value as any }))}
                            className="w-full border border-gray-300 rounded-md p-2"
                        >
                            <option value="flip_book">책 넘김 효과 (Flip Book)</option>
                            <option value="new_tab">새 탭에서 열기</option>
                        </select>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">그리드 칸 수 (한 줄에 표시되는 카드 개수)</label>
                        <input
                            type="number"
                            min={1}
                            max={8}
                            value={settings.gridColumns}
                            onChange={(e) => setSettings(prev => ({ ...prev, gridColumns: parseInt(e.target.value) || 4 }))}
                            className="w-full border border-gray-300 rounded-md p-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">1~8 사이의 숫자 (기본값: 4)</p>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">텍스트 스타일 설정</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">글자 색상</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.titleColor}
                                        onChange={(e) => setSettings(prev => ({ ...prev, titleColor: e.target.value }))}
                                        className="h-10 w-20 p-1 border rounded cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-500">{settings.titleColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">글자 크기 (예: 1.5rem, 24px)</label>
                                <input
                                    type="text"
                                    value={settings.titleSize}
                                    onChange={(e) => setSettings(prev => ({ ...prev, titleSize: e.target.value }))}
                                    placeholder="1.25rem"
                                    className="w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? '저장 중...' : '설정 저장'}
                    </button>
                </div>
            </div>

            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                selectionMode="single"
                title="표지 이미지 선택"
            />
        </div>
    );
}
