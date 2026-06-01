'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface NoticePost {
    id: number
    boardType: string
    category: string | null
    title: string
    content: string
    createdAt: Date | string
    authorName?: string | null
    author: {
        name: string
    }
}

interface NoticeNewsProps {
    initialNotices: NoticePost[]
}

const categoryMap: Record<string, string> = {
    'NOTICE': '노회공지',
    'MEMBER': '정회원전용',
    'FREE': '자립위원회', // 임시 매핑
}

const reverseCategoryMap: Record<string, string> = {
    '노회공지': 'NOTICE',
    '정회원전용': 'MEMBER',
    '자립위원회': 'FREE',
}

const categoryColors: Record<string, string> = {
    '노회공지': 'bg-blue-100 text-blue-800',
    '자립위원회': 'bg-green-100 text-green-800',
    '정회원전용': 'bg-purple-100 text-purple-800',
    '기타': 'bg-gray-100 text-gray-800',
}

export default function NoticeNews({ initialNotices = [] }: NoticeNewsProps) {
    const [activeCategory, setActiveCategory] = useState<string>('전체')
    const categories = ['전체', '노회공지', '자립위원회', '정회원전용']

    // HTML 태그 제거 및 길이 제한 함수
    const getSummary = (content: string, limit: number = 100) => {
        const text = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    }

    // 날짜 포맷팅
    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }

    // 카테고리 매핑 및 필터링
    const getDisplayCategory = (post: NoticePost) => {
        if (post.boardType === 'NOTICE') return '노회공지';
        if (post.boardType === 'MEMBER') return '정회원전용';
        // 카테고리 필드가 있으면 그것을 우선 사용 가능
        return categoryMap[post.boardType] || '기타';
    }

    const filteredNotices = initialNotices.filter((notice) => {
        const displayCategory = getDisplayCategory(notice);
        if (activeCategory === '전체') return true;
        return displayCategory === activeCategory;
    }).slice(0, 8); // 최대 8개 표시

    return (
        <div className="h-full">
            <div className="mb-8 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    노회 공지 & 소식
                </h2>
                <p className="text-gray-600">
                    노회의 최신 소식과 공지사항을 확인하세요
                </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${activeCategory === category
                            ? 'bg-primary-blue text-white shadow-md transform scale-105'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Notices Grid */}
            {filteredNotices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {filteredNotices.map((notice) => {
                        const displayCategory = getDisplayCategory(notice);
                        return (
                            <Link
                                key={notice.id}
                                href={`/board/${notice.boardType}/${notice.id}`}
                                className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[displayCategory] || categoryColors['기타']
                                            }`}
                                    >
                                        {displayCategory}
                                    </span>
                                    <span className="text-xs text-gray-400">{formatDate(notice.createdAt)}</span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-blue transition-colors">
                                    {notice.title}
                                </h3>

                                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                                    {getSummary(notice.content)}
                                </p>

                                <div className="flex items-center text-xs text-gray-500 mt-auto pt-4 border-t border-gray-50">
                                    <span>{notice.authorName || notice.author.name}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 mb-8">
                    <p className="text-gray-500">등록된 게시글이 없습니다.</p>
                </div>
            )}

            {/* View All Button */}
            <div className="text-center">
                <Link
                    href="/board/NOTICE"
                    className="inline-flex items-center px-6 py-3 bg-white text-primary-blue border-2 border-primary-blue rounded-lg font-semibold hover:bg-primary-blue hover:text-white transition-all duration-300 text-sm shadow-sm hover:shadow-md"
                >
                    전체 공지 보기
                    <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
            </div>
        </div>
    )
}
