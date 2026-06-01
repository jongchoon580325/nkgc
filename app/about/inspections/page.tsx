import type { Metadata } from 'next'
import AdminOnly from '@/components/auth/AdminOnly'
import fs from 'fs/promises'
import path from 'path'
import InspectionsClient from './InspectionsClient'
import PageHeader from '@/components/common/PageHeader'

export interface PersonInfo {
    name: string
    title: string
}

export interface ChurchInfo {
    name: string
    pastor: string
    address: string
    phone?: string
    mobile?: string
    email?: string
}

export interface InspectionData {
    id: string
    name: string
    leader: PersonInfo
    secretary: PersonInfo
    description: string
    churches: ChurchInfo[]
}

async function getInspectionsData(): Promise<InspectionData[]> {
    const filePath = path.join(process.cwd(), 'data', 'inspections.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
}

export const metadata: Metadata = {
    title: '시찰소개 | 대한예수교 장로회 남경기노회',
    description: '남경기노회 시찰별 소개 및 교회 현황',
}

export default async function InspectionsPage() {
    const inspections = await getInspectionsData()

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <PageHeader title="시찰소개" subtitle="대한예수교 장로회 남경기노회 시찰별 현황" />

            {/* Introduction Section */}
            <section className="section-padding">
                <div className="container-custom max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            시찰 현황
                        </h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            남경기노회는 효율적인 교회 관할과 운영을 위해 4개의
                            시찰로 구성되어 있습니다.
                        </p>
                    </div>

                    {/* Inspections Client Component with Expand/Collapse All */}
                    <InspectionsClient inspections={inspections} />


                    {/* Admin and Navigation Buttons */}
                    <div className="mt-12 flex flex-col items-center space-y-4">
                        {/* Admin Button */}
                        <AdminOnly>
                            <a
                                href="/admin/inspections"
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
                                시찰 관리 (관리자)
                            </a>
                        </AdminOnly>

                    </div>
                </div>
            </section>
        </main>
    )
}
