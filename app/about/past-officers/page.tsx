import type { Metadata } from 'next'
import AdminOnly from '@/components/auth/AdminOnly'
import fs from 'fs/promises'
import path from 'path'
import PageHeader from '@/components/common/PageHeader'

interface YearOfficers {
    year: string
    church: string
    officers: {
        노회장: string
        부노회장: string
        서기: string
        부서기: string
        회록서기: string
        부회록서기: string
        회계: string
        부회계: string
    }
}

interface PastOfficersData {
    years: YearOfficers[]
}

async function getPastOfficersData(): Promise<PastOfficersData> {
    const filePath = path.join(process.cwd(), 'data', 'past-officers.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
}

export const metadata: Metadata = {
    title: '역대임원 | 대한예수교 장로회 남경기노회',
    description: '남경기노회 역대 임원진 정보',
}

export default async function PastOfficersPage() {
    const data = await getPastOfficersData()

    // Sort years in descending order (newest first)
    const sortedYears = [...data.years].sort((a, b) => {
        return parseInt(b.year) - parseInt(a.year)
    })

    const positions = ['노회장', '부노회장', '서기', '부서기', '회록서기', '부회록서기', '회계', '부회계']

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="역대임원" />

            {/* Table Section */}
            <section className="section-padding">
                <div className="container-custom max-w-7xl">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-brand-600 to-accent-600 text-white">
                                        <th className="px-4 py-4 text-center font-bold">연도</th>
                                        <th className="px-4 py-4 text-center font-bold">교회</th>
                                        {positions.map((position) => (
                                            <th key={position} className="px-4 py-4 text-center font-bold">
                                                {position}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedYears.map((yearData, index) => (
                                        <tr
                                            key={index}
                                            className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                } hover:bg-blue-50 transition-colors`}
                                        >
                                            <td className="px-4 py-4 text-center font-semibold text-primary-blue">
                                                {yearData.year}
                                            </td>
                                            <td className="px-4 py-4 text-center text-gray-700">
                                                {yearData.church}
                                            </td>
                                            {positions.map((position) => (
                                                <td key={position} className="px-4 py-4 text-center text-gray-800">
                                                    {yearData.officers[position as keyof typeof yearData.officers] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4 p-4">
                            {sortedYears.map((yearData, index) => (
                                <div
                                    key={index}
                                    className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-6 shadow-md"
                                >
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b">
                                        <div>
                                            <div className="text-2xl font-bold text-primary-blue">
                                                {yearData.year}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">{yearData.church}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {positions.map((position) => (
                                            <div key={position} className="text-sm">
                                                <div className="text-gray-500 font-medium mb-1">{position}</div>
                                                <div className="text-gray-900">
                                                    {yearData.officers[position as keyof typeof yearData.officers] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                역대임원 정보 수정 (관리자)
                            </a>
                        </AdminOnly>
                    </div>
                </div>
            </section>
        </main>
    )
}
