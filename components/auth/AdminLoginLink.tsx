'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export default function AdminLoginLink() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        await signOut({ callbackUrl: '/' });
    };

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">
                    {session.user?.name}님 환영합니다
                </span>
                <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                    로그아웃
                </button>
            </div>
        );
    }

    return (
        <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="text-gray-400 hover:text-white text-sm transition-colors"
        >
            관리자 로그인
        </Link>
    );
}
