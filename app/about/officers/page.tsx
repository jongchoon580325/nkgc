import type { Metadata } from 'next'
import AdminOnly from '@/components/auth/AdminOnly'
import fs from 'fs/promises'
import path from 'path'
import PageHeader from '@/components/common/PageHeader'

interface Officer {
    position: string
    name: string
    title: string
    church: string
    photo: string
}

interface OfficersData {
    term: string
    officers: Officer[]
}

async function getOfficersData(): Promise<OfficersData> {
    const filePath = path.join(process.cwd(), 'data', 'officers.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
}

export const metadata: Metadata = {
    title: '현재임원 | 대한예수교 장로회 남경기노회',
    description: '남경기노회 현재 임원진 정보',
}

export default async function OfficersPage() {
    const data = await getOfficersData()

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="현재임원" subtitle={`대한예수교 장로회 남경기노회 ${data.term}`} />

            {/* Officers Grid */}
            <section className="section-padding">
                <div className="container-custom max-w-6xl">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.officers.map((officer, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="p-6">
                                    {/* Photo */}
                                    <div className="w-32 h-40 mx-auto mb-4">
                                        <div className="w-full h-full rounded-full overflow-hidden shadow-lg ring-4 ring-gray-200/50 bg-gradient-to-br from-brand-100 to-accent-100">
                                            {officer.photo && officer.photo !== '' ? (
                                                <img
                                                    src={officer.photo}
                                                    alt={`${officer.name} ${officer.title}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <svg
                                                        className="w-16 h-16 text-brand-400"
                                                        fill="none"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="text-center">
                                        <div className="inline-block px-3 py-1 bg-primary-blue text-white text-sm font-semibold rounded-full mb-3">
                                            {officer.position}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {officer.name ? (
                                                <>
                                                    {officer.name} {officer.title}
                                                </>
                                            ) : (
                                                <span className="text-gray-400">미정</span>
                                            )}
                                        </h3>
                                        {officer.church && (
                                            <p className="text-gray-600 text-sm">{officer.church}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Admin and Navigation Buttons */}
                    <div className="mt-12 flex flex-col items-center space-y-4">
                        {/* Admin Button */}
                        <AdminOnly>
                            <a
                                href="/admin/officers"
                                className="inline-flex items-center px-8 py-4 bg-primary-blue text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                            >
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                임원 정보 수정 (관리자)
                            </a>
                        </AdminOnly>
                    </div>
                </div>
            </section>
        </main>
    )
}
