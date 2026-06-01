interface PresidentialMessageProps {
    className?: string
}

export default function PresidentialMessage({
    className = '',
}: PresidentialMessageProps) {
    return (
        <section className={`section-padding bg-white ${className}`}>
            <div className="container-custom">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            노회장 인사말
                        </h2>
                        <p className="text-gray-600">
                            제 48~49회기 노회장 | 사랑하는교회 유병구 목사
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-brand-50 to-accent-50 rounded-2xl p-8 md:p-12 border border-brand-100">
                        <div className="relative">
                            {/* Opening Quote */}
                            <div className="text-6xl text-brand-300 absolute -top-6 -left-2">&</div>

                            <div className="relative z-10 space-y-6 text-gray-700 leading-relaxed">
                                <p className="text-lg md:text-xl font-medium text-gray-900">
                                    남경기노회 모든 회원들께 인사드립니다.
                                </p>

                                <p>
                                    주님께서 주시는 평안과 은혜가 노회원님들께 넘치시길
                                    기도드립니다.
                                </p>

                                <p>
                                    저는 제48-49회기 남경기 노회를 섬길 노회장 사랑하는교회
                                    유병구목사입니다.
                                </p>

                                <p>
                                    그동안 우리 남경기 노회는 선배 목사님들의 눈물과 기도로
                                    세워졌고 오늘에 이르기까지 목사님들과 장로님들의 최선의
                                    헌신으로 24년이란 세월을 보내며 성장시켜 왔기에 이 자리를
                                    통해서 머리 숙여 감사를 드립니다.
                                </p>

                                <p>
                                    이제 다시 제48-49회기가 시작 되었습니다.
                                </p>

                                <blockquote className="border-l-4 border-primary-blue pl-6 italic font-medium text-gray-800 my-6">
                                    존경하는 노회원 여러분! 우리 모두 힘을 합쳐 우리 남경기노회를
                                    <span className="text-primary-blue font-bold">
                                        {' '}하나님 보시기에 아름다운 노회로, 사랑이 넘치는 노회로,
                                        모든 노회들의 귀감이 되는 노회
                                    </span>
                                    로 함께 만들어 가십시다.
                                </blockquote>

                                <p className="text-right font-semibold text-gray-900">
                                    노회장 유병구 목사
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <a
                                href="/about/greeting"
                                className="inline-flex items-center text-primary-blue hover:text-brand-700 font-medium transition-colors"
                            >
                                전체 인사말 읽기
                                <svg
                                    className="w-5 h-5 ml-2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
