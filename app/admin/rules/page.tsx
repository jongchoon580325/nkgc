'use client'

import { useState, useEffect } from 'react'
import { marked } from 'marked'
import Image from 'next/image'
import TiptapEditor from '@/components/board/TiptapEditor'
import MediaPickerModal from '@/components/media/MediaPickerModal'
import NotificationModal from '@/components/common/NotificationModal'
import { getFileIcon, isImage } from '@/lib/utils/media'

export default function RulesAdminPage() {
    const [activeTab, setActiveTab] = useState<'PRESBYTERY' | 'COURTESY'>('PRESBYTERY')
    const [content, setContent] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info', text: string } | null>(null)

    // Attachments State
    const [attachedAssets, setAttachedAssets] = useState<any[]>([])
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)

    // Modal State
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    })

    useEffect(() => {
        fetchRule(activeTab)
    }, [activeTab])

    const fetchRule = async (type: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/rules?type=${type}`, {
                cache: 'no-store',
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            })
            const result = await response.json()
            if (result.success && result.data) {
                setContent(result.data.content)
            } else {
                setContent('')
            }
            // Reset attachments on load since we don't store them separately
            setAttachedAssets([])
        } catch (error) {
            console.error('Failed to fetch rule:', error)
            showMessage('error', '데이터를 불러오는데 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const fileExtension = file.name.split('.').pop()?.toLowerCase()

        if (!['md', 'html', 'htm'].includes(fileExtension || '')) {
            showMessage('error', 'MD 또는 HTML 파일만 업로드 가능합니다.')
            return
        }

        try {
            const text = await file.text()

            if (fileExtension === 'md') {
                // Markdown to HTML conversion
                const htmlContent = marked(text)
                setContent(htmlContent as string)
                showMessage('success', 'Markdown 파일이 변환되어 에디터에 삽입되었습니다.')
            } else {
                // HTML file
                setContent(text)
                showMessage('success', 'HTML 파일이 에디터에 삽입되었습니다.')
            }
        } catch (error) {
            console.error('Failed to read file:', error)
            showMessage('error', '파일을 읽는 중 오류가 발생했습니다.')
        }

        // Reset input
        e.target.value = ''
    }

    const handleMediaSelect = (selectedAssets: any[]) => {
        // Filter out duplicates based on ID
        const newAssets = selectedAssets.filter(
            newItem => !attachedAssets.some(existing => existing.id === newItem.id)
        )
        setAttachedAssets(prev => [...prev, ...newAssets])

        // Auto-insert images into editor content
        let contentToAdd = ''
        newAssets.forEach(asset => {
            if (isImage(asset.mimeType)) {
                contentToAdd += `<img src="${asset.path}" alt="${asset.altText || asset.filename}" />`
            }
        })

        if (contentToAdd) {
            // Append to existing content (add a newline if needed)
            setContent(prev => prev + (prev ? '<p></p>' : '') + contentToAdd)
        }
    }

    const removeAttachment = (id: string) => {
        setAttachedAssets(prev => prev.filter(a => a.id !== id))
    }

    const handleSave = async () => {
        // Validation check
        if (!content || content.trim() === '' || content === '<p><br></p>') {
            showMessage('error', '내용을 입력해주세요.')
            return
        }

        setIsSaving(true)
        try {
            const response = await fetch('/api/admin/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: activeTab,
                    content
                })
            })

            const result = await response.json()

            if (result.success) {
                // Show Success Modal
                setModal({
                    isOpen: true,
                    title: '저장 완료',
                    message: '규칙 내용이 성공적으로 저장되었습니다.',
                    type: 'success',
                    onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                })
            } else {
                console.error('Save failed:', result)
                showMessage('error', result.error || '저장에 실패했습니다.')
            }
        } catch (error) {
            console.error('Failed to save rule:', error)
            showMessage('error', '저장 중 오류가 발생했습니다.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        if (confirm('작성 중인 내용을 취소하고 원본 텍스트로 되돌아가겠습니까?')) {
            fetchRule(activeTab)
        }
    }

    const showMessage = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
        setMessage({ type: type as any, text }) // Use any cast temporarily if needed, or update message state type properly
        setTimeout(() => setMessage(null), 3000)
    }

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">규칙 관리</h1>
                    <p className="mt-1 text-sm text-gray-600">노회 규칙 및 예우 규칙을 관리합니다.</p>
                </div>
                <div className="flex gap-3">
                    {/* File Upload Button */}
                    <label className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-md cursor-pointer flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        파일 불러오기
                        <input
                            type="file"
                            accept=".md,.html,.htm"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex-shrink-0 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="border-b border-gray-200 flex-shrink-0">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('PRESBYTERY')}
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'PRESBYTERY'
                                ? 'border-primary-blue text-primary-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            노회 규칙
                        </button>
                        <button
                            onClick={() => setActiveTab('COURTESY')}
                            className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${activeTab === 'COURTESY'
                                ? 'border-primary-blue text-primary-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            예우 규칙
                        </button>
                    </nav>
                </div>

                <div className="p-6 space-y-4 flex flex-col flex-1 min-h-0 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
                        </div>
                    ) : (
                        <>
                            <TiptapEditor
                                value={content}
                                onChange={setContent}
                                placeholder="규칙 내용을 입력하세요..."
                            />

                            {/* 첨부파일 섹션 */}
                            <div className="space-y-4 pt-6 border-t border-gray-100 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700">첨부파일</label>
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

                            {/* 하단 버튼 */}
                            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-primary-blue text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50 min-w-[100px]"
                                >
                                    {isSaving ? '저장 중...' : '작성하기'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                selectionMode="multiple"
            />

            {/* Success/Notification Modal */}
            <NotificationModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
            />
        </div>
    )
}
