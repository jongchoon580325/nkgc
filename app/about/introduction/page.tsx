import type { Metadata } from 'next'
import AdminOnly from '../../components/auth/AdminOnly'
import fs from 'fs/promises'
import path from 'path'
import PageHeader from '@/app/components/common/PageHeader'
import Image from 'next/image'

interface Section {
    heading: string
    content?: string
    items?: string[]
    image?: string
}

interface IntroductionData {
    title: string
    subtitle: string
    description: string
    sections: Section[]
}

async function getIntroductionData(): Promise<IntroductionData> {
    const filePath = path.join(process.cwd(), 'data', 'introduction.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
}

export const metadata: Metadata = {
    title: '노회소개 | 대한예수교 장로회 남경기노회',
    description: '남경기노회 소개 - 4개 시찰 구성 및 관할 지역 안내',
}

export default async function IntroductionPage() {
    const data = await getIntroductionData()

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title={data.title} subtitle={data.subtitle} />

            {/* Content Section */}
            <section className="section-padding">
                <div className="container-custom max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                        {/* Description */}
                        <div className="mb-8 pb-8 border-b border-gray-200">
                            <p className="text-lg text-gray-700 leading-relaxed">
                                {data.description}
                            </p>
                        </div>

                        {/* Sections */}
                        <div className="space-y-12">
                            {data.sections.map((section, index) => (
                                <div key={index} className={`grid gap-8 ${section.image ? 'lg:grid-cols-3' : ''} items-start`}>
                                    <div className={`space-y-4 ${section.image ? 'lg:col-span-2' : ''}`}>
                                        <h2 className="text-2xl font-bold text-primary-blue border-l-4 border-primary-blue pl-4">
                                            {section.heading}
                                        </h2>

                                        {section.content && (
                                            <p className="text-gray-700 leading-relaxed text-lg">
                                                {section.content}
                                            </p>
                                        )}

                                        {section.items && (
                                            <ul className="space-y-3 mt-4">
                                                {section.items.map((item, itemIndex) => (
                                                    <li
                                                        key={itemIndex}
                                                        className="flex items-center text-gray-700"
                                                    >
                                                        <span className="w-2 h-2 bg-accent-600 rounded-full mr-3 shrink-0"></span>
                                                        <span className="text-lg">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {section.image && (
                                        <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden shadow-md order-first lg:order-last">
                                            <Image
                                                src={section.image}
                                                alt={section.heading}
                                                fill
                                                className="object-contain p-4"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Admin and Navigation Buttons */}
                    <div className="mt-12 flex flex-col items-center space-y-4">
                        {/* Admin Button */}
                        <AdminOnly>
                            <a
                                href="/admin/introduction"
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
                                노회소개 수정 (관리자)
                            </a>
                        </AdminOnly>
                    </div>
                </div>
            </section>
        </main>
    )
}
