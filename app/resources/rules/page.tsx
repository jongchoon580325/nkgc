'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/common/PageHeader'

export default function RulesPage() {
    const [activeTab, setActiveTab] = useState<'PRESBYTERY' | 'COURTESY'>('PRESBYTERY')
    const [content, setContent] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        fetchRule(activeTab)
    }, [activeTab])

    const fetchRule = async (type: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/rules?type=${type}`)
            const result = await response.json()
            if (result.success && result.data) {
                setContent(result.data.content)
            } else {
                setContent('<p class="text-center text-gray-500 py-8">등록된 규칙이 없습니다.</p>')
            }
        } catch (error) {
            console.error('Failed to fetch rule:', error)
            setContent('<p class="text-center text-red-500 py-8">데이터를 불러오는데 실패했습니다.</p>')
        } finally {
            setIsLoading(false)
        }
    }

    const tabs = [
        { key: 'PRESBYTERY' as const, label: '노회 규칙' },
        { key: 'COURTESY' as const, label: '예우 규칙' }
    ]

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="규칙자료실" />

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

                        {/* Tab Content */}
                        <div className="p-8 min-h-[400px]">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
                                </div>
                            ) : (
                                <>
                                    <style jsx>{`
                                        .rules-content h1,
                                        .rules-content h2,
                                        .rules-content h3,
                                        .rules-content h4,
                                        .rules-content h5,
                                        .rules-content h6 {
                                            color: #111827 !important;
                                            font-weight: 700 !important;
                                        }
                                        .rules-content p,
                                        .rules-content div,
                                        .rules-content span {
                                            color: #111827 !important;
                                        }
                                        .rules-content a {
                                            color: #2563eb !important;
                                        }
                                    `}</style>
                                    <div
                                        className="rules-content max-w-none"
                                        dangerouslySetInnerHTML={{ __html: content }}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
