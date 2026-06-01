'use client';

import PageHeader from '@/components/common/PageHeader';
import MediaManager from '@/components/media/MediaManager';

export default function MediaAdminPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PageHeader
                title="통합 미디어 라이브러리"
                description="이미지, 파일 등 모든 디지털 자산을 중앙에서 관리합니다."
                registerCount={null}
            />

            <main className="container mx-auto px-4 -mt-8">
                <MediaManager />
            </main>
        </div>
    );
}
