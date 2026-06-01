'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'

interface StandingCommittee {
    id: number
    name: string
    headTitle: string
    head: string
    headRole: string
    secretary: string
    secretaryRole: string
    members: string
    term: string
    displayOrder: number
}

interface OfficerInfo {
    name: string
    title: string
}


export default function StandingCommitteesPage() {
    const [committees, setCommittees] = useState<StandingCommittee[]>([])
    const [currentTerm, setCurrentTerm] = useState('')
    const [president, setPresident] = useState<OfficerInfo | null>(null)
    const [secretary, setSecretary] = useState<OfficerInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                // Fetch term setting
                const termResponse = await fetch('/api/admin/settings?key=current_term')
                const termResult = await termResponse.json()
                if (termResult.success && termResult.data) {
                    setCurrentTerm(termResult.data.value)
                }

                // Fetch committees
                const response = await fetch('/api/administration/standing-committees')
                const result = await response.json()

                if (result.success) {
                    setCommittees(result.data)
                } else {
                    setError(result.error || '데이터를 불러올 수 없습니다.')
                }

                // Fetch nomination officers
                const officersResponse = await fetch('/api/admin/settings?key=standing_committee_officers')
                const officersResult = await officersResponse.json()
                if (officersResult.success && officersResult.data && officersResult.data.value) {
                    const officers = JSON.parse(officersResult.data.value)
                    setPresident(officers.head || { name: '정영교', title: '목사' })
                    setSecretary(officers.secretary || { name: '문보길', title: '목사' })
                } else {
                    // Default fallback
                    setPresident({ name: '정영교', title: '목사' })
                    setSecretary({ name: '문보길', title: '목사' })
                }
            } catch (err) {
                setError('데이터를 불러오는 중 오류가 발생했습니다.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="상비부현황" />

            {/* Officer Cards & Term Info */}
            <section className="py-8 bg-white border-b border-gray-200">
                <div className="container-custom max-w-6xl">
                    {/* Officer Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Nomination Head Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-md">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-800 mb-1">공천부장</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {president?.name} {president?.title}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Nomination Secretary Card */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 shadow-md">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-orange-800 mb-1">공천부 서기</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {secretary?.name} {secretary?.title}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Term Info */}
                    {currentTerm && (
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-700">[ {currentTerm} ]</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Content Section */}
            <section className="section-padding">
                <div className="container-custom max-w-7xl">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-blue"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-600 text-lg">{error}</p>
                        </div>
                    ) : committees.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg">등록된 상비부가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-800 text-white">
                                            <th className="px-6 py-4 text-center font-bold">부서명</th>
                                            <th className="px-6 py-4 text-center font-bold">부장</th>
                                            <th className="px-6 py-4 text-center font-bold">서기</th>
                                            <th className="px-6 py-4 text-center font-bold">위원</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {committees.map((committee, index) => (
                                            <tr
                                                key={committee.id}
                                                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                                            >
                                                <td className="px-6 py-4 text-center font-semibold text-gray-900">
                                                    {committee.name}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="font-medium text-gray-900">
                                                        {committee.head}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {committee.headRole}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="font-medium text-gray-900">
                                                        {committee.secretary}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {committee.secretaryRole}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 text-left">
                                                        {committee.members || '-'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4 p-4">
                                {committees.map((committee) => (
                                    <div
                                        key={committee.id}
                                        className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                                    >
                                        <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                                            {committee.name}
                                        </h3>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm font-semibold text-gray-600">부장: </span>
                                                <span className="text-sm text-gray-900">
                                                    {committee.head} ({committee.headRole})
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-gray-600">서기: </span>
                                                <span className="text-sm text-gray-900">
                                                    {committee.secretary} ({committee.secretaryRole})
                                                </span>
                                            </div>
                                            {committee.members && (
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-600">위원: </span>
                                                    <span className="text-sm text-gray-900">
                                                        {committee.members}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
