'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'

interface SeparateRegistry {
    id: number
    name: string
    position: string
    birthDate: string
    registrationDate: string
    registrationReason: string
    cancellationDate: string
    cancellationReason: string
}

export default function SeparateRegistryPage() {
    const [registries, setRegistries] = useState<SeparateRegistry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openId, setOpenId] = useState<number | null>(null)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchRegistries(currentPage)
    }, [currentPage])

    const fetchRegistries = async (page: number) => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/administration/separate-registry?page=${page}&limit=16`)
            const result = await response.json()

            if (result.success) {
                setRegistries(result.data)
                setTotalPages(result.pagination.totalPages)
            } else {
                setError(result.error || '데이터를 불러올 수 없습니다.')
            }
        } catch (err) {
            setError('데이터를 불러오는 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleAccordion = (id: number) => {
        setOpenId(openId === id ? null : id)
    }

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
            setOpenId(null) // 페이지 변경 시 열린 아코디언 닫기
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="별명부" />

            {/* Content Section */}
            <section className="section-padding">
                <div className="container-custom">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-blue"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-600 text-lg">{error}</p>
                        </div>
                    ) : registries.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg">등록된 데이터가 없습니다.</p>
                        </div>
                    ) : (
                        <>
                            {/* 4x4 Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {registries.map((registry) => (
                                    <div
                                        key={registry.id}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col"
                                    >
                                        {/* Header (Always Visible) */}
                                        <button
                                            onClick={() => toggleAccordion(registry.id)}
                                            className="w-full px-5 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="text-lg font-bold text-gray-800 truncate">
                                                    {registry.name}
                                                </span>
                                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded w-fit">
                                                    {registry.position}
                                                </span>
                                            </div>
                                            <div className={`transform transition-transform duration-300 flex-shrink-0 ml-2 ${openId === registry.id ? 'rotate-45' : ''}`}>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Body (Expandable) */}
                                        <div
                                            className={`transition-all duration-300 ease-in-out overflow-hidden ${openId === registry.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                                }`}
                                        >
                                            <div className="p-5 border-t border-gray-200 bg-white text-sm space-y-2">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-xs">직분</span>
                                                    <span className="text-gray-800 font-medium">{registry.position}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-xs">생년월일</span>
                                                    <span className="text-gray-800">{registry.birthDate || '-'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-xs">등재일자</span>
                                                    <span className="text-gray-800">{registry.registrationDate || '-'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-xs">등재사유</span>
                                                    <span className="text-gray-800">{registry.registrationReason || '-'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-xs">해지일자</span>
                                                    <span className="text-gray-800">{registry.cancellationDate || '-'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-xs">해지사유</span>
                                                    <span className="text-gray-800">{registry.cancellationReason || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page
                                                ? 'bg-primary-blue text-white shadow-md'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </main>
    )
}
