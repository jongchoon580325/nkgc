'use client'

import { useState, useEffect } from 'react'
import type { Metadata } from 'next'
import PageHeader from '@/components/common/PageHeader';

interface Member {
    id: number
    name: string
    churchName: string
    position: string
    category: string | null
    phone: string
    role: string
}

export default function MembersStatusPage() {
    const [activeTab, setActiveTab] = useState<'pastor' | 'elder'>('pastor')
    const [members, setMembers] = useState<Member[]>([])
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchMembers()
    }, [activeTab])

    useEffect(() => {
        filterMembers()
    }, [members, searchQuery])

    const fetchMembers = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/administration/members-status?type=${activeTab}`)
            const result = await response.json()

            if (result.success) {
                setMembers(result.data)
                setFilteredMembers(result.data)
            } else {
                setError(result.error || '데이터를 불러올 수 없습니다.')
            }
        } catch (err) {
            setError('데이터를 불러오는 중 오류가 발생했습니다.')
            console.error('Error fetching members:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const filterMembers = () => {
        let filtered = [...members]

        if (searchQuery) {
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.churchName.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredMembers(filtered)
    }

    const tabs = [
        { key: 'pastor' as const, label: '목사회원' },
        { key: 'elder' as const, label: '장로총대' }
    ]

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="노회원현황" />

            {/* Content Section */}
            <section className="section-padding">
                <div className="container-custom max-w-6xl">
                    {/* Tab Navigation */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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

                        {/* Search and Info */}
                        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Search */}
                                <div className="flex-1 max-w-md">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="이름 또는 교회명으로 검색"
                                            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                        />
                                        <svg
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                {/* Sort Info */}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium">회원 정렬 : '가나다' 순</span>
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <p className="text-red-600">{error}</p>
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">
                                        {searchQuery ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-100 border-b">
                                                    <th className="px-6 py-4 text-left font-bold text-gray-700">번호</th>
                                                    <th className="px-6 py-4 text-left font-bold text-gray-700">이름</th>
                                                    <th className="px-6 py-4 text-left font-bold text-gray-700">직분</th>
                                                    <th className="px-6 py-4 text-left font-bold text-gray-700">구분</th>
                                                    <th className="px-6 py-4 text-left font-bold text-gray-700">교회명</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredMembers.map((member, index) => (
                                                    <tr
                                                        key={member.id}
                                                        className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                            } hover:bg-blue-50 transition-colors`}
                                                    >
                                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">
                                                            {member.name}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-800">
                                                            {member.position}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-800">
                                                            {member.position === '장로'
                                                                ? (member.category === '장로' ? '시무장로' : `${member.category || '시무'}장로`)
                                                                : (member.category || '-')}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-800">
                                                            {member.churchName}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden space-y-4">
                                        {filteredMembers.map((member, index) => (
                                            <div
                                                key={member.id}
                                                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="font-bold text-primary-blue text-lg">
                                                        {index + 1}. {member.name}
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-20 flex-shrink-0">직분:</span>
                                                        <span className="text-gray-900 font-medium">{member.position}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-20 flex-shrink-0">구분:</span>
                                                        <span className="text-gray-900">
                                                            {member.position === '장로'
                                                                ? (member.category === '장로' ? '시무장로' : `${member.category || '시무'}장로`)
                                                                : (member.category || '-')}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="text-gray-500 w-20 flex-shrink-0">교회명:</span>
                                                        <span className="text-gray-900">{member.churchName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total Count */}
                                    <div className="mt-6 text-right">
                                        <p className="text-sm text-gray-600">
                                            {searchQuery && (
                                                <span className="mr-4">
                                                    검색 결과: <span className="font-bold text-primary-blue">{filteredMembers.length}</span>명
                                                </span>
                                            )}
                                            총 <span className="font-bold text-primary-blue">{members.length}</span>명
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
