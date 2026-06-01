import Link from 'next/link'

interface QuickActionCard {
    icon: string
    title: string
    description: string
    href: string
    hoverColor: string
}

const quickActions: QuickActionCard[] = [
    {
        icon: '📢',
        title: '노회공지',
        description: '최신 공지사항 확인',
        href: '/board/NOTICE',
        hoverColor: 'hover:bg-pink-50',
    },
    {
        icon: '📋',
        title: '노회운영규칙',
        description: '노회 규칙 및 규정',
        href: '/resources/rules',
        hoverColor: 'hover:bg-blue-50',
    },
    {
        icon: '👥',
        title: '상비부현황',
        description: '상설 위원회 정보',
        href: '/administration/standing-committees',
        hoverColor: 'hover:bg-purple-50',
    },
    {
        icon: '📚',
        title: '고시부자료',
        description: '고시 관련 자료',
        href: '/board/EXAM_DEPT',
        hoverColor: 'hover:bg-green-50',
    },
    {
        icon: '💬',
        title: '정회원게시판',
        description: '회원 전용 게시판',
        href: '/board/MEMBER',
        hoverColor: 'hover:bg-yellow-50',
    },
    {
        icon: '📍',
        title: '시찰주소록',
        description: '시찰별 교회 주소록',
        href: '/about/inspections',
        hoverColor: 'hover:bg-orange-50',
    },
    {
        icon: '📄',
        title: '노회서식',
        description: '각종 행정 서식 다운로드',
        href: '/board/FORM_ADMIN',
        hoverColor: 'hover:bg-teal-50',
    },
    {
        icon: '📝',
        title: '노회결의서',
        description: '노회 결의사항 문서',
        href: '/resources/resolutions',
        hoverColor: 'hover:bg-indigo-50',
    },
]

export default function QuickActions() {
    return (
        <section className="section-padding bg-gray-50">
            <div className="container-custom">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        주요 서비스
                    </h2>
                    <p className="text-gray-600 text-lg">
                        노회원들이 자주 찾는 핵심 행정 서비스를 빠르게 이용하실 수 있습니다
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickActions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            className={`group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 ${action.hoverColor}`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                    {action.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-blue transition-colors">
                                    {action.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {action.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
