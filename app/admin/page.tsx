'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import StatCard from '@/components/admin/StatCard';
import Link from 'next/link';

interface DashboardStats {
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    organizations: number;
}

interface RecentApplication {
    id: number;
    username: string;
    name: string;
    churchName: string;
    position: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { data: session } = useSession();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/admin/dashboard/stats');
            const result = await response.json();

            if (result.success) {
                setStats(result.data.stats);
                setRecentApplications(result.data.recentApplications);
            }
        } catch (error) {
            console.error('대시보드 데이터 로드 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-blue to-accent-600 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    환영합니다, {session?.user?.name}님! 👋
                </h1>
                <p className="text-blue-100">
                    남경기노회 관리자 시스템에 오신 것을 환영합니다.
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="전체 회원"
                    value={stats?.totalUsers || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                    }
                    color="blue"
                />

                <StatCard
                    title="승인 대기"
                    value={stats?.pendingUsers || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    }
                    color="yellow"
                />

                <StatCard
                    title="승인 완료"
                    value={stats?.approvedUsers || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    }
                    color="green"
                />

                <StatCard
                    title="관리 기관"
                    value={stats?.organizations || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                    }
                    color="purple"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    href="/admin/users"
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-l-4 border-blue-500"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">회원 관리</h3>
                            <p className="text-sm text-gray-600">회원 승인 및 관리</p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/admin/organizations"
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-l-4 border-purple-500"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <svg
                                className="w-6 h-6 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">기관 관리</h3>
                            <p className="text-sm text-gray-600">기관 정보 수정</p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/admin/inspections"
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-l-4 border-green-500"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <svg
                                className="w-6 h-6 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">시찰 관리</h3>
                            <p className="text-sm text-gray-600">시찰 정보 관리</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Applications */}
            {recentApplications.length > 0 && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">최근 가입 신청</h2>
                        <Link
                            href="/admin/users?status=pending"
                            className="text-sm text-primary-blue hover:underline font-semibold"
                        >
                            전체 보기 →
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {recentApplications.map((app) => (
                            <div
                                key={app.id}
                                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => router.push('/admin/approval')}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{app.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {app.churchName} · {app.position}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">
                                            {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push('/admin/approval');
                                            }}
                                            className="text-sm text-primary-blue hover:underline font-medium"
                                        >
                                            승인 처리 →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
