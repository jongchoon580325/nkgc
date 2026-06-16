'use client'

import { useState, useEffect, useRef } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'

interface YearOfficers {
    year: string
    church: string
    officers: {
        노회장: string
        부노회장: string
        서기: string
        부서기: string
        회록서기: string
        부회록서기: string
        회계: string
        부회계: string
    }
}

interface PastOfficersData {
    years: YearOfficers[]
}

const POSITIONS = ['노회장', '부노회장', '서기', '부서기', '회록서기', '부회록서기', '회계', '부회계'] as const
type Position = typeof POSITIONS[number]

const EMPTY_OFFICERS: YearOfficers['officers'] = {
    노회장: '', 부노회장: '', 서기: '', 부서기: '', 회록서기: '', 부회록서기: '', 회계: '', 부회계: ''
}

function toCSV(years: YearOfficers[]): string {
    const header = ['연도', '교회', ...POSITIONS].join(',')
    const rows = years.map(y =>
        [y.year, y.church, ...POSITIONS.map(p => y.officers[p])]
            .map(v => `"${(v || '').replace(/"/g, '""')}"`)
            .join(',')
    )
    return [header, ...rows].join('\n')
}

function parseCSV(text: string): YearOfficers[] {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return []
    return lines.slice(1).map(line => {
        // CSV 파싱: 따옴표 처리 포함
        const cols: string[] = []
        let current = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
                else inQuotes = !inQuotes
            } else if (line[i] === ',' && !inQuotes) {
                cols.push(current); current = ''
            } else {
                current += line[i]
            }
        }
        cols.push(current)
        return {
            year: cols[0] || '',
            church: cols[1] || '',
            officers: {
                노회장: cols[2] || '',
                부노회장: cols[3] || '',
                서기: cols[4] || '',
                부서기: cols[5] || '',
                회록서기: cols[6] || '',
                부회록서기: cols[7] || '',
                회계: cols[8] || '',
                부회계: cols[9] || '',
            }
        }
    }).filter(y => y.year)
}

