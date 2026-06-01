import PageHeader from '@/components/common/PageHeader';

export default function MembersOnlyPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="자유게시판" />

            {/* Content Section */}
            <div className="container-custom py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <p className="text-gray-600 text-center">
                        자유게시판 페이지입니다. 콘텐츠가 곧 추가될 예정입니다.
                    </p>
                </div>
            </div>
        </main>
    )
}
