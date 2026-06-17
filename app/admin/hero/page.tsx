'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MarqueeItem { name: string; url: string; }

interface HeroConfig {
    id: number;
    name: string;
    isActive: boolean;
    backgroundImage: string | null;
    backgroundImageMobile: string | null;
    animationType: string;
    createdAt: string;
    updatedAt: string;
}

export default function HeroAdminPage() {
    const router = useRouter();
    const [configs, setConfigs] = useState<HeroConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // 마퀴 상태
    const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([]);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [marqueeSaving, setMarqueeSaving] = useState(false);

    useEffect(() => {
        fetchConfigs();
        fetch('/api/admin/hero/marquee')
            .then(r => r.json())
            .then(d => setMarqueeItems(d.items || []))
            .catch(() => {});
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/hero-config');
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            }
        } catch (error) {
            console.error('Error fetching configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id: number) => {
        if (!confirm('이 프리셋을 활성화하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/hero-config/${id}/activate`, {
                method: 'POST',
            });

            if (res.ok) {
                await fetchConfigs(); // 목록 새로고침
                alert('프리셋이 활성화되었습니다.');
            }
        } catch (error) {
            console.error('Error activating config:', error);
            alert('활성화에 실패했습니다.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('이 프리셋을 삭제하시겠습니까? (복구할 수 없습니다)')) return;

        try {
            const res = await fetch(`/api/hero-config/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await fetchConfigs();
                alert('프리셋이 삭제되었습니다.');
            } else {
                const data = await res.json();
                alert(data.error || '삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error deleting config:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const saveMarquee = async (items: MarqueeItem[]) => {
        setMarqueeSaving(true);
        try {
            await fetch('/api/admin/hero/marquee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            setMarqueeItems(items);
        } finally {
            setMarqueeSaving(false);
        }
    };

    const addMarqueeItem = async () => {
        if (!newName.trim() || !newUrl.trim()) return;
        if (marqueeItems.length >= 7) { alert('최대 7개까지 등록 가능합니다.'); return; }
        const updated = [...marqueeItems, { name: newName.trim(), url: newUrl.trim() }];
        await saveMarquee(updated);
        setNewName(''); setNewUrl('');
    };

    const removeMarqueeItem = (idx: number) =>
        saveMarquee(marqueeItems.filter((_, i) => i !== idx));

    const moveMarqueeItem = (idx: number, dir: -1 | 1) => {
        const arr = [...marqueeItems];
        const target = idx + dir;
        if (target < 0 || target >= arr.length) return;
        [arr[idx], arr[target]] = [arr[target], arr[idx]];
        saveMarquee(arr);
    };

    const handleCreateNew = () => {
        if (configs.length >= 5) {
            alert('최대 5개의 프리셋만 생성할 수 있습니다.');
            return;
        }
        router.push('/admin/hero/new');
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">히어로 섹션 관리</h1>
                <p className="text-gray-600">
                    홈 페이지 상단 배너를 관리합니다. 최대 5개의 프리셋을 저장할 수 있습니다.
                </p>
            </div>

            <div className="mb-6">
                <button
                    onClick={handleCreateNew}
                    disabled={configs.length >= 5}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                    + 새 프리셋 만들기 ({configs.length}/5)
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {configs.map((config) => (
                    <div
                        key={config.id}
                        className={`bg-white rounded-xl p-6 border-2 ${config.isActive ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                {/* 썸네일 */}
                                <div className="w-32 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                    {config.backgroundImage ? (
                                        <img
                                            src={config.backgroundImage}
                                            alt={config.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                {/* 정보 */}
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{config.name}</h3>
                                    <div className="flex items-center gap-2">
                                        {config.isActive && (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                                                ⭐ 활성화됨
                                            </span>
                                        )}
                                        <span className="text-sm text-gray-500">
                                            애니메이션: {config.animationType}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 버튼 그룹 */}
                            <div className="flex gap-2">
                                <Link
                                    href={`/admin/hero/edit/${config.id}`}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                                >
                                    편집
                                </Link>
                                {!config.isActive && (
                                    <button
                                        onClick={() => handleActivate(config.id)}
                                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
                                    >
                                        활성화
                                    </button>
                                )}
                                {!config.isActive && (
                                    <button
                                        onClick={() => handleDelete(config.id)}
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="text-sm text-gray-500">
                            생성일: {new Date(config.createdAt).toLocaleDateString('ko-KR')}{' '}
                            | 수정일: {new Date(config.updatedAt).toLocaleDateString('ko-KR')}
                        </div>
                    </div>
                ))}

                {configs.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">아직 프리셋이 없습니다.</p>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            첫 번째 프리셋 만들기
                        </button>
                    </div>
                )}
            </div>

            {/* ── 마퀴 배너 관리 ── */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-2">마퀴 배너 관리</h2>
                <p className="text-gray-500 text-sm mb-6">
                    Hero 하단에 무한 흐르는 링크 배너입니다. 최대 7개 · 0개이면 미노출.
                </p>

                {/* 등록된 아이템 목록 */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                    {marqueeItems.length === 0 ? (
                        <p className="text-center text-gray-400 py-10 text-sm">등록된 배너 항목이 없습니다.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium w-8">#</th>
                                    <th className="px-4 py-3 text-left font-medium">이름</th>
                                    <th className="px-4 py-3 text-left font-medium">URL</th>
                                    <th className="px-4 py-3 text-center font-medium w-28">순서</th>
                                    <th className="px-4 py-3 text-center font-medium w-16">삭제</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {marqueeItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                        <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                className="hover:text-blue-600 hover:underline">{item.url}</a>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button type="button" onClick={() => moveMarqueeItem(idx, -1)}
                                                    disabled={idx === 0 || marqueeSaving}
                                                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                </button>
                                                <button type="button" onClick={() => moveMarqueeItem(idx, 1)}
                                                    disabled={idx === marqueeItems.length - 1 || marqueeSaving}
                                                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button type="button" onClick={() => removeMarqueeItem(idx)}
                                                disabled={marqueeSaving}
                                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 새 항목 추가 폼 */}
                {marqueeItems.length < 7 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            새 항목 추가 ({marqueeItems.length}/7)
                        </h3>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">이름</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="예: 대한예수교장로회총회"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onKeyDown={e => e.key === 'Enter' && addMarqueeItem()}
                                />
                            </div>
                            <div className="flex-[2]">
                                <label className="block text-xs text-gray-500 mb-1">URL</label>
                                <input
                                    type="text"
                                    value={newUrl}
                                    onChange={e => setNewUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onKeyDown={e => e.key === 'Enter' && addMarqueeItem()}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addMarqueeItem}
                                disabled={marqueeSaving || !newName.trim() || !newUrl.trim()}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                            >
                                {marqueeSaving ? '저장 중...' : '추가'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 미리보기 */}
                {marqueeItems.length > 0 && (
                    <div className="mt-6">
                        <p className="text-xs text-gray-400 mb-2">미리보기</p>
                        <div className="bg-white rounded-xl border border-gray-200 py-4 overflow-hidden">
                            <div className="flex flex-wrap gap-[18px] px-4">
                                {marqueeItems.map((item, i) => (
                                    <span key={i}
                                        className="inline-flex items-center px-5 py-2 rounded-2xl text-sm font-medium text-gray-700"
                                        style={{ backgroundColor: '#dbd9d9', border: '1px solid #b5b3b3' }}>
                                        {item.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
