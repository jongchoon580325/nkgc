import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/common/ScrollToTop'
import PopupOverlay from '@/components/common/PopupOverlay'
import PWAUpdateToast from '@/components/common/PWAUpdateToast'
import SWDevCleaner from '@/components/common/SWDevCleaner'

const notoSansKr = Noto_Sans_KR({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-noto-sans',
    display: 'swap',
})

export const metadata: Metadata = {
    title: '대한예수교 장로회 남경기노회',
    description:
        '하나님의 은혜와 사랑이 남경기노회 모든 교회와 성도들 안에 풍성하시기를 축복합니다. Living as Christians before the Word of God.',
    keywords: [
        '남경기노회',
        '대한예수교장로회',
        '장로회',
        '노회',
        'Coram Deo',
        '남경기',
    ],
    authors: [{ name: '남경기노회' }],
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: '남경기노회',
    },
    openGraph: {
        title: '대한예수교 장로회 남경기노회',
        description:
            '하나님의 은혜와 사랑이 남경기노회 모든 교회와 성도들 안에 풍성하시기를 축복합니다.',
        type: 'website',
        locale: 'ko_KR',
    },
    icons: {
        icon: '/images/logo.ico',
        apple: '/icons/icon-192.png',
    },
}

import { AuthProvider } from '@/components/auth/AuthProvider'

export const dynamic = 'force-dynamic'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ko" className={notoSansKr.variable} suppressHydrationWarning>
            <body className="antialiased" suppressHydrationWarning>
                <AuthProvider>
                    <PopupOverlay />
                    <Header />
                    {children}
                    <Footer />
                    <ScrollToTop />
                    <PWAUpdateToast />
                    {process.env.NODE_ENV === 'development' && <SWDevCleaner />}
                </AuthProvider>
            </body>
        </html>
    )
}
