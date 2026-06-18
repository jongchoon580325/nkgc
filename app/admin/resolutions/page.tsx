'use client'
// ─────────────────────────────────────────────────────────────────────────────
// 결의서 관리 페이지 (관리자 전용)
//
// 주요 기능:
//   1. 탭별 결의서 목록 조회 (제1회~제80회를 20회 단위로 분류)
//   2. 결의서 신규 업로드 (이미지/PDF 파일 첨부)
//   3. 기존 결의서 메타데이터 및 파일 수정
//   4. 결의서 삭제
//   5. 전체 데이터 JSON 내보내기 / 가져오기 (백업·복원)
//   6. 게시판 설정 모달 연동
//   7. 드래그 앤 드롭으로 목록 순서 변경 (@hello-pangea/dnd)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import BoardSettingsModal from '@/components/admin/BoardSettingsModal'
import { BOARD_TYPES } from '@/lib/board-config'

// ─────────────────────────────────────────────────────────────────────────────
// [타입 정의] Resolution
// DB에서 반환되는 결의서 레코드 구조.
//   - tabType      : 탭 구분 키 ('1-20' | '21-40' | '41-60' | '61-80' | '81-100')
//   - meetingNum   : 정기노회 회기 번호 (e.g. 45)
//   - sessionNum   : 임시노회 회기 번호 (정기노회는 null)
//   - meetingType  : '정기' | '임시'
//   - fileType     : 업로드된 파일 확장자 기반 타입 ('PDF' | 'IMAGE')
//   - fileUrl      : Blob/Storage에 저장된 공개 URL
//   - displayOrder : D&D로 결정된 표시 순서 (낮을수록 위)
// ─────────────────────────────────────────────────────────────────────────────
interface Resolution {
    id: number
    tabType: string
    meetingNum: number
    sessionNum: number | null
    meetingType: string
    title: string
    fileType: string
    fileName: string
    fileUrl: string
    displayOrder: number
}

