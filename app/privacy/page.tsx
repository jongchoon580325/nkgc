'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
    const [showAll, setShowAll] = useState(false)

    const sections = [
        {
            title: '1. 개인정보의 처리 목적',
            content: `대한예수교장로회 남경기노회('http://남경기노회.kr'이하 '남경기노회')은(는) 개인정보를 다음의 목적을 위해 처리합니다. 처리한 개인정보는 다음의 목적이외의 용도로는 사용되지 않으며 이용 목적이 변경될 시에는 사전동의를 구할 예정입니다.

가. 홈페이지 회원가입 및 관리

회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스 부정이용 방지 등을 목적으로 개인정보를 처리합니다.`,
        },
        {
            title: '2. 개인정보 파일 현황',
            content: `1. 개인정보 파일명 : 개인정보
개인정보 항목 : 이메일, 휴대전화번호, 자택주소, 자택전화번호, 로그인ID, 이름, 직책, 접속 로그, 접속 IP 정보
수집방법 : 홈페이지
보유근거 : 남경기노회 규칙
보유기간 : 준영구
관련법령 : 신용정보의 수집/처리 및 이용 등에 관한 기록 : 3년`,
        },
        {
            title: '3. 개인정보의 처리 및 보유 기간',
            content: `① 대한예수교장로회 남경기노회('남경기노회')은(는) 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의 받은 개인정보 보유,이용기간 내에서 개인정보를 처리,보유합니다.

② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.

1. 홈페이지 회원가입 및 관리
홈페이지 회원가입 및 관리와 관련한 개인정보는 수집.이용에 관한 동의일로부터 준영구까지 위 이용목적을 위하여 보유.이용됩니다.
보유근거 : 남경기노회 규칙
관련법령 : 신용정보의 수집/처리 및 이용 등에 관한 기록 : 3년`,
        },
        {
            title: '4. 개인정보의 제3자 제공에 관한 사항',
            content: `① 대한예수교장로회 남경기노회('http://남경기노회.kr'이하 '남경기노회')은(는) 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.

② 대한예수교장로회 남경기노회('http://남경기노회.kr')은(는) 다음과 같이 개인정보를 제3자에게 제공하고 있습니다.

1. 대한예수교장로회 남경기노회
- 개인정보를 제공받는 자 : 대한예수교장로회 남경기노회
- 제공받는 자의 개인정보 이용목적 : 이메일, 휴대전화번호, 자택주소, 비밀번호, 로그인ID, 이름, 직책, 서비스 이용 기록, 접속 로그, 접속 IP 정보
- 제공받는 자의 보유.이용기간: 준영구`,
        },
        {
            title: '5. 개인정보처리 위탁',
            content: `① 대한예수교장로회 남경기노회('남경기노회')은(는) 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.

1. 대한예수교장로회 남경기노회
- 위탁받는 자 (수탁자) : 남경기노회
- 위탁하는 업무의 내용 : 회원제 서비스 이용에 따른 본인확인
- 위탁기간 : 준영구

② 대한예수교장로회 남경기노회는 위탁계약 체결시 개인정보 보호법 제25조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적․관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리․감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.

③ 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.`,
        },
        {
            title: '6. 정보주체와 법정대리인의 권리·의무 및 그 행사방법',
            content: `이용자는 개인정보주체로써 다음과 같은 권리를 행사할 수 있습니다.

① 정보주체는 대한예수교장로회 남경기노회에 대해 언제든지 개인정보 열람,정정,삭제,처리정지 요구 등의 권리를 행사할 수 있습니다.

② 제1항에 따른 권리 행사는 대한예수교장로회 남경기노회에 대해 개인정보 보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 대한예수교장로회 남경기노회은(는) 이에 대해 지체 없이 조치하겠습니다.

③ 제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우 개인정보 보호법 시행규칙 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.

④ 개인정보 열람 및 처리정지 요구는 개인정보보호법 제35조 제5항, 제37조 제2항에 의하여 정보주체의 권리가 제한 될 수 있습니다.

⑤ 개인정보의 정정 및 삭제 요구는 다른 법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 그 삭제를 요구할 수 없습니다.

⑥ 대한예수교장로회 남경기노회은(는) 정보주체 권리에 따른 열람의 요구, 정정·삭제의 요구, 처리정지의 요구 시 열람 등 요구를 한 자가 본인이거나 정당한 대리인인지를 확인합니다.`,
        },
        {
            title: '7. 처리하는 개인정보의 항목',
            content: `① 대한예수교장로회 남경기노회('http://남경기노회.kr'이하 '남경기노회')은(는) 다음의 개인정보 항목을 처리하고 있습니다.

1. 홈페이지 회원가입 및 관리
- 필수항목 : 이메일, 휴대전화번호, 자택주소, 비밀번호, 로그인ID, 이름, 직책
- 선택항목 : 자택전화번호, 비밀번호 질문과 답, 생년월일`,
        },
        {
            title: '8. 개인정보의 파기',
            content: `대한예수교장로회 남경기노회('남경기노회')은(는) 원칙적으로 개인정보 처리목적이 달성된 경우에는 지체없이 해당 개인정보를 파기합니다. 파기의 절차, 기한 및 방법은 다음과 같습니다.

- 파기절차
이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다. 이 때, DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 다른 목적으로 이용되지 않습니다.

- 파기기한
이용자의 개인정보는 개인정보의 보유기간이 경과된 경우에는 보유기간의 종료일로부터 5일 이내에, 개인정보의 처리 목적 달성, 해당 서비스의 폐지, 사업의 종료 등 그 개인정보가 불필요하게 되었을 때에는 개인정보의 처리가 불필요한 것으로 인정되는 날로부터 5일 이내에 그 개인정보를 파기합니다.

- 파기방법
전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.
종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.`,
        },
        {
            title: '9. 개인정보 자동 수집 장치의 설치•운영 및 거부에 관한 사항',
            content: `대한예수교장로회 남경기노회는 정보주체의 이용정보를 저장하고 수시로 불러오는 '쿠키'를 사용하지 않습니다.`,
        },
        {
            title: '10. 개인정보 보호책임자',
            content: `① 대한예수교장로회 남경기노회는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.

▶ 개인정보 보호책임자
- 성명 : 나종춘
- 직책 : 정보위원회
- 직급 : 위원장
- 연락처 : 010-8686-4214, naloveu@korea.com

▶ 개인정보 보호 담당부서
- 부서명 : 정보위원회
- 담당자 : 나종춘
- 연락처 : 010-8686-4214, naloveu@korea.com

② 정보주체께서는 대한예수교장로회 남경기노회의 서비스(또는 사업)을 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다. 대한예수교장로회 남경기노회는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.`,
        },
        {
            title: '11. 개인정보 처리방침 변경',
            content: `① 이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.`,
        },
        {
            title: '12. 개인정보의 안전성 확보 조치',
            content: `대한예수교장로회 남경기노회('남경기노회')은(는) 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.

1. 정기적인 자체 감사 실시
개인정보 취급 관련 안정성 확보를 위해 정기적(분기 1회)으로 자체 감사를 실시하고 있습니다.

2. 해킹 등에 대비한 기술적 대책
대한예수교장로회 남경기노회('남경기노회')는 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.

3. 비인가자에 대한 출입 통제
개인정보를 보관하고 있는 물리적 보관 장소를 별도로 두고 이에 대해 출입통제 절차를 수립, 운영하고 있습니다.`,
        },
    ]

    const visibleSections = showAll ? sections : sections.slice(0, 5)

    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="container-custom max-w-4xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-2xl p-8 mb-8 shadow-lg">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        개인정보 보호 규칙
                    </h1>
                    <p className="text-lg opacity-90">
                        대한예수교 장로회 남경기노회
                    </p>
                    <p className="text-sm mt-2 opacity-75">
                        시행일: 2008년 1월 1일
                    </p>
                </div>

                {/* Introduction */}
                <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
                    <p className="text-gray-700 leading-relaxed">
                        대한예수교장로회 남경기노회('http://남경기노회.kr'이하 '남경기노회')는
                        개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와
                        관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고
                        있습니다.
                    </p>
                    <p className="text-gray-700 leading-relaxed mt-4">
                        남경기노회는 개인정보처리방침을 개정하는 경우 웹사이트 공지사항(또는
                        개별공지)을 통하여 공지할 것입니다.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                    {visibleSections.map((section, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-primary-blue transition-colors"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-4 text-primary-blue">
                                {section.title}
                            </h2>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {section.content}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show More/Less Button */}
                {!showAll && sections.length > 5 && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setShowAll(true)}
                            className="inline-flex items-center px-8 py-4 bg-primary-blue text-white rounded-xl font-semibold hover:bg-brand-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                                <path d="M19 9l-7 7-7-7" />
                            </svg>
                            더 보기 ({sections.length - 5}개 항목 더 있음)
                        </button>
                    </div>
                )}

                {showAll && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => {
                                setShowAll(false)
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="inline-flex items-center px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
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
                                <path d="M5 15l7-7 7 7" />
                            </svg>
                            접기
                        </button>
                    </div>
                )}

                {/* Back Button */}
                <div className="mt-12 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-primary-blue hover:text-brand-700 font-medium transition-colors"
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
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </main>
    )
}
