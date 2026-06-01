'use client';

import { BOARD_TYPES } from '@/lib/board-config';
import ExamMaterialList from '@/components/board/ExamMaterialList';
import PageHeader from '@/components/common/PageHeader';

export default function MeetingMinutesPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="노회록 자료실" />

            {/* Content Section */}
            <div className="container mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <ExamMaterialList boardType={BOARD_TYPES.MEETING_MINUTES} />
                </div>
            </div>
        </main>
    );
}
