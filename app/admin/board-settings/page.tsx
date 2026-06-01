'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { BOARD_CONFIG } from '@/lib/board-config';

interface BoardSetting {
    id: number;
    boardType: string;
    categories: string[];
    createdAt: string;
    updatedAt: string;
}

export default function BoardSettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [selectedBoard, setSelectedBoard] = useState('FORM_ADMIN');
    const [categories, setCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const userRole = session?.user?.role;

        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (userRole !== 'admin' && userRole !== 'ADMIN') {
            router.push('/');
        }
    }, [session, status, router]);

    useEffect(() => {
        if (selectedBoard) {
            fetchBoardSettings();
        }
    }, [selectedBoard]);

    const fetchBoardSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/board-settings/${selectedBoard}`);
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Error fetching board settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = () => {
        if (!newCategory.trim()) {
            alert('카테고리 이름을 입력하세요.');
            return;
        }

        if (categories.includes(newCategory.trim())) {
            alert('이미 존재하는 카테고리입니다.');
            return;
        }

        setCategories([...categories, newCategory.trim()]);
        setNewCategory('');
    };

    const handleRemoveCategory = (categoryToRemove: string) => {
        if (!confirm(`"${categoryToRemove}" 카테고리를 삭제하시겠습니까?`)) {
            return;
        }
        setCategories(categories.filter(c => c !== categoryToRemove));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/board-settings/${selectedBoard}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories }),
            });

            if (res.ok) {
                alert('저장되었습니다.');
            } else {
                const data = await res.json();
                alert(data.error || '저장 실패');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    const userRole = session?.user?.role;
    if (userRole !== 'admin' && userRole !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">권한 확인</h2>
                    <p className="text-gray-600 mb-2">현재 역할: {userRole || '없음'}</p>
                    <p className="text-gray-600">관리자 권한이 필요합니다.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="게시판 설정" />

            <div className="container mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* 게시판 선택 */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium mb-2">
                            게시판 선택
                        </label>
                        <select
                            value={selectedBoard}
                            onChange={(e) => setSelectedBoard(e.target.value)}
                            className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2"
                        >
                            {Object.entries(BOARD_CONFIG).map(([key, config]) => (
                                <option key={key} value={key}>
                                    {config.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <hr className="my-6" />

                    {/* 카테고리 관리 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">카테고리 관리</h3>

                        {loading ? (
                            <p className="text-gray-500">로딩 중...</p>
                        ) : (
                            <>
                                {/* 기존 카테고리 목록 */}
                                <div className="mb-6">
                                    <p className="text-sm text-gray-600 mb-3">
                                        현재 카테고리 ({categories.length}개)
                                    </p>
                                    {categories.length === 0 ? (
                                        <p className="text-gray-400 text-sm">
                                            등록된 카테고리가 없습니다.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((category) => (
                                                <div
                                                    key={category}
                                                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg"
                                                >
                                                    <span>{category}</span>
                                                    <button
                                                        onClick={() => handleRemoveCategory(category)}
                                                        className="text-blue-600 hover:text-blue-900 font-bold"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 새 카테고리 추가 */}
                                <div className="mb-6">
                                    <p className="text-sm text-gray-600 mb-2">
                                        새 카테고리 추가
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                                            placeholder="카테고리 이름 입력"
                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                                        />
                                        <button
                                            onClick={handleAddCategory}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            추가
                                        </button>
                                    </div>
                                </div>

                                {/* 저장 버튼 */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {saving ? '저장 중...' : '저장'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
