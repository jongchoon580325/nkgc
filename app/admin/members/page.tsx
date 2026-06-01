'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Member {
    id: number
    name: string
    churchName: string
    position: string
    category?: string
    phone: string
    role: string
    isApproved: boolean
    createdAt: string
    username?: string
}

export default function MembersManagementPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [members, setMembers] = useState<Member[]>([])
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // 권한 확인: admin 또는 master 아이디인 경우만 ID 수정 가능
    const isSuperAdmin = session?.user && ['admin', 'master'].includes((session.user as any).username || '');

    // Filters
    const [memberTypeFilter, setMemberTypeFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
    const [isOverwriteModalOpen, setIsOverwriteModalOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [deleteMember, setDeleteMember] = useState<Member | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeletingAll, setIsDeletingAll] = useState(false)
    const [csvFile, setCsvFile] = useState<File | null>(null)

    // Import progress state
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState(0)
    const [importStatus, setImportStatus] = useState('')

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        churchName: '',
        position: '목사',
        category: '',
        phone: '',
        role: 'member',
        username: '',
        password: ''
    })

    useEffect(() => {
        fetchMembers()
    }, [])

    useEffect(() => {
        filterMembers()
    }, [members, memberTypeFilter, searchQuery])

    const fetchMembers = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/admin/members', { cache: 'no-store' })
            const result = await response.json()

            if (result.success) {
                setMembers(result.data)
            } else {
                showMessage('error', result.error || '데이터를 불러올 수 없습니다.')
            }
        } catch (err) {
            showMessage('error', '데이터를 불러오는 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const filterMembers = () => {
        let filtered = [...members]

        // Member type filter (정회원: 목사/장로, 일반회원: 전도사/일반교인)
        if (memberTypeFilter === 'member') {
            filtered = filtered.filter(m =>
                m.position === 'pastor' || m.position === 'elder' ||
                m.position === '목사' || m.position === '장로'
            )
        } else if (memberTypeFilter === 'guest') {
            filtered = filtered.filter(m =>
                m.position === 'evangelist' || m.position === 'member' ||
                m.position === '전도사' || m.position === '교인' || m.position === '일반교인'
            )
        }

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.churchName.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredMembers(filtered)
    }

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 5000)
    }

    const handleEdit = (member: Member) => {
        setSelectedMember(member)
        // 기존 role 값을 position 기반으로 변환 (구 체계 호환)
        let memberRole = member.role;
        if (['pastor', 'elder'].includes(member.role)) {
            memberRole = 'member'; // 정회원
        } else if (['evangelist'].includes(member.role)) {
            memberRole = 'guest'; // 일반회원
        }
        setFormData({
            name: member.name,
            churchName: member.churchName,
            position: member.position,
            category: member.category || '',
            phone: member.phone,
            role: memberRole,
            username: member.username || '',
            password: ''
        })
        setIsEditModalOpen(true)
    }

    // 직분 변경 시 권한 자동 설정
    const handlePositionChange = (newPosition: string) => {
        const isMemberPosition = ['목사', '장로', 'pastor', 'elder'].includes(newPosition);
        const newRole = isMemberPosition ? 'member' : 'guest';
        setFormData({ ...formData, position: newPosition, role: newRole });
    }

    const handleAdd = () => {
        setFormData({
            name: '',
            churchName: '',
            position: '목사',
            category: '',
            phone: '',
            role: 'member',  // 목사 기본 -> 정회원
            username: '',
            password: ''
        })
        setIsAddModalOpen(true)
    }

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMember) return

        try {
            const response = await fetch(`/api/admin/members/${selectedMember.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                showMessage('success', '회원 정보가 수정되었습니다.')
                setIsEditModalOpen(false)
                fetchMembers()
                router.refresh()
            } else {
                showMessage('error', result.error || '수정에 실패했습니다.')
            }
        } catch (err) {
            showMessage('error', '수정 중 오류가 발생했습니다.')
        }
    }

    const handleSubmitAdd = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await fetch('/api/admin/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                showMessage('success', '회원이 추가되었습니다.')
                setIsAddModalOpen(false)
                fetchMembers()
            } else {
                showMessage('error', result.error || '추가에 실패했습니다.')
            }
        } catch (err) {
            showMessage('error', '추가 중 오류가 발생했습니다.')
        }
    }

    const openDeleteModal = (member: Member) => {
        setDeleteMember(member)
        setIsDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setDeleteMember(null)
        setIsDeleteModalOpen(false)
    }

    const handleDelete = async () => {
        if (!deleteMember) return
        setIsDeleting(true)

        try {
            const response = await fetch(`/api/admin/members/${deleteMember.id}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (result.success) {
                showMessage('success', '회원이 삭제되었습니다.')
                fetchMembers()
                closeDeleteModal()
            } else {
                showMessage('error', result.error || '삭제에 실패했습니다.')
            }
        } catch (err) {
            showMessage('error', '삭제 중 오류가 발생했습니다.')
        } finally {
            setIsDeleting(false)
        }
    }

    const getRoleBadgeColor = (role: string, position?: string) => {
        // 권한 기반 색상
        switch (role) {
            case 'super_admin':
                return 'bg-red-100 text-red-800'
            case 'admin':
                return 'bg-orange-100 text-orange-800'
            case 'member':
                return 'bg-blue-100 text-blue-800'
            case 'guest':
                return 'bg-green-100 text-green-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            default:
                // 구 권한 체계 호환 (position 기반)
                if (position === 'pastor' || position === 'elder') {
                    return 'bg-blue-100 text-blue-800'
                }
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getRoleLabel = (role: string, position?: string) => {
        // 목사/장로는 무조건 정회원으로 표시 (직분 기준 우선)
        if (position && (position.includes('목사') || position === '장로')) {
            return '정회원'
        }

        switch (role) {
            case 'super_admin':
                return '최고관리자'
            case 'admin':
                return '일반관리자'
            case 'member':
                return '정회원'
            case 'guest':
                return '일반회원'
            case 'pending':
                return '승인대기'
            default:
                // 구 권한 체계 호환
                if (role === 'pastor') return '정회원'
                if (role === 'elder') return '정회원'
                return role
        }
    }

    const getPositionLabel = (position: string) => {
        switch (position) {
            case 'pastor': return '목사'
            case 'elder': return '장로'
            case 'evangelist': return '전도사'
            case 'member': return '일반교인'
            default: return position
        }
    }

    // CSV Export
    const handleExportCSV = () => {
        const getRoleLabel = (role: string) => {
            if (['member', 'pastor', 'elder'].includes(role)) return '정회원'
            if (['guest', 'evangelist'].includes(role)) return '일반회원'
            return role
        }

        const csvContent = [
            ['이름', '교회명', '직분', '구분', '연락처', '회원권한', '아이디', '비밀번호'], // Header
            ...filteredMembers.map((member) => [
                member.name,
                member.churchName,
                member.position,
                member.category || '',
                member.phone,
                getRoleLabel(member.role),
                `${member.name}_4214`,  // 아이디: 이름_4214 패턴
                '123456'                 // 비밀번호: 통일
            ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `정회원목록_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    // CSV Sample Download
    const handleDownloadSample = () => {
        const sampleContent = [
            ['이름', '교회명', '직분', '구분', '연락처', '회원권한', '아이디', '비밀번호'],
            ['홍길동', '중앙교회', '목사', '시무', '010-1234-5678', '정회원', '', ''],
            ['김철수', '동산교회', '장로', '장로', '010-9876-5432', '정회원', '', ''],
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob(['\uFEFF' + sampleContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'members_sample.csv'
        link.click()
    }

    // CSV Import
    const handleImportCSV = async () => {
        if (!csvFile) {
            showMessage('error', 'CSV 파일을 선택해주세요.')
            return
        }

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string
                const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()))

                // Skip header row - new structure: 이름,교회명,직분,구분,연락처,회원권한,아이디,비밀번호
                const dataRows = rows.slice(1).filter(row => row.length >= 3 && row[0])

                if (dataRows.length === 0) {
                    showMessage('error', 'CSV 파일에 데이터가 없습니다.')
                    return
                }

                // Map role label to role value
                const getRoleValue = (label: string, position: string) => {
                    if (label === '정회원') return 'member'
                    if (label === '일반회원') return 'guest'
                    // Fallback based on position
                    if (position.includes('목사') || position.includes('장로')) return 'member'
                    return 'guest'
                }

                const response = await fetch('/api/admin/members/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        members: dataRows.map(row => ({
                            name: row[0],                    // 이름
                            churchName: row[1],              // 교회명
                            position: row[2],                // 직분
                            category: row[3] || null,        // 구분
                            phone: row[4] || '010-0000-0000', // 연락처
                            role: getRoleValue(row[5], row[2]), // 회원권한
                            username: row[6] || `${row[0]}_4214`, // 아이디 (빈 값이면 이름_4214)
                            password: row[7] || null           // 비밀번호 없으면 서버에서 랜덤 생성
                        }))
                    })
                })

                const result = await response.json()

                if (result.success) {
                    showMessage('success', `${result.count}명의 회원을 가져왔습니다.`)
                    setIsImportModalOpen(false)
                    setCsvFile(null)
                    fetchMembers()
                } else {
                    showMessage('error', result.error || '가져오기에 실패했습니다.')
                }
            } catch (err) {
                showMessage('error', 'CSV 파일 처리 중 오류가 발생했습니다.')
            }
        }
        reader.readAsText(csvFile)
    }

    // Open overwrite confirmation modal when importing
    const openOverwriteModal = () => {
        if (!csvFile) {
            showMessage('error', 'CSV 파일을 선택해주세요.')
            return
        }
        setIsOverwriteModalOpen(true)
    }

    // Overwrite import: delete all then import
    const handleOverwriteImport = async () => {
        setIsOverwriteModalOpen(false)
        setIsImporting(true)
        setImportProgress(0)
        setImportStatus('기존 데이터 삭제 중...')

        try {
            // Step 1: Delete all members
            setImportProgress(10)
            const deleteResponse = await fetch('/api/admin/members/delete-all', {
                method: 'DELETE'
            })
            const deleteResult = await deleteResponse.json()

            if (!deleteResult.success) {
                showMessage('error', '기존 데이터 삭제에 실패했습니다.')
                setIsImporting(false)
                return
            }

            setImportProgress(30)
            setImportStatus('CSV 파일 처리 중...')

            // Step 2: Import new data with progress
            await handleImportCSVWithProgress()

        } catch (err) {
            showMessage('error', '덮어쓰기 중 오류가 발생했습니다.')
            setIsImporting(false)
        }
    }

    // Import CSV with progress tracking
    const handleImportCSVWithProgress = async () => {
        if (!csvFile) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string
                const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()))
                const dataRows = rows.slice(1).filter(row => row.length >= 3 && row[0])

                if (dataRows.length === 0) {
                    showMessage('error', 'CSV 파일에 데이터가 없습니다.')
                    setIsImporting(false)
                    return
                }

                setImportStatus(`${dataRows.length}명 회원 등록 중...`)
                setImportProgress(50)

                // Map role label to role value
                const getRoleValue = (label: string, position: string) => {
                    if (label === '정회원') return 'member'
                    if (label === '일반회원') return 'guest'
                    if (position.includes('목사') || position.includes('장로')) return 'member'
                    return 'guest'
                }

                const response = await fetch('/api/admin/members/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        members: dataRows.map(row => ({
                            name: row[0],
                            churchName: row[1],
                            position: row[2],
                            category: row[3] || null,
                            phone: row[4] || '010-0000-0000',
                            role: getRoleValue(row[5], row[2]),
                            username: row[6] || `${row[0]}_4214`,
                            password: row[7] || null           // 비밀번호 없으면 서버에서 랜덤 생성
                        }))
                    })
                })

                setImportProgress(90)
                setImportStatus('완료 처리 중...')

                const result = await response.json()

                if (result.success) {
                    setImportProgress(100)
                    setImportStatus('완료!')
                    setTimeout(() => {
                        showMessage('success', `${result.count}명의 회원을 가져왔습니다.`)
                        setIsImportModalOpen(false)
                        setCsvFile(null)
                        setIsImporting(false)
                        setImportProgress(0)
                        fetchMembers()
                    }, 500)
                } else {
                    showMessage('error', result.error || '가져오기에 실패했습니다.')
                    setIsImporting(false)
                }
            } catch (err) {
                showMessage('error', 'CSV 파일 처리 중 오류가 발생했습니다.')
                setIsImporting(false)
            }
        }
        reader.readAsText(csvFile)
    }

    // Delete all members
    const handleDeleteAll = async () => {
        setIsDeletingAll(true)

        try {
            const response = await fetch('/api/admin/members/delete-all', {
                method: 'DELETE'
            })
            const result = await response.json()

            if (result.success) {
                showMessage('success', `${result.count}명의 회원이 삭제되었습니다. (admin/master 계정 제외)`)
                setIsDeleteAllModalOpen(false)
                fetchMembers()
            } else {
                showMessage('error', result.error || '삭제에 실패했습니다.')
            }
        } catch (err) {
            showMessage('error', '삭제 중 오류가 발생했습니다.')
        } finally {
            setIsDeletingAll(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">정회원 관리</h1>
                    <p className="mt-1 text-sm text-gray-600">목사회원과 장로총대를 관리합니다</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadSample}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        샘플 다운로드
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV 내보내기
                    </button>
                    <button
                        onClick={() => setIsDeleteAllModalOpen(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        전체 삭제
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        CSV 가져오기
                    </button>
                    <Link
                        href="/admin/members/add"
                        className="px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        회원 추가
                    </Link>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Member Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">회원 구분</label>
                        <select
                            value={memberTypeFilter}
                            onChange={(e) => {
                                setMemberTypeFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        >
                            <option value="all">전체</option>
                            <option value="member">정회원 (목사/장로)</option>
                            <option value="guest">일반회원 (전도사/일반교인)</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            placeholder="이름 또는 교회명으로 검색"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                        회원 목록 ({filteredMembers.length}명)
                    </h2>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">페이지당</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                            <option value={10}>10개</option>
                            <option value={20}>20개</option>
                            <option value={50}>50개</option>
                            <option value={100}>100개</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">조회된 회원이 없습니다.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                            번호
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            직분
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            구분
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            이름
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            교회명
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            권한
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            작업
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredMembers
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((member, index) => (
                                            <tr key={member.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {getPositionLabel(member.position)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-700">
                                                        {member.category || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{member.churchName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                                                            member.role, member.position
                                                        )}`}
                                                    >
                                                        {getRoleLabel(member.role, member.position)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link
                                                        href={`/admin/members/edit/${member.id}`}
                                                        className="text-primary-blue hover:text-blue-700 mr-4"
                                                    >
                                                        수정
                                                    </Link>
                                                    <button
                                                        onClick={() => openDeleteModal(member)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {filteredMembers.length > itemsPerPage && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredMembers.length)} / 총 {filteredMembers.length}명
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ««
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ‹ 이전
                                    </button>

                                    {/* Page Numbers */}
                                    {(() => {
                                        const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
                                        const pages = []
                                        let start = Math.max(1, currentPage - 2)
                                        let end = Math.min(totalPages, start + 4)
                                        if (end - start < 4) start = Math.max(1, end - 4)

                                        for (let i = start; i <= end; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`px-3 py-1 text-sm rounded ${currentPage === i
                                                        ? 'bg-primary-blue text-white font-semibold'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {i}
                                                </button>
                                            )
                                        }
                                        return pages
                                    })()}

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredMembers.length / itemsPerPage), p + 1))}
                                        disabled={currentPage >= Math.ceil(filteredMembers.length / itemsPerPage)}
                                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        다음 ›
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.ceil(filteredMembers.length / itemsPerPage))}
                                        disabled={currentPage >= Math.ceil(filteredMembers.length / itemsPerPage)}
                                        className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        »»
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">회원 정보 수정</h2>
                        <form onSubmit={handleSubmitEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">교회명</label>
                                <input
                                    type="text"
                                    value={formData.churchName}
                                    onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">직분</label>
                                <select
                                    value={formData.position}
                                    onChange={(e) => handlePositionChange(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                >
                                    <option value="목사">목사</option>
                                    <option value="장로">장로</option>
                                    <option value="전도사">전도사</option>
                                    <option value="교인">교인</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    목사/장로 → 정회원, 전도사/교인 → 일반회원 자동 설정
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                >
                                    <option value="">선택하세요</option>
                                    <option value="원로">원로</option>
                                    <option value="위임">위임</option>
                                    <option value="시무">시무</option>
                                    <option value="부목사">부목사</option>
                                    <option value="전도사">전도사</option>
                                    <option value="장로">장로</option>
                                    <option value="은퇴">은퇴</option>
                                    <option value="무임">무임</option>
                                    <option value="선교사">선교사</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">회원권한</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                >
                                    <option value="member">정회원 (글쓰기, 보기)</option>
                                    <option value="guest">일반회원 (보기만)</option>
                                </select>
                            </div>

                            <div className="border-t border-gray-200 my-4 pt-4">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">계정 정보 {isSuperAdmin ? '(최고관리자 수정 가능)' : '(선택사항)'}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            disabled={!isSuperAdmin}
                                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue ${!isSuperAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                                                }`}
                                        />
                                        {!isSuperAdmin ? (
                                            <p className="mt-1 text-xs text-gray-500">아이디는 최고관리자만 변경할 수 있습니다.</p>
                                        ) : (
                                            <p className="mt-1 text-xs text-blue-600 font-medium">최고관리자 권한으로 아이디 수정이 가능합니다.</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 재설정</label>
                                        <input
                                            type="password"
                                            value={formData.password || ''}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="변경하려면 입력하세요"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">비워두면 기존 비밀번호가 유지됩니다.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 font-semibold"
                                >
                                    수정
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">회원 추가</h2>
                        <form onSubmit={handleSubmitAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">교회명</label>
                                <input
                                    type="text"
                                    value={formData.churchName}
                                    onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">직분</label>
                                <select
                                    value={formData.position}
                                    onChange={(e) => handlePositionChange(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                >
                                    <option value="목사">목사</option>
                                    <option value="장로">장로</option>
                                    <option value="전도사">전도사</option>
                                    <option value="교인">교인</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    목사/장로 → 정회원, 전도사/교인 → 일반회원 자동 설정
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                >
                                    <option value="">선택하세요</option>
                                    <option value="원로">원로</option>
                                    <option value="위임">위임</option>
                                    <option value="시무">시무</option>
                                    <option value="부목사">부목사</option>
                                    <option value="전도사">전도사</option>
                                    <option value="장로">장로</option>
                                    <option value="은퇴">은퇴</option>
                                    <option value="무임">무임</option>
                                    <option value="선교사">선교사</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                    placeholder="010-0000-0000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">회원권한</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                    required
                                >
                                    <option value="member">정회원 (글쓰기, 보기)</option>
                                    <option value="guest">일반회원 (보기만)</option>
                                </select>
                            </div>

                            <div className="border-t border-gray-200 my-4 pt-4">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">계정 정보</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">아이디 <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                            required
                                            placeholder="로그인에 사용할 아이디"
                                        />
                                        <p className="text-xs text-blue-500 mt-1">
                                            아이디는 로그인 시 사용됩니다.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 <span className="text-red-500">*</span></label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                            required
                                            placeholder="비밀번호 설정"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            보안을 위해 8자 이상 권장합니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 font-semibold"
                                >
                                    추가
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import CSV Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">CSV 가져오기</h2>
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800 mb-2">
                                    <strong>CSV 파일 형식:</strong>
                                </p>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• 헤더: 번호, 이름, 교회명, 직분명</li>
                                    <li>• 직분명: '목사' 또는 '장로'</li>
                                    <li>• 인코딩: UTF-8 (BOM)</li>
                                </ul>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">파일 선택</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                />
                            </div>
                            {csvFile && (
                                <div className="text-sm text-gray-600">
                                    선택된 파일: <strong>{csvFile.name}</strong>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {isImporting && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{importStatus}</span>
                                        <span className="font-medium text-primary-blue">{importProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-primary-blue h-full rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${importProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={openOverwriteModal}
                                    disabled={isImporting}
                                    className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                                >
                                    {isImporting ? '가져오는 중...' : '덮어쓰기로 가져오기'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsImportModalOpen(false)
                                        setCsvFile(null)
                                    }}
                                    disabled={isImporting}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && deleteMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeDeleteModal}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🗑</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">회원 삭제</h2>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <p className="text-gray-700">
                                <strong>{deleteMember.name}</strong> 회원을 삭제하시겠습니까?
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <div><span className="text-gray-500">소속교회:</span> {deleteMember.churchName}</div>
                                    <div><span className="text-gray-500">직분:</span> {deleteMember.position}</div>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                                <p>⚠️ 삭제 후에는 복구할 수 없습니다.</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={closeDeleteModal}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        삭제 중...
                                    </span>
                                ) : '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete All Confirmation Modal */}
            {isDeleteAllModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsDeleteAllModalOpen(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">전체 삭제</h3>
                                <p className="text-sm text-gray-500">모든 회원 데이터를 삭제합니다</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                정말로 <span className="font-bold text-red-600">모든 회원 데이터</span>를 삭제하시겠습니까?
                            </p>
                            <p className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
                                ⚠️ <strong>admin</strong>, <strong>master</strong> 계정은 삭제되지 않습니다.
                            </p>
                        </div>
                        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setIsDeleteAllModalOpen(false)}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                disabled={isDeletingAll}
                                className="flex-1 px-4 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                            >
                                {isDeletingAll ? '삭제 중...' : '전체 삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overwrite Confirmation Modal */}
            {isOverwriteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOverwriteModalOpen(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">데이터 덮어쓰기</h3>
                                <p className="text-sm text-gray-500">기존 데이터를 삭제하고 새 데이터로 교체합니다</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                기존 회원 데이터를 <span className="font-bold text-orange-600">모두 삭제</span>하고
                                <span className="font-bold text-blue-600"> CSV 파일의 데이터</span>로 교체하시겠습니까?
                            </p>
                            <p className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
                                ⚠️ <strong>admin</strong>, <strong>master</strong> 계정은 삭제되지 않습니다.
                            </p>
                        </div>
                        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setIsOverwriteModalOpen(false)}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleOverwriteImport}
                                className="flex-1 px-4 py-2.5 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-medium"
                            >
                                덮어쓰기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
