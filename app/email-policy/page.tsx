'use client';
import Link from 'next/link';
import Image from 'next/image'

export default function EmailPolicyPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
            <div className="container-custom max-w-3xl">
                {/* Header */}
                <div className="bg-white rounded-2xl p-8 mb-8 shadow-xl border-2 border-primary-blue">
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                        E-mail 무단수집 거부
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-brand-600 to-accent-600 mx-auto rounded-full"></div>
                </div>

                {/* Illustration */}
                <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
                    <div className="flex justify-center mb-8">
                        <div className="relative w-full max-w-md aspect-square">
                            <Image
                                src="/images/email-protection.png"
                                alt="E-mail 보호 일러스트"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8 border-2 border-red-200">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-10 h-10 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    경고
                                </h2>
                                <p className="text-lg leading-relaxed text-gray-800 mb-6">
                                    본 남경기노회 웹사이트에 게시된 <span className="font-bold text-red-600">이메일 주소</span>가
                                    전자우편수집 프로그램이나 그 밖의 기술적 장치를 이용하여{' '}
                                    <span className="font-bold text-red-600">무단으로 수집되는 것을 거부</span>하며,
                                    이를 위반 시 <span className="font-bold text-red-600">정보통신망 이용촉진 및 정보보호 등에 관한 법률</span>에 의해{' '}
                                    <span className="font-bold text-red-600">처벌받을 수 있습니다</span>.
                                </p>

                                {/* Legal Reference */}
                                <div className="bg-white rounded-lg p-6 border border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                                        <svg
                                            className="w-5 h-5 mr-2 text-primary-blue"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        법적 근거
                                    </h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        정보통신망 이용촉진 및 정보보호 등에 관한 법률 제50조의2(전자우편주소의 무단 수집행위 등 금지)
                                    </p>
                                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                                        <li>• 누구든지 인터넷 홈페이지 운영자 또는 관리자의 사전 동의 없이 전자우편주소를 수집해서는 안 됩니다</li>
                                        <li>• 위반 시 1년 이하의 징역 또는 1천만원 이하의 벌금에 처해질 수 있습니다</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
                        <h3 className="font-bold text-gray-900 mb-3 text-center">
                            문의 사항
                        </h3>
                        <p className="text-center text-gray-700">
                            개인정보 보호 관련 문의사항이 있으시면 아래로 연락 주시기 바랍니다.
                        </p>
                        <div className="mt-4 text-center space-y-2">
                            <p className="text-gray-800">
                                <span className="font-semibold">담당부서:</span> 정보위원회
                            </p>
                            <p className="text-gray-800">
                                <span className="font-semibold">연락처:</span>{' '}
                                <a
                                    href="tel:010-8686-4214"
                                    className="text-primary-blue hover:underline"
                                >
                                    010-8686-4214
                                </a>
                            </p>
                            <p className="text-gray-800">
                                <span className="font-semibold">이메일:</span>{' '}
                                <a
                                    href="mailto:naloveu@korea.com"
                                    className="text-primary-blue hover:underline"
                                >
                                    naloveu@korea.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Related Links */}
                <div className="flex justify-center gap-4">
                    <Link
                        href="/privacy"
                        className="px-6 py-3 bg-white text-primary-blue border-2 border-primary-blue rounded-lg font-semibold hover:bg-primary-blue hover:text-white transition-all duration-300 shadow-md"
                    >
                        개인정보보호규칙 보기
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300"
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
                            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        홈으로
                    </Link>
                </div>
            </div>
        </main>
    )
}