export default function AdminPastOfficersPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [data, setData] = useState<PastOfficersData>({ years: [] })

    // 인라인 수정 상태
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editBuffer, setEditBuffer] = useState<YearOfficers | null>(null)
    const [isNewRow, setIsNewRow] = useState(false)

    // 삭제 확인 모달
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

    // 가져오기 모달
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importModal, setImportModal] = useState(false)
    const importInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch('/api/past-officers')
            const result = await response.json()
            const sorted = {
                ...result,
                years: [...(result.years || [])].sort(
                    (a: YearOfficers, b: YearOfficers) => parseInt(b.year) - parseInt(a.year)
                )
            }
            setData(sorted)
        } catch {
            alert('데이터 로드 실패')
        } finally {
            setLoading(false)
        }
    }

    // 연도 추가 — 최상단에 빈 행 삽입 후 즉시 수정 모드 진입
    const addYear = () => {
        if (editingIndex !== null) return
        const newYear: YearOfficers = {
            year: new Date().getFullYear().toString(),
            church: '',
            officers: { ...EMPTY_OFFICERS }
        }
        setData(prev => ({ years: [newYear, ...prev.years] }))
        setEditingIndex(0)
        setEditBuffer({ ...newYear, officers: { ...newYear.officers } })
        setIsNewRow(true)
    }

    // 수정 시작
    const startEdit = (index: number) => {
        if (editingIndex !== null) return
        setEditingIndex(index)
        setEditBuffer(JSON.parse(JSON.stringify(data.years[index])))
        setIsNewRow(false)
    }

    // 수정 버퍼 — 연도/교회 변경
    const handleBufferChange = (field: 'year' | 'church', value: string) => {
        if (!editBuffer) return
        setEditBuffer({ ...editBuffer, [field]: value })
    }

    // 수정 버퍼 — 직책별 이름 변경
    const handleBufferOfficerChange = (position: Position, value: string) => {
        if (!editBuffer) return
        setEditBuffer({ ...editBuffer, officers: { ...editBuffer.officers, [position]: value } })
    }

    // 수정 확인 — 버퍼를 data.years에 반영 (아직 API 저장 안 됨)
    const saveEdit = () => {
        if (editingIndex === null || !editBuffer) return
        const newYears = [...data.years]
        newYears[editingIndex] = editBuffer
        setData({ years: newYears })
        setEditingIndex(null)
        setEditBuffer(null)
        setIsNewRow(false)
    }

    // 수정 취소 — 신규 행이면 제거, 기존 행이면 원복
    const cancelEdit = () => {
        if (isNewRow && editingIndex === 0) {
            setData(prev => ({ years: prev.years.slice(1) }))
        }
        setEditingIndex(null)
        setEditBuffer(null)
        setIsNewRow(false)
    }

    // 삭제 확인 모달 열기
    const openDelete = (index: number) => {
        if (editingIndex !== null) return
        setDeleteIndex(index)
    }

    const confirmDelete = () => {
        if (deleteIndex === null) return
        setData(prev => ({ years: prev.years.filter((_, i) => i !== deleteIndex) }))
        setDeleteIndex(null)
    }

    // 전체 저장 (API 호출)
    const handleSubmit = async () => {
        if (editingIndex !== null) return
        setSaving(true)
        try {
            const response = await fetch('/api/past-officers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (response.ok) {
                alert('✅ 성공적으로 저장되었습니다!')
            } else {
                alert('❌ 저장 실패')
            }
        } catch {
            alert('❌ 오류 발생')
        } finally {
            setSaving(false)
        }
    }

    // 내보내기 CSV (클라이언트 사이드 다운로드)
    const handleExport = () => {
        const csv = toCSV(data.years)
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `역대임원_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // 가져오기 — 파일 선택 후 모달 표시
    const handleImportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImportFile(file)
        setImportModal(true)
    }

    // 가져오기 실행 (merge: 중복 연도 제외 추가 / overwrite: 전체 교체)
    const execImport = async (mode: 'merge' | 'overwrite') => {
        if (!importFile) return
        try {
            const text = await importFile.text()
            const parsed = parseCSV(text)
            if (parsed.length === 0) {
                alert('CSV 파싱 실패: 유효한 데이터가 없습니다.')
                return
            }
            if (mode === 'overwrite') {
                setData({ years: parsed })
            } else {
                const existingYears = new Set(data.years.map(y => y.year))
                const newOnes = parsed.filter(y => !existingYears.has(y.year))
                setData(prev => ({
                    years: [...newOnes, ...prev.years].sort(
                        (a, b) => parseInt(b.year) - parseInt(a.year)
                    )
                }))
            }
        } catch {
            alert('파일 읽기 오류')
        } finally {
            setImportModal(false)
            setImportFile(null)
            if (importInputRef.current) importInputRef.current.value = ''
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
                    <p className="text-gray-600">데이터 로딩 중...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">

                {/* 헤더 + 상단 버튼 */}
                <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">역대임원 정보 관리</h1>
                        <p className="text-gray-500 text-sm mt-1">수정 완료 후 반드시 "저장하기"를 눌러야 최종 반영됩니다.</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={addYear}
                            disabled={editingIndex !== null}
                            className="px-4 py-2 bg-accent-600 text-white rounded-lg font-semibold hover:bg-accent-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ➕ 연도 추가
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                        >
                            ⬇ 내보내기
                        </button>
                        <label className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm cursor-pointer">
                            ⬆ 가져오기
                            <input
                                ref={importInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleImportSelect}
                            />
                        </label>
                    </div>
                </div>

                {/* 테이블 */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm" style={{ minWidth: '1100px' }}>
                        <thead>
                            <tr className="bg-gradient-to-r from-brand-600 to-accent-600 text-white">
                                <th className="px-3 py-3 text-center font-bold w-16">연도</th>
                                <th className="px-3 py-3 text-center font-bold w-24">교회</th>
                                {POSITIONS.map(p => (
                                    <th key={p} className="px-2 py-3 text-center font-bold">{p}</th>
                                ))}
                                <th className="px-3 py-3 text-center font-bold w-28">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.years.length === 0 && (
                                <tr>
                                    <td colSpan={12} className="text-center py-12 text-gray-400">
                                        데이터가 없습니다. "연도 추가" 버튼으로 추가하세요.
                                    </td>
                                </tr>
                            )}
                            {data.years.map((yearData, index) => {
                                const isEditing = editingIndex === index
                                const isDisabled = editingIndex !== null && !isEditing

                                return (
                                    <tr
                                        key={index}
                                        className={`border-b transition-colors ${
                                            isEditing
                                                ? 'bg-blue-50'
                                                : index % 2 === 0
                                                ? 'bg-white hover:bg-gray-50'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                    >
                                        {/* 연도 */}
                                        <td className="px-2 py-2 text-center">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editBuffer?.year || ''}
                                                    onChange={e => handleBufferChange('year', e.target.value)}
                                                    className="w-full px-2 py-1 border border-blue-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="2024"
                                                />
                                            ) : (
                                                <span className="font-semibold text-primary-blue">{yearData.year}</span>
                                            )}
                                        </td>
                                        {/* 교회 */}
                                        <td className="px-2 py-2 text-center">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editBuffer?.church || ''}
                                                    onChange={e => handleBufferChange('church', e.target.value)}
                                                    className="w-full px-2 py-1 border border-blue-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="교회명"
                                                />
                                            ) : (
                                                <span className="text-gray-700">{yearData.church || '-'}</span>
                                            )}
                                        </td>
                                        {/* 직책별 임원 */}
                                        {POSITIONS.map(position => (
                                            <td key={position} className="px-2 py-2 text-center">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editBuffer?.officers[position] || ''}
                                                        onChange={e => handleBufferOfficerChange(position, e.target.value)}
                                                        className="w-full px-2 py-1 border border-blue-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue"
                                                        placeholder="이름"
                                                    />
                                                ) : (
                                                    <span className={`text-gray-800 ${isDisabled ? 'opacity-50' : ''}`}>
                                                        {yearData.officers[position] || '-'}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                        {/* 관리 버튼 */}
                                        <td className="px-2 py-2 text-center">
                                            {isEditing ? (
                                                <div className="flex gap-1 justify-center">
                                                    <button
                                                        onClick={saveEdit}
                                                        title="확인"
                                                        className="p-1.5 bg-primary-blue text-white rounded hover:bg-brand-700 transition-colors"
                                                    >
                                                        <Check size={15} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        title="취소"
                                                        className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1 justify-center">
                                                    <button
                                                        onClick={() => startEdit(index)}
                                                        disabled={isDisabled}
                                                        title="수정"
                                                        className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => openDelete(index)}
                                                        disabled={isDisabled}
                                                        title="삭제"
                                                        className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 수정 중 경고 */}
                {editingIndex !== null && (
                    <p className="text-orange-500 text-sm mt-3 text-center">
                        ⚠️ 수정 중인 행이 있습니다. 먼저 [확인] 또는 [취소]를 눌러주세요.
                    </p>
                )}

                {/* 전체 저장 */}
                <div className="flex gap-4 pt-6 border-t mt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={saving || editingIndex !== null}
                        className="flex-1 px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? '저장 중...' : '✅ 저장하기'}
                    </button>
                    <a
                        href="/about/past-officers"
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
                    >
                        취소
                    </a>
                </div>
            </div>

            {/* 삭제 확인 모달 */}
            {deleteIndex !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">삭제 확인</h3>
                        <p className="text-gray-600 mb-2">
                            <span className="font-semibold text-red-600">{data.years[deleteIndex]?.year}년도</span> 임원 정보를 삭제하시겠습니까?
                        </p>
                        <p className="text-xs text-gray-400 mb-6">삭제 후 "저장하기"를 눌러야 최종 반영됩니다.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                            >
                                삭제
                            </button>
                            <button
                                onClick={() => setDeleteIndex(null)}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 가져오기 모달 — 병합 또는 덮어쓰기 선택 */}
            {importModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">CSV 가져오기</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            파일: <span className="font-medium text-gray-700">{importFile?.name}</span>
                        </p>
                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => execImport('merge')}
                                className="w-full px-5 py-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-left"
                            >
                                <div className="font-bold">병합 (Merge)</div>
                                <div className="text-xs font-normal opacity-80 mt-0.5">기존에 없는 연도만 추가 (중복 제외)</div>
                            </button>
                            <button
                                onClick={() => execImport('overwrite')}
                                className="w-full px-5 py-4 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-left"
                            >
                                <div className="font-bold">덮어쓰기 (Overwrite)</div>
                                <div className="text-xs font-normal opacity-80 mt-0.5">현재 데이터를 모두 CSV 내용으로 교체</div>
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setImportModal(false)
                                setImportFile(null)
                                if (importInputRef.current) importInputRef.current.value = ''
                            }}
                            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
