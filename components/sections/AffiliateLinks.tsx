import { Building2 } from 'lucide-react'

interface AffiliateLink {
    name: string
    url: string
    icon?: string
}

const affiliates: AffiliateLink[] = [
    {
        name: '대한예수교장로회총회',
        url: 'http://gapck.org',
        icon: '⛪',
    },
    {
        name: '자립개발원',
        url: 'http://www.icsis.co.kr',
        icon: '🏗️',
    },
    {
        name: '세례교인헌금',
        url: 'http://www.gapck.org/sub_07/sub06_01.asp?menu=menu6',
        icon: '💝',
    },
    {
        name: '세계선교회',
        url: 'https://gms.kr',
        icon: '🌍',
    },
    {
        name: '기독신문사',
        url: 'https://www.kidok.com',
        icon: '📰',
    },
    {
        name: '총신대학원',
        url: 'http://csts.chongshin.ac.kr',
        icon: '🎓',
    },
]

export default function AffiliateLinks() {
    return (
        <section className="section-padding bg-white border-t border-gray-200">
            <div className="container-custom">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
                        <Building2 className="w-7 h-7 text-blue-600" />
                        관련 기관
                    </h2>
                    <p className="text-gray-600 text-lg">
                        대한예수교장로회 관련 기관 및 협력 단체
                    </p>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        {affiliates.map((affiliate) => (
                            <a
                                key={affiliate.name}
                                href={affiliate.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-brand-50 rounded-xl transition-all duration-300 hover:shadow-md border border-gray-200 hover:border-brand-300"
                            >
                                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                    {affiliate.icon}
                                </div>
                                <h3 className="text-center font-semibold text-gray-900 group-hover:text-primary-blue transition-colors text-sm md:text-base">
                                    {affiliate.name}
                                </h3>
                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg
                                        className="w-5 h-5 text-primary-blue"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
