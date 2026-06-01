
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { BOARD_CONFIG, BOARD_TYPES } from '@/lib/board-config';

export default function AdminBoardsPage() {
    interface BoardStat {
        type: string;
        count: number;
    }
    const [stats, setStats] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // We need an endpoint for this, or just fetch count loop? 
            // Loop might be slow but OK for admin.
            // Better: Create /api/admin/board-stats endpoint.
            // For now, let's fetch individual counts in parallel.
            const types = Object.keys(BOARD_CONFIG);
            const counts: Record<string, number> = {};

            await Promise.all(types.map(async (type) => {
                const res = await fetch(`/api/posts?type=${type}&limit=1`);
                const data = await res.json();
                counts[type] = data.total || 0;
            }));

            setStats(counts);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader title="게시글 관리" />

            <div className="container mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-xl font-bold mb-6">게시판 목록</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(BOARD_CONFIG).map(([type, config]) => (
                            <div key={type} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-gray-800">{config.title}</h3>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                        {type}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-4 h-10 line-clamp-2">
                                    {config.description}
                                </p>
                                <div className="flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="text-gray-500">총 게시글:</span>
                                        <span className="ml-2 font-bold text-lg text-gray-900">
                                            {loading ? '...' : (stats[type] || 0)}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/board/${type}`}
                                        className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        관리하기
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
