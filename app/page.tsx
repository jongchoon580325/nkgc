import NoticeBar from '@/components/sections/NoticeBar'
import HeroSection from '@/components/sections/HeroSection'
import HeroMarquee from '@/components/sections/HeroMarquee'
import QuickActions from '@/components/sections/QuickActions'
import NoticeNews from '@/components/sections/NoticeNews'
import Gallery from '@/components/sections/Gallery'
import AffiliateLinks from '@/components/sections/AffiliateLinks'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    // 최신 게시글 가져오기 (노회공지, 정회원게시판, 자유게시판)
    const notices = await prisma.post.findMany({
        where: {
            boardType: { in: ['NOTICE', 'MEMBER', 'FREE'] },
        },
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: {
            author: {
                select: { name: true }
            }
        },
    });

    const formattedNotices = notices.map((notice: any) => ({
        ...notice,
        createdAt: notice.createdAt.toISOString(),
    }));

    return (
        <main className="min-h-screen">
            {/* Notice Bar */}
            <NoticeBar />

            {/* 1단: Coram Deo */}
            <HeroSection />

            {/* 마퀴 배너 (아이템 없으면 미노출) */}
            <HeroMarquee />

            {/* 2단: 주요 서비스 */}
            <QuickActions />

            {/* 3단: 노회공지&소식 */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom">
                    <NoticeNews initialNotices={formattedNotices} />
                </div>
            </section>

            {/* 4단: Photo Gallery */}
            <Gallery />

            {/* 5단: 관련기관 */}
            <AffiliateLinks />
        </main>
    )
}
