'use client'

import { useState } from 'react'
import PageHeader from '@/components/common/PageHeader';

export default function NoticesPage() {
    const [activeTab, setActiveTab] = useState<'department' | 'applicant'>('department')

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="고시자료실" />

            {/* Content Section */}
            <div className="container-custom py-12">
                {/* Tab Navigation */}
                <div className="bg-white rounded-t-2xl shadow-lg overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('department')}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'department'
                                    ? 'bg-primary-blue text-white border-b-2 border-primary-blue'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            고시부 자료실
                        </button>
                        <button
                            onClick={() => setActiveTab('applicant')}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'applicant'
                                    ? 'bg-primary-blue text-white border-b-2 border-primary-blue'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            응시자 자료실
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-b-2xl shadow-lg p-8">
                    {activeTab === 'department' ? (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">고시부 자료실</h2>
                            <p className="text-gray-600">
                                고시부 관련 자료 페이지입니다. 콘텐츠가 곧 추가될 예정입니다.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">응시자 자료실</h2>
                            <p className="text-gray-600">
                                응시자 관련 자료 페이지입니다. 콘텐츠가 곧 추가될 예정입니다.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
