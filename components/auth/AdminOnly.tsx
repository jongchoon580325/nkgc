'use client';

import { useSession } from 'next-auth/react';

export default function AdminOnly({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    // 관리자, 목사, 장로, 전도사 등 권한이 있는 사용자만 접근 허용
    // 필요에 따라 권한 레벨을 더 세분화할 수 있음
    const isAdmin = session?.user && ['admin', 'pastor', 'elder', 'evangelist'].includes(session.user.role);

    if (!isAdmin) {
        return null;
    }

    return <>{children}</>;
}
