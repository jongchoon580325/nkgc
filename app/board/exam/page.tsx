'use client';

import { useState } from 'react';
import { BOARD_TYPES } from '@/lib/board-config';
import PostList from '@/components/board/PostList';
import ExamMaterialList from '@/components/board/ExamMaterialList';
import PageHeader from '@/components/common/PageHeader';

export default function ExamMaterialsPage() {
    const [activeTab, setActiveTab] = useState<'EXAM_DEPT' | 'EXAM_USER'>('EXAM_DEPT');

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="고시 자료실" />

            {/* Content Section */}
            <div className="container mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* 탭 헤더 */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => setActiveTab('EXAM_DEPT')}
                            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${activeTab === 'EXAM_DEPT'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            고시부 자료실
                        </button>
                        <button
                            onClick={() => setActiveTab('EXAM_USER')}
                            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${activeTab === 'EXAM_USER'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            응시자 자료실
                        </button>
                    </div>

                    {/* 탭 컨텐츠 */}
                    <div>
                        {activeTab === 'EXAM_DEPT' && <PostList boardType={BOARD_TYPES.EXAM_DEPT} showHeader={false} />}
                        {activeTab === 'EXAM_USER' && <ExamMaterialList boardType={BOARD_TYPES.EXAM_USER} />}
                    </div>
                </div>
            </div>
        </main>
    );
}
