import Link from 'next/link'
import AdminLoginLink from '../auth/AdminLoginLink'
import { prisma } from '@/lib/prisma'
import { ContactInfo, DEFAULT_CONTACT_INFO, normalizeContactInfo } from '@/lib/contact-info'

async function getContactInfo(): Promise<ContactInfo> {
    try {
        const block = await prisma.contentBlock.findUnique({ where: { key: 'contact_info' } })
        if (block?.value) return normalizeContactInfo(block.value as unknown as Partial<ContactInfo>)
    } catch { /* fall through to default */ }
    return DEFAULT_CONTACT_INFO
}

export default async function Footer() {
    const contactInfo = await getContactInfo()

    const quickLinks = [
        { label: 'Home', href: '/' },
        { label: '노회소개', href: '/about/greeting' },
        { label: '시찰소개', href: '/about/inspections' },
        { label: '기관소개', href: '/organizations/sunday-school' },
        { label: '노회행정', href: '/admin' },
        { label: '노회자료', href: '/resources' },
        { label: '노회알림', href: '/notices' },
    ]

    const affiliateLinks = [
        { label: '대한예수교장로회총회', href: 'http://gapck.org' },
        { label: '자립개발원', href: 'http://www.icsis.co.kr' },
        {
            label: '세례교인헌금',
            href: 'http://www.gapck.org/sub_07/sub06_01.asp?menu=menu6',
        },
        { label: '세계선교회', href: 'https://gms.kr' },
        { label: '기독신문사', href: 'https://www.kidok.com' },
        { label: '총신대학원', href: 'http://csts.chongshin.ac.kr' },
    ]

    return (
        <footer className="bg-gray-900 text-gray-300 py-12">
            <div className="container-custom">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Contact Information */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold text-lg">
                                연락처 정보
                            </h3>
                            <Link
                                href="/admin/footer/content"
                                className="text-xs text-gray-900 hover:text-primary-blue transition-colors"
                                title="관리자 전용"
                            >
                                수정
                            </Link>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500" aria-hidden="true" />
                                <span><span className="font-medium">대표자:</span>{' '}
                                    {contactInfo.president.name}</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500" aria-hidden="true" />
                                <span><span className="font-medium">대표자 전화:</span>{' '}
                                    <a
                                        href={`tel:${contactInfo.president.phone}`}
                                        className="hover:text-primary-blue transition-colors"
                                    >
                                        {contactInfo.president.phone}
                                    </a>
                                </span>
                            </p>
                            <p className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500" aria-hidden="true" />
                                <span><span className="font-medium">노회 서기:</span>{' '}
                                {contactInfo.secretary.name}
                                </span>
                            </p>
                            <p className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500" aria-hidden="true" />
                                <span><span className="font-medium">서기 전화:</span>{' '}
                                    <a
                                        href={`tel:${contactInfo.secretary.phone}`}
                                        className="hover:text-primary-blue transition-colors"
                                    >
                                        {contactInfo.secretary.phone}
                                    </a>
                                </span>
                            </p>
                            <p className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500" aria-hidden="true" />
                                <span><span className="font-medium">서기 Email:</span>{' '}
                                    <a
                                        href={`mailto:${contactInfo.email}`}
                                        className="hover:text-primary-blue transition-colors"
                                    >
                                        {contactInfo.email}
                                    </a>
                                </span>
                            </p>
                            <p className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500" aria-hidden="true" />
                                <span><span className="font-medium">사무실 주소:</span>{' '}
                                    {contactInfo.address}</span>
                            </p>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">
                            빠른 링크
                        </h3>
                        <ul className="space-y-2 text-sm">
                            {quickLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="hover:text-primary-blue transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Affiliate Links */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">
                            관련 기관
                        </h3>
                        <ul className="space-y-2 text-sm">
                            {affiliateLinks.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary-blue transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>


                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-6 mt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-sm text-center md:text-left">
                            <p className="mb-1">
                                Korean Presbyterian Church, Namkyunggi Senior Association
                            </p>
                            <p className="text-gray-400">
                                COPYRIGHT &copy; 2001 ~ {new Date().getFullYear()}{' '}
                                대한예수교 장로회 남경기노회. All rights reserved.
                            </p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                            <Link
                                href="/privacy"
                                className="hover:text-primary-blue transition-colors"
                            >
                                개인정보보호규칙
                            </Link>
                            <Link
                                href="/email-policy"
                                className="hover:text-primary-blue transition-colors"
                            >
                                E-mail무단수집거부
                            </Link>
                            <div className="w-px h-3 bg-gray-700 mx-2"></div>
                            <AdminLoginLink />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