// ─────────────────────────────────────────────────────────────────────────────
// [컴포넌트] ResolutionsAdminPage
// ─────────────────────────────────────────────────────────────────────────────
export default function ResolutionsAdminPage() {

    // ── [상태] 탭 ──────────────────────────────────────────────────────────
    // 현재 선택된 회기 범위 탭. 탭 전환 시 fetchResolutions가 재호출된다.
    const [activeTab, setActiveTab] = useState<'1-20' | '21-40' | '41-60' | '61-80' | '81-100'>('1-20')

    // ── [상태] 결의서 목록 ─────────────────────────────────────────────────
    // API에서 받아온 현재 탭의 결의서 배열.
    // D&D 드래그 완료 시 이 배열의 순서가 즉시 변경된다 (낙관적 업데이트).
    const [resolutions, setResolutions] = useState<Resolution[]>([])

    // ── [상태] 로딩 ───────────────────────────────────────────────────────
    // 목록 조회 중 스피너 표시 여부.
    const [isLoading, setIsLoading] = useState(false)

    // ── [상태] 업로드 폼 표시 ─────────────────────────────────────────────
    // true이면 신규 업로드 / 수정 폼이 렌더링된다.
    const [showUploadForm, setShowUploadForm] = useState(false)

    // ── [상태] 수정 대상 ID ───────────────────────────────────────────────
    // 수정 모드일 때 대상 결의서의 id. null이면 신규 업로드 모드.
    const [editingId, setEditingId] = useState<number | null>(null)

    // ── [상태] 업로드/수정 폼 필드값 ──────────────────────────────────────
    const [uploadForm, setUploadForm] = useState({
        meetingNum: '',
        sessionNum: '',
        meetingType: '정기' as '정기' | '임시',
        title: '',
        file: null as File | null
    })

    // ── [상태] 피드백 메시지 ──────────────────────────────────────────────
    // 성공/실패 메시지를 3초간 표시 후 자동 제거.
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // ── [상태] 가져오기(Import) 모달 ──────────────────────────────────────
    const [showImportModal, setShowImportModal] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge')
    const [isImporting, setIsImporting] = useState(false)

    // ── [상태] 게시판 설정 모달 ───────────────────────────────────────────
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // ── [상태] 순서 저장 중 ───────────────────────────────────────────────
    // PATCH 호출 중 헤더 영역에 "저장 중…" 인디케이터를 표시하기 위한 플래그.
    const [isSavingOrder, setIsSavingOrder] = useState(false)

    // ── [상태] 공통 확인 모달 ─────────────────────────────────────────────
    // 내보내기·가져오기 실행 전 사용자 확인을 받는 범용 모달.
    // onConfirm에 실제 실행 함수를 주입해 재사용한다.
    const [confirmModal, setConfirmModal] = useState<{
        title: string
        message: string
        confirmLabel: string
        confirmStyle: 'green' | 'orange' | 'red'
        onConfirm: () => void
    } | null>(null)

    // ─────────────────────────────────────────────────────────────────────
    // [Effect] 탭 전환 시 결의서 목록 재조회
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchResolutions(activeTab)
    }, [activeTab])

    // ─────────────────────────────────────────────────────────────────────
    // [Effect] 제목 자동 생성
    // meetingNum / sessionNum / meetingType 변경 시 title 자동 갱신.
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (uploadForm.meetingNum) {
            const title = generateTitle(
                parseInt(uploadForm.meetingNum),
                uploadForm.meetingType,
                uploadForm.sessionNum ? parseInt(uploadForm.sessionNum) : null
            )
            setUploadForm(prev => ({ ...prev, title }))
        }
    }, [uploadForm.meetingNum, uploadForm.sessionNum, uploadForm.meetingType])

    // ─────────────────────────────────────────────────────────────────────
    // [유틸] generateTitle
    //   정기:  "제N회 정기노회 결의서"
    //   임시(회기 있음): "제N회 제M차 임시노회 결의서"
    //   임시(회기 없음): "제N회 임시노회 결의서"
    // ─────────────────────────────────────────────────────────────────────
    const generateTitle = (meetingNum: number, meetingType: string, sessionNum: number | null): string => {
        if (meetingType === '정기') {
            return `제${meetingNum}회 정기노회 결의서`
        } else {
            if (sessionNum) {
                return `제${meetingNum}회 제${sessionNum}차 임시노회 결의서`
            }
            return `제${meetingNum}회 임시노회 결의서`
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [API] fetchResolutions
    // GET /api/resolutions?tab={tab} — displayOrder ASC 기준으로 반환됨.
    // ─────────────────────────────────────────────────────────────────────
    const fetchResolutions = async (tab: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/resolutions?tab=${tab}`)
            const result = await response.json()
            if (result.success) {
                setResolutions(result.data)
            } else {
                setResolutions([])
            }
        } catch (error) {
            console.error('Failed to fetch resolutions:', error)
            setResolutions([])
        } finally {
            setIsLoading(false)
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [D&D] handleDragEnd
    // @hello-pangea/dnd의 DragDropContext가 드롭 완료 시 호출하는 콜백.
    //
    // 처리 순서:
    //   1. 드래그 취소(destination 없음) 또는 제자리 드롭이면 아무것도 안 함
    //   2. 로컬 resolutions 배열을 즉시 재정렬 (낙관적 업데이트 — UX 즉각 반응)
    //   3. 새 순서를 PATCH /api/admin/resolutions 로 전송
    //   4. 실패 시 원래 배열로 롤백 + 에러 메시지 표시
    // ─────────────────────────────────────────────────────────────────────
    const handleDragEnd = async (result: DropResult) => {
        const { source, destination } = result

        // 유효하지 않은 드롭 무시
        if (!destination || destination.index === source.index) return

        // 1) 로컬 배열 즉시 재정렬 (낙관적 업데이트)
        const reordered = [...resolutions]
        const [moved] = reordered.splice(source.index, 1)
        reordered.splice(destination.index, 0, moved)
        setResolutions(reordered)

        // 2) 새 displayOrder 값 = 배열 인덱스 기반 (0, 1, 2, …)
        const orders = reordered.map((r, idx) => ({ id: r.id, displayOrder: idx }))

        setIsSavingOrder(true)
        try {
            const response = await fetch('/api/admin/resolutions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders })
            })
            const res = await response.json()

            if (!res.success) {
                // 실패 시 롤백
                setResolutions(resolutions)
                showMessage('error', '순서 저장에 실패했습니다.')
            } else {
                showMessage('success', '순서가 저장되었습니다.')
            }
        } catch {
            // 네트워크 오류 시 롤백
            setResolutions(resolutions)
            showMessage('error', '순서 저장 중 오류가 발생했습니다.')
        } finally {
            setIsSavingOrder(false)
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [핸들러] handleFileChange
    // ─────────────────────────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadForm({ ...uploadForm, file: e.target.files[0] })
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [API] handleUpload — 신규 결의서 업로드 (POST)
    // ─────────────────────────────────────────────────────────────────────
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!uploadForm.file || !uploadForm.meetingNum) {
            showMessage('error', '모든 항목을 입력해주세요.')
            return
        }

        if (uploadForm.meetingType === '임시' && !uploadForm.sessionNum) {
            showMessage('error', '임시회의인 경우 회기를 입력해주세요.')
            return
        }

        const formData = new FormData()
        formData.append('file', uploadForm.file)
        formData.append('tabType', activeTab)
        formData.append('meetingNum', uploadForm.meetingNum)
        formData.append('meetingType', uploadForm.meetingType)
        if (uploadForm.sessionNum) {
            formData.append('sessionNum', uploadForm.sessionNum)
        }
        formData.append('title', uploadForm.title)

        try {
            const response = await fetch('/api/admin/resolutions', {
                method: 'POST',
                body: formData
            })
            const result = await response.json()

            if (result.success) {
                showMessage('success', '업로드되었습니다.')
                setUploadForm({ meetingNum: '', sessionNum: '', meetingType: '정기', title: '', file: null })
                setShowUploadForm(false)
                fetchResolutions(activeTab)
            } else {
                showMessage('error', result.error || '업로드에 실패했습니다.')
            }
        } catch (error) {
            console.error('Upload failed:', error)
            showMessage('error', '업로드 중 오류가 발생했습니다.')
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [핸들러] handleEdit — 수정 모드 진입
    // ─────────────────────────────────────────────────────────────────────
    const handleEdit = (resolution: Resolution) => {
        setEditingId(resolution.id)
        setUploadForm({
            meetingNum: resolution.meetingNum.toString(),
            sessionNum: resolution.sessionNum?.toString() || '',
            meetingType: resolution.meetingType as '정기' | '임시',
            title: resolution.title,
            file: null
        })
        setShowUploadForm(true)
    }

    // ─────────────────────────────────────────────────────────────────────
    // [API] handleUpdate — 결의서 수정 (PUT)
    // ─────────────────────────────────────────────────────────────────────
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!editingId || !uploadForm.meetingNum) {
            showMessage('error', '모든 항목을 입력해주세요.')
            return
        }

        if (uploadForm.meetingType === '임시' && !uploadForm.sessionNum) {
            showMessage('error', '임시회의인 경우 회기를 입력해주세요.')
            return
        }

        const formData = new FormData()
        formData.append('id', editingId.toString())
        formData.append('meetingNum', uploadForm.meetingNum)
        formData.append('meetingType', uploadForm.meetingType)
        if (uploadForm.sessionNum) {
            formData.append('sessionNum', uploadForm.sessionNum)
        }
        formData.append('title', uploadForm.title)
        if (uploadForm.file) {
            formData.append('file', uploadForm.file)
        }

        try {
            const response = await fetch('/api/admin/resolutions', {
                method: 'PUT',
                body: formData
            })
            const result = await response.json()

            if (result.success) {
                showMessage('success', '수정되었습니다.')
                setUploadForm({ meetingNum: '', sessionNum: '', meetingType: '정기', title: '', file: null })
                setShowUploadForm(false)
                setEditingId(null)
                fetchResolutions(activeTab)
            } else {
                showMessage('error', result.error || '수정에 실패했습니다.')
            }
        } catch (error) {
            console.error('Update failed:', error)
            showMessage('error', '수정 중 오류가 발생했습니다.')
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [API] handleDelete — 결의서 삭제 (DELETE)
    // ─────────────────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        try {
            const response = await fetch(`/api/admin/resolutions?id=${id}`, {
                method: 'DELETE'
            })
            const result = await response.json()

            if (result.success) {
                showMessage('success', '삭제되었습니다.')
                fetchResolutions(activeTab)
            } else {
                showMessage('error', result.error || '삭제에 실패했습니다.')
            }
        } catch (error) {
            console.error('Delete failed:', error)
            showMessage('error', '삭제 중 오류가 발생했습니다.')
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [유틸] showMessage — 3초 자동 소멸 메시지
    // ─────────────────────────────────────────────────────────────────────
    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    // ─────────────────────────────────────────────────────────────────────
    // [API] execExport — 실제 내보내기 실행 (확인 모달 → onConfirm에서 호출)
    // ─────────────────────────────────────────────────────────────────────
    const execExport = async () => {
        try {
            const response = await fetch('/api/admin/resolutions/backup?format=json')
            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `resolutions_export_${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            showMessage('success', '결의서 데이터를 내보냈습니다.')
        } catch (error) {
            console.error('Export error:', error)
            showMessage('error', '내보내기 중 오류가 발생했습니다.')
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [핸들러] handleExport — 확인 모달 표시 후 execExport 위임
    // ─────────────────────────────────────────────────────────────────────
    const handleExport = () => {
        setConfirmModal({
            title: '결의서 내보내기',
            message: '전체 결의서 데이터를 JSON 파일로 내보냅니다.\n계속하시겠습니까?',
            confirmLabel: '내보내기',
            confirmStyle: 'green',
            onConfirm: execExport,
        })
    }

    // ─────────────────────────────────────────────────────────────────────
    // [API] execImport — 실제 가져오기 실행 (확인 모달 → onConfirm에서 호출)
    //   merge    : 기존 데이터 유지, 새 항목만 추가
    //   overwrite: 기존 데이터 삭제 후 전체 교체
    // ─────────────────────────────────────────────────────────────────────
    const execImport = async () => {
        if (!importFile) return

        setIsImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', importFile)
            formData.append('mode', importMode)

            const response = await fetch('/api/admin/resolutions/backup', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (result.success) {
                showMessage('success', result.message)
                setShowImportModal(false)
                setImportFile(null)
                fetchResolutions(activeTab)
            } else {
                showMessage('error', result.error || '가져오기에 실패했습니다.')
            }
        } catch (error) {
            console.error('Import error:', error)
            showMessage('error', '가져오기 중 오류가 발생했습니다.')
        } finally {
            setIsImporting(false)
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // [핸들러] handleImport — 유효성 검사 후 확인 모달 표시 → execImport 위임
    // 덮어쓰기 모드는 경고 문구를 강조해 실수를 방지한다.
    // ─────────────────────────────────────────────────────────────────────
    const handleImport = () => {
        if (!importFile) {
            showMessage('error', '파일을 선택해주세요.')
            return
        }

        const isOverwrite = importMode === 'overwrite'
        setConfirmModal({
            title: isOverwrite ? '⚠️ 덮어쓰기 가져오기' : '결의서 가져오기',
            message: isOverwrite
                ? `기존 결의서 데이터가 모두 삭제되고\n새 데이터로 교체됩니다.\n\n정말 진행하시겠습니까?`
                : `"${importFile.name}" 파일의 데이터를\n기존 데이터에 병합합니다.\n계속하시겠습니까?`,
            confirmLabel: isOverwrite ? '덮어쓰기 실행' : '가져오기',
            confirmStyle: isOverwrite ? 'red' : 'orange',
            onConfirm: execImport,
        })
    }

    // ─────────────────────────────────────────────────────────────────────
    // [상수] tabs — 탭 UI 정의
    // ─────────────────────────────────────────────────────────────────────
    const tabs = [
        { key: '1-20' as const, label: '제1회 ~ 제20회' },
        { key: '21-40' as const, label: '제21회 ~ 제40회' },
        { key: '41-60' as const, label: '제41회 ~ 제60회' },
        { key: '61-80' as const, label: '제61회 ~ 제80회' },
        { key: '81-100' as const, label: '제81회 ~ 제100회' }
    ]

    // ─────────────────────────────────────────────────────────────────────
    // [렌더링]
    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── 헤더 ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">결의서 관리</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        노회 결의서를 관리합니다.
                        {/* 순서 저장 중 인디케이터 */}
                        {isSavingOrder && (
                            <span className="ml-2 text-blue-500 font-medium animate-pulse">
                                순서 저장 중…
                            </span>
                        )}
                    </p>
                </div>
                {!showUploadForm && (
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
                            onClick={() => setShowUploadForm(true)}
                            className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                        >
                            + 새 결의서 업로드
                        </button>
                    </div>
                )}
            </div>

            {/* ── 피드백 메시지 배너 ────────────────────────────────────── */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* ── 업로드 / 수정 폼 ─────────────────────────────────────── */}
            {showUploadForm && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingId ? '결의서 수정' : '새 결의서 업로드'}
                    </h3>
                    <form onSubmit={editingId ? handleUpdate : handleUpload} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    정기회의 회기 (필수)
                                </label>
                                <input
                                    type="number"
                                    value={uploadForm.meetingNum}
                                    onChange={(e) => setUploadForm({ ...uploadForm, meetingNum: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    회의 종류 (필수)
                                </label>
                                <select
                                    value={uploadForm.meetingType}
                                    onChange={(e) => setUploadForm({ ...uploadForm, meetingType: e.target.value as '정기' | '임시' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                >
                                    <option value="정기">정기</option>
                                    <option value="임시">임시</option>
                                </select>
                            </div>
                        </div>

                        {uploadForm.meetingType === '임시' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    임시회의 회기 (임시인 경우 필수)
                                </label>
                                <input
                                    type="number"
                                    value={uploadForm.sessionNum}
                                    onChange={(e) => setUploadForm({ ...uploadForm, sessionNum: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="1"
                                    required={uploadForm.meetingType === '임시'}
                                />
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                생성될 제목 (자동)
                            </label>
                            <div className="text-base font-semibold text-gray-900">
                                {uploadForm.title || '위 항목을 입력하면 제목이 자동 생성됩니다'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                파일 (JPG, PNG, PDF) {editingId && '- 변경하지 않으려면 비워두세요'}
                            </label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={handleFileChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                key={uploadForm.file ? 'file-selected' : 'no-file'}
                            />
                            {uploadForm.file && (
                                <p className="mt-1 text-sm text-gray-600">
                                    선택된 파일: {uploadForm.file.name}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            >
                                {editingId ? '수정' : '저장'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUploadForm(false)
                                    setEditingId(null)
                                    setUploadForm({ meetingNum: '', sessionNum: '', meetingType: '정기', title: '', file: null })
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                                취소
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── 탭 + D&D 결의서 테이블 ───────────────────────────────────
                DragDropContext: 드래그 이벤트의 최상위 컨텍스트.
                Droppable:       드롭 가능한 영역 (tbody 역할).
                Draggable:       드래그 가능한 각 행.

                테이블 구조상 <tbody>를 Droppable의 innerRef로 직접 연결해
                시맨틱 HTML을 유지하면서 D&D가 동작하도록 구성한다.
            ─────────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">

                {/* 탭 내비게이션 */}
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 ${activeTab === tab.key
                                    ? 'border-b-2 border-primary-blue text-primary-blue bg-blue-50'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* 테이블 본문 */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
                        </div>
                    ) : resolutions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            등록된 결의서가 없습니다.
                        </div>
                    ) : (
                        <>
                            {/* D&D 안내 문구 */}
                            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                                <span>☰</span> 행을 드래그해 순서를 변경할 수 있습니다.
                            </p>

                            {/* DragDropContext: onDragEnd에서 순서 재정렬 + API 저장 */}
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b">
                                            {/* 드래그 핸들 열 */}
                                            <th className="px-3 py-4 w-8"></th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">회기</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">제목</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">파일 타입</th>
                                            <th className="px-6 py-4 text-center font-bold text-gray-700">관리</th>
                                        </tr>
                                    </thead>

                                    {/* Droppable: droppableId로 목록을 식별.
                                        provided.innerRef를 tbody에 연결해야 D&D가 올바르게 동작함. */}
                                    <Droppable droppableId="resolutions-table">
                                        {(provided) => (
                                            <tbody
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                            >
                                                {resolutions.map((resolution, index) => (
                                                    // Draggable: draggableId는 전역 고유해야 함 (string 필수)
                                                    <Draggable
                                                        key={resolution.id}
                                                        draggableId={String(resolution.id)}
                                                        index={index}
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
                                                                {/* 드래그 핸들 — dragHandleProps를 이 셀에만 부여해
                                                                    행 전체가 아닌 핸들 아이콘으로만 드래그 시작 가능 */}
                                                                <td
                                                                    className="px-3 py-4 text-gray-400 cursor-grab active:cursor-grabbing"
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <svg
                                                                        className="w-4 h-4"
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        {/* 6점 그립 아이콘 (두 줄 3점씩) */}
                                                                        <circle cx="7" cy="5" r="1.5" />
                                                                        <circle cx="13" cy="5" r="1.5" />
                                                                        <circle cx="7" cy="10" r="1.5" />
                                                                        <circle cx="13" cy="10" r="1.5" />
                                                                        <circle cx="7" cy="15" r="1.5" />
                                                                        <circle cx="13" cy="15" r="1.5" />
                                                                    </svg>
                                                                </td>
                                                                <td className="px-6 py-4 font-semibold text-gray-900">
                                                                    {resolution.meetingNum}회
                                                                </td>
                                                                <td className="px-6 py-4 text-gray-800">
                                                                    {resolution.title}
                                                                </td>
                                                                <td className="px-6 py-4 text-gray-800">
                                                                    <span className={`px-3 py-1 rounded-full text-sm ${resolution.fileType === 'PDF' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                        {resolution.fileType}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <div className="flex justify-center gap-2">
                                                                        <a
                                                                            href={resolution.fileUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                                        >
                                                                            보기
                                                                        </a>
                                                                        <button
                                                                            onClick={() => handleEdit(resolution)}
                                                                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                                                        >
                                                                            수정
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(resolution.id)}
                                                                            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                                                        >
                                                                            삭제
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {/* Droppable 내부 공간 유지용 placeholder */}
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

            {/* ── 가져오기 모달 ──────────────────────────────────────────── */}
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
                            <h2 className="text-xl font-bold text-gray-900">결의서 가져오기</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    JSON 파일 선택
                                </label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                                {importFile && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        선택됨: {importFile.name}
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
                                                ⚠️ 기존 데이터 삭제 후 새 데이터로 대체
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {importMode === 'overwrite' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                                    <p>⚠️ 덮어쓰기 모드는 기존 모든 결의서 데이터가 삭제됩니다!</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={() => {
                                    setShowImportModal(false)
                                    setImportFile(null)
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

            {/* ── 게시판 설정 모달 ─────────────────────────────────────── */}
            <BoardSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                boardType={BOARD_TYPES.RESOLUTION}
            />

            {/* ── 공통 확인 모달 ────────────────────────────────────────────
                내보내기·가져오기 실행 전 최종 확인을 받는 모달.
                confirmStyle에 따라 실행 버튼 색상이 달라진다:
                  green  → 내보내기 (안전한 읽기 작업)
                  orange → 병합 가져오기 (추가 작업)
                  red    → 덮어쓰기 가져오기 (파괴적 작업, 강조)
            ────────────────────────────────────────────────────────────── */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setConfirmModal(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                        {/* 모달 헤더 */}
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                confirmModal.confirmStyle === 'red'
                                    ? 'bg-red-100'
                                    : confirmModal.confirmStyle === 'orange'
                                        ? 'bg-orange-100'
                                        : 'bg-green-100'
                            }`}>
                                <span className="text-xl">
                                    {confirmModal.confirmStyle === 'red' ? '⚠️' : confirmModal.confirmStyle === 'orange' ? '📥' : '📤'}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{confirmModal.title}</h2>
                        </div>

                        {/* 안내 메시지 */}
                        <div className="px-6 py-5">
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                {confirmModal.message}
                            </p>
                        </div>

                        {/* 버튼 */}
                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    setConfirmModal(null)
                                    confirmModal.onConfirm()
                                }}
                                className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium text-sm ${
                                    confirmModal.confirmStyle === 'red'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : confirmModal.confirmStyle === 'orange'
                                            ? 'bg-orange-500 hover:bg-orange-600'
                                            : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {confirmModal.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
