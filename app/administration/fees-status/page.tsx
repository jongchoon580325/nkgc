'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'

interface FeeStatus {
    id: number
    inspection: string
    churchName: string
    pastorName: string
    monthlyFee: number
    annualFee: number
}

export default function FeesStatusPage() {
    const [fees, setFees] = useState<FeeStatus[]>([])
    const [currentTerm, setCurrentTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('동부')

    const inspections = ['동부', '서부', '남부', '북부']

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/administration/fees-status')
            const result = await response.json()

            if (result.success) {
                setFees(result.data)
                setCurrentTerm(result.currentTerm)
            } else {
                setError(result.error || '데이터를 불러올 수 없습니다.')
            }
        } catch (err) {
            setError('데이터를 불러오는 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    // Filter fees by active tab
    const filteredFees = fees.filter(fee => fee.inspection === activeTab)

    // Calculate totals
    const totalMonthly = filteredFees.reduce((sum, fee) => sum + fee.monthlyFee, 0)
    const totalAnnual = filteredFees.reduce((sum, fee) => sum + fee.annualFee, 0)

    // Calculate Grand Total (All inspections)
    const grandTotalMonthly = fees.reduce((sum, fee) => sum + fee.monthlyFee, 0)
    const grandTotalAnnual = fees.reduce((sum, fee) => sum + fee.annualFee, 0)

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="상회비현황" />

            {/* Term Section */}
            {currentTerm && (
                <section className="py-8 bg-white border-b border-gray-200">
                    <div className="container-custom max-w-6xl">
                        <div className="flex items-center justify-center gap-3 text-gray-700">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-4xl font-bold">{currentTerm}</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Content Section */}
            <section className="section-padding">
                <div className="container-custom max-w-5xl">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-blue"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-600 text-lg">{error}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200">
                                {inspections.map((inspection) => (
                                    <button
                                        key={inspection}
                                        onClick={() => setActiveTab(inspection)}
                                        className={`flex-1 py-4 text-center font-bold text-lg transition-colors ${activeTab === inspection
                                            ? 'bg-primary-blue text-white'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {inspection}시찰
                                    </button>
                                ))}
                            </div>

                            {/* Table */}
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">시찰</th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">교회명</th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">담임목사</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">월회비</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">연회비</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredFees.length > 0 ? (
                                                filteredFees.map((fee) => (
                                                    <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {fee.inspection}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {fee.churchName}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                            {fee.pastorName}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                                                            {fee.monthlyFee.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-bold">
                                                            {fee.annualFee.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                        등록된 데이터가 없습니다.
                                                    </td>
                                                </tr>
                                            )}

                                            {/* Subtotal Row */}
                                            {filteredFees.length > 0 && (
                                                <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                                                    <td colSpan={3} className="px-6 py-4 text-right text-blue-900">
                                                        {activeTab}시찰 소계
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-blue-900">
                                                        {totalMonthly.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-blue-900">
                                                        {totalAnnual.toLocaleString()}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Grand Total Section */}
                                <div className="mt-8 p-6 bg-gray-900 text-white rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="text-lg font-bold">전체 합계 (모든 시찰)</div>
                                    <div className="flex gap-8 text-right">
                                        <div>
                                            <div className="text-sm text-gray-400 mb-1">월회비 총액</div>
                                            <div className="text-xl font-bold text-yellow-400">{grandTotalMonthly.toLocaleString()}원</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-400 mb-1">연회비 총액</div>
                                            <div className="text-2xl font-bold text-green-400">{grandTotalAnnual.toLocaleString()}원</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
