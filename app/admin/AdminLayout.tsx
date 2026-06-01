'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    // 관리자 권한 체크 (최고관리자, 관리자만 허용)
    const adminRoles = ['super_admin', 'admin', 'ADMIN', 'SUPER_ADMIN'];
    const isAdmin = session.user && adminRoles.includes(session.user.role);

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
                    <p className="text-gray-600 mb-4">관리자 권한이 필요합니다.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="flex-1 ml-64">
                <AdminHeader />
                <main className="p-8">{children}</main>
            </div>
        </div>
    );
}
