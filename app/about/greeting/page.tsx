import type { Metadata } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import AdminOnly from '@/components/auth/AdminOnly'
import PageHeader from '@/components/common/PageHeader'

interface PresidentData {
    name: string
    title: string
    church: string
    term: string
    photo: string
    message: string[]
}

async function getPresidentData(): Promise<PresidentData> {
    const filePath = path.join(process.cwd(), 'data', 'president.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
}

export const metadata: Metadata = {
    title: '노회장 인사 | 대한예수교 장로회 남경기노회',
    description: '남경기노회 노회장님의 인사말',
}

export default async function GreetingPage() {
    const president = await getPresidentData()

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="노회장인사" />

            {/* Main Content */}
            <section className="section-padding">
                <div className="container-custom max-w-6xl">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="grid md:grid-cols-3 gap-8 p-8 md:p-12">
                            {/* Text Content */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="border-l-4 border-primary-blue pl-6 mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {president.church} {president.name} {president.title}
                                    </h2>
                                    <p className="text-lg text-primary-blue font-semibold">
                                        {president.term} 노회장
                                    </p>
                                </div>

                                <div className="prose prose-lg max-w-none space-y-4">
                                    {president.message.map((paragraph, index) => {
                                        // Special formatting for the vision statement
                                        if (paragraph.includes('존경하는 노회원 여러분')) {
                                            return (
                                                <blockquote
                                                    key={index}
                                                    className="border-l-4 border-accent-500 pl-6 py-4 my-8 bg-accent-50 rounded-r-lg"
                                                >
                                                    <p className="text-lg font-semibold text-gray-900 mb-2">
                                                        존경하는 노회원 여러분!
                                                    </p>
                                                    <p className="text-gray-800">
                                                        {paragraph.replace('존경하는 노회원 여러분! ', '')}
                                                    </p>
                                                </blockquote>
                                            )
                                        }

                                        // Last paragraph (closing)
                                        if (index === president.message.length - 1) {
                                            return (
                                                <p
                                                    key={index}
                                                    className="text-gray-700 leading-relaxed font-medium"
                                                >
                                                    {paragraph}
                                                </p>
                                            )
                                        }

                                        // Regular paragraphs
                                        return (
                                            <p key={index} className="text-gray-700 leading-relaxed">
                                                {paragraph}
                                            </p>
                                        )
                                    })}

                                    <div className="mt-8 text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            노회장 {president.name} {president.title}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Photo */}
                            <div className="md:col-span-1">
                                <div className="sticky top-8 flex flex-col items-center">
                                    {/* Photo Container - 1/4 size, oval shape */}
                                    <div className="w-48 h-60 relative">
                                        <div className="w-full h-full rounded-full overflow-hidden shadow-2xl ring-4 ring-gray-200/50 ring-offset-4">
                                            {president.photo && president.photo !== '/images/president-placeholder.jpg' ? (
                                                <img
                                                    src={president.photo}
                                                    alt={`${president.name} ${president.title} `}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center">
                                                    <div className="text-center p-4">
                                                        <svg
                                                            className="w-16 h-16 mx-auto text-brand-400 mb-2"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <p className="text-xs text-gray-600">
                                                            노회장 사진
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info below photo */}
                                    <div className="mt-6 text-center">
                                        <p className="font-semibold text-gray-900 text-lg">
                                            {president.name} {president.title}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">{president.church}</p>
                                        <p className="text-sm text-primary-blue font-medium mt-1">
                                            {president.term} 노회장
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Link */}
                    <div className="mt-12 flex flex-col items-center space-y-4">
                        {/* Admin Button */}
                        {/* Admin Button */}
                        <AdminOnly>
                            <a
                                href="/admin/greeting"
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
                                노회장 정보 수정 (관리자)
                            </a>
                        </AdminOnly>
                    </div>
                </div>
            </section>
        </main>
    )
}
