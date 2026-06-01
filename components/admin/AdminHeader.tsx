'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface AdminHeaderProps {
    title?: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [showDropdown, setShowDropdown] = useState(false);

    // 경로에서 페이지 제목 자동 생성
    const getPageTitle = () => {
        if (title) return title;

        if (pathname === '/admin') return '대시보드';
        if (pathname.startsWith('/admin/members')) return '회원 관리';
        if (pathname.startsWith('/admin/approval')) return '가입승인 관리';
        if (pathname.startsWith('/admin/users')) return '회원 관리 (Legacy)';
        if (pathname.startsWith('/admin/organizations')) return '기관 관리';
        if (pathname.startsWith('/admin/inspections')) return '시찰 관리';
        if (pathname.startsWith('/admin/officers')) return '임원 관리';
        if (pathname.startsWith('/admin/content')) return '콘텐츠 관리';

        return '관리자';
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    return (
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {new Date().toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long',
                        })}
                    </p>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        {/* Badge */}
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-accent-600 rounded-full flex items-center justify-center text-white font-bold">
                                {session?.user?.name?.[0] || 'A'}
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-sm font-semibold text-gray-900">
                                    {session?.user?.name || '관리자'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {session?.user?.role === 'admin' ? '최고 관리자' : '관리자'}
                                </p>
                            </div>
                            <svg
                                className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {session?.user?.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {session?.user?.email || session?.user?.username}
                                    </p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    로그아웃
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
