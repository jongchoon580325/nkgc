import type { Metadata } from 'next'
import AdminOnly from '@/components/auth/AdminOnly'
import { promises as fs } from 'fs'
import path from 'path'
import PageHeader from '@/components/common/PageHeader'

interface Officer {
    position: string
    name: string
    role: string
    church: string
    phone: string
}

interface Event {
    month: string
    name: string
    datetime: string
    location: string
    notes: string
}

interface OrganizationData {
    id: string
    name: string
    president: string
    secretary: string
    officers: Officer[]
    events: Event[]
}

async function getOrganizationData(id: string): Promise<OrganizationData | null> {
    const filePath = path.join(process.cwd(), 'data', 'organizations.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContents)
    return data.organizations.find((org: OrganizationData) => org.id === id) || null
}

export const metadata: Metadata = {
    title: '학생면려회 | 대한예수교 장로회 남경기노회',
    description: '남경기노회 학생면려회 소개',
}

export default async function StudentPage() {
    const data = await getOrganizationData('student')

    if (!data) {
        return <div>데이터를 찾을 수 없습니다.</div>
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title={data.name} />

            {/* Leadership Section */}
            <section className="section-padding">
                <div className="container-custom max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="border-l-4 border-primary-blue pl-6">
                                <h3 className="text-sm font-semibold text-gray-500 mb-2">회장</h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {data.president || '-'}
                                </p>
                            </div>
                            <div className="border-l-4 border-accent-600 pl-6">
                                <h3 className="text-sm font-semibold text-gray-500 mb-2">서기</h3>
                                <p className="text-2xl font-bold text-gray-900">
                                    {data.secretary || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Officers Table */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-brand-600 to-accent-600 text-white px-8 py-4">
                            <h2 className="text-2xl font-bold">임원 현황</h2>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100 border-b">
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">구분</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">이름</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">직분</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">교회</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">연락처</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.officers.map((officer, index) => (
                                        <tr
                                            key={index}
                                            className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                } hover:bg-blue-50 transition-colors`}
                                        >
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                {officer.position}
                                            </td>
                                            <td className="px-6 py-4 text-gray-800">
                                                {officer.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-800">
                                                {officer.role || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-800">
                                                {officer.church || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-800">
                                                {officer.phone || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden p-4 space-y-4">
                            {data.officers.map((officer, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                >
                                    <div className="font-bold text-primary-blue mb-3">
                                        {officer.position}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex">
                                            <span className="text-gray-500 w-16">이름:</span>
                                            <span className="text-gray-900">{officer.name || '-'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-500 w-16">직분:</span>
                                            <span className="text-gray-900">{officer.role || '-'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-500 w-16">교회:</span>
                                            <span className="text-gray-900">{officer.church || '-'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-500 w-16">연락처:</span>
                                            <span className="text-gray-900">{officer.phone || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Events Table */}
                    {data.events && data.events.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-8">
                            <div className="bg-gradient-to-r from-brand-600 to-accent-600 text-white px-8 py-4">
                                <h2 className="text-2xl font-bold">중요행사</h2>
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b">
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">월</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">행사명</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">일시</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">장소</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700">비고</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.events.map((event, index) => (
                                            <tr
                                                key={index}
                                                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                    } hover:bg-blue-50 transition-colors`}
                                            >
                                                <td className="px-6 py-4 font-semibold text-gray-900">
                                                    {event.month}
                                                </td>
                                                <td className="px-6 py-4 text-gray-800">
                                                    {event.name}
                                                </td>
                                                <td className="px-6 py-4 text-gray-800">
                                                    {event.datetime}
                                                </td>
                                                <td className="px-6 py-4 text-gray-800">
                                                    {event.location}
                                                </td>
                                                <td className="px-6 py-4 text-gray-800">
                                                    {event.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden p-4 space-y-4">
                                {data.events.map((event, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="font-bold text-primary-blue mb-3">
                                            {event.month} - {event.name}
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex">
                                                <span className="text-gray-500 w-16">일시:</span>
                                                <span className="text-gray-900">{event.datetime}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="text-gray-500 w-16">장소:</span>
                                                <span className="text-gray-900">{event.location}</span>
                                            </div>
                                            {event.notes && (
                                                <div className="flex">
                                                    <span className="text-gray-500 w-16">비고:</span>
                                                    <span className="text-gray-900">{event.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Button */}
                    <div className="mt-12 text-center">
                        <AdminOnly>
                            <a
                                href="/admin/organizations/student"
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
                                정보 수정 (관리자)
                            </a>
                        </AdminOnly>
                    </div>
                </div>
            </section>
        </main>
    )
}
