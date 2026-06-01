'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Officer {
    position: string
    name: string
    role: string
    church: string
    phone: string
}

interface Event {
    month: string
    name: string
    datetime: string
    location: string
    notes: string
}

interface OrganizationData {
    id: string
    name: string
    president: string
    secretary: string
    officers: Officer[]
    events: Event[]
}

interface Props {
    organizationId: string
    publicPageUrl: string
}

export default function OrganizationAdminForm({ organizationId, publicPageUrl }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [data, setData] = useState<OrganizationData | null>(null)

    useEffect(() => {
        fetchData()
    }, [organizationId])

    const fetchData = async () => {
        try {
            const response = await fetch(`/api/organizations?id=${organizationId}`)
            const result = await response.json()
            setData(result)
            setLoading(false)
        } catch (error) {
            alert('데이터 로드 실패')
            setLoading(false)
        }
    }

    const handleChange = (field: 'president' | 'secretary', value: string) => {
        if (data) {
            setData({ ...data, [field]: value })
        }
    }

    const handleOfficerChange = (
        index: number,
        field: keyof Officer,
        value: string
    ) => {
        if (data) {
            const newOfficers = [...data.officers]
            newOfficers[index] = { ...newOfficers[index], [field]: value }
            setData({ ...data, officers: newOfficers })
        }
    }

    const addOfficer = () => {
        if (data) {
            setData({
                ...data,
                officers: [
                    ...data.officers,
                    { position: '', name: '', role: '', church: '', phone: '' },
                ],
            })
        }
    }

    const deleteOfficer = (index: number) => {
        if (data) {
            const newOfficers = data.officers.filter((_, i) => i !== index)
            setData({ ...data, officers: newOfficers })
        }
    }

    const handleEventChange = (
        index: number,
        field: keyof Event,
        value: string
    ) => {
        if (data) {
            const newEvents = [...data.events]
            newEvents[index] = { ...newEvents[index], [field]: value }
            setData({ ...data, events: newEvents })
        }
    }

    const addEvent = () => {
        if (data) {
            setData({
                ...data,
                events: [
                    ...data.events,
                    { month: '', name: '', datetime: '', location: '', notes: '' },
                ],
            })
        }
    }

    const deleteEvent = (index: number) => {
        if (data) {
            const newEvents = data.events.filter((_, i) => i !== index)
            setData({ ...data, events: newEvents })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch('/api/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                alert('✅ 성공적으로 저장되었습니다!')
                router.push(publicPageUrl)
            } else {
                alert('❌ 저장 실패')
            }
        } catch (error) {
            alert('❌ 오류 발생')
        } finally {
            setSaving(false)
        }
    }

    if (loading || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
                    <p className="text-gray-600">데이터 로딩 중...</p>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="container-custom max-w-4xl">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {data.name} 정보 관리
                        </h1>
                        <p className="text-gray-600">
                            {data.name}의 정보를 수정할 수 있습니다.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Leadership */}
                        <div className="border-2 border-gray-200 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                주요 직책
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        회장
                                    </label>
                                    <input
                                        type="text"
                                        value={data.president}
                                        onChange={(e) =>
                                            handleChange('president', e.target.value)
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                        placeholder="회장 이름"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        서기
                                    </label>
                                    <input
                                        type="text"
                                        value={data.secretary}
                                        onChange={(e) =>
                                            handleChange('secretary', e.target.value)
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                        placeholder="서기 이름"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Officers */}
                        <div className="border-2 border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">임원 현황</h2>
                                <button
                                    type="button"
                                    onClick={addOfficer}
                                    className="px-4 py-2 bg-accent-600 text-white rounded-lg font-semibold hover:bg-accent-700 transition-colors text-sm"
                                >
                                    ➕ 임원 추가
                                </button>
                            </div>

                            <div className="space-y-4">
                                {data.officers.map((officer, index) => (
                                    <div
                                        key={index}
                                        className="relative border border-gray-300 rounded-lg p-4 bg-gray-50"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => deleteOfficer(index)}
                                            className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold text-lg"
                                            title="삭제"
                                        >
                                            ✕
                                        </button>

                                        <div className="grid md:grid-cols-5 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    구분
                                                </label>
                                                <input
                                                    type="text"
                                                    value={officer.position}
                                                    onChange={(e) =>
                                                        handleOfficerChange(
                                                            index,
                                                            'position',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="회장"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    이름
                                                </label>
                                                <input
                                                    type="text"
                                                    value={officer.name}
                                                    onChange={(e) =>
                                                        handleOfficerChange(
                                                            index,
                                                            'name',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="홍길동"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    직분
                                                </label>
                                                <input
                                                    type="text"
                                                    value={officer.role}
                                                    onChange={(e) =>
                                                        handleOfficerChange(
                                                            index,
                                                            'role',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="목사"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    교회
                                                </label>
                                                <input
                                                    type="text"
                                                    value={officer.church}
                                                    onChange={(e) =>
                                                        handleOfficerChange(
                                                            index,
                                                            'church',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="서광교회"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    연락처
                                                </label>
                                                <input
                                                    type="text"
                                                    value={officer.phone}
                                                    onChange={(e) =>
                                                        handleOfficerChange(
                                                            index,
                                                            'phone',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="010-0000-0000"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Events */}
                        <div className="border-2 border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">중요행사</h2>
                                <button
                                    type="button"
                                    onClick={addEvent}
                                    className="px-4 py-2 bg-accent-600 text-white rounded-lg font-semibold hover:bg-accent-700 transition-colors text-sm"
                                >
                                    ➕ 행사 추가
                                </button>
                            </div>

                            <div className="space-y-4">
                                {data.events.map((event, index) => (
                                    <div
                                        key={index}
                                        className="relative border border-gray-300 rounded-lg p-4 bg-gray-50"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => deleteEvent(index)}
                                            className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold text-lg"
                                            title="삭제"
                                        >
                                            ✕
                                        </button>

                                        <div className="grid md:grid-cols-5 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    월
                                                </label>
                                                <input
                                                    type="text"
                                                    value={event.month}
                                                    onChange={(e) =>
                                                        handleEventChange(
                                                            index,
                                                            'month',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="1월"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    행사명
                                                </label>
                                                <input
                                                    type="text"
                                                    value={event.name}
                                                    onChange={(e) =>
                                                        handleEventChange(
                                                            index,
                                                            'name',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="신년하례회"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    일시
                                                </label>
                                                <input
                                                    type="text"
                                                    value={event.datetime}
                                                    onChange={(e) =>
                                                        handleEventChange(
                                                            index,
                                                            'datetime',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="1월 첫째 주"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    장소
                                                </label>
                                                <input
                                                    type="text"
                                                    value={event.location}
                                                    onChange={(e) =>
                                                        handleEventChange(
                                                            index,
                                                            'location',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="본 교회"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    비고
                                                </label>
                                                <input
                                                    type="text"
                                                    value={event.notes}
                                                    onChange={(e) =>
                                                        handleEventChange(
                                                            index,
                                                            'notes',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="참고사항"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? '저장 중...' : '✅ 저장하기'}
                            </button>
                            <a
                                href={publicPageUrl}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
                            >
                                취소
                            </a>
                        </div>
                    </form>
                </div>

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <a
                        href={publicPageUrl}
                        className="inline-flex items-center text-primary-blue hover:text-brand-700 font-medium transition-colors"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {data.name} 페이지 바로가기
                    </a>
                </div>
            </div>
        </main>
    )
}
