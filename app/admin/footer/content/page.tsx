'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_CONTACT_INFO, ContactInfo, formatPhoneNumber } from '@/lib/contact-info';

export default function FooterContentAdminPage() {
    const [data, setData] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/contact-info');
            if (!response.ok) throw new Error('Failed to load contact info');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Footer contact load failed:', error);
            setData(DEFAULT_CONTACT_INFO);
            alert('연락처 정보 로드에 실패했습니다. 기본값을 표시합니다.');
        } finally {
            setLoading(false);
        }
    };

    const updatePhone = (target: 'president' | 'secretary', value: string) => {
        setData(prev => ({
            ...prev,
            [target]: {
                ...prev[target],
                phone: formatPhoneNumber(value),
            },
        }));
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/contact-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to save contact info');
            const result = await response.json();
            setData(result.data);
            alert('Footer 연락처 정보가 저장되었습니다.');
        } catch (error) {
            console.error('Footer contact save failed:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Footer 연락처 정보를 삭제하고 기본값으로 되돌릴까요?')) return;
        setDeleting(true);

        try {
            const response = await fetch('/api/contact-info', { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete contact info');
            const result = await response.json();
            setData(result.data);
            alert('Footer 연락처 정보가 삭제되어 기본값으로 복원되었습니다.');
        } catch (error) {
            console.error('Footer contact delete failed:', error);
            alert('삭제에 실패했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    const handleReset = () => {
        setData(DEFAULT_CONTACT_INFO);
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse text-gray-600">Footer 연락처 정보를 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Footer 컨텐츠 관리</h1>
                <p className="text-gray-600">Footer 연락처 정보 섹션에 표시되는 내용을 관리합니다.</p>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-md p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className="border border-gray-200 rounded-lg p-5 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">대표자 정보</h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">대표자</label>
                            <input
                                type="text"
                                required
                                value={data.president.name}
                                onChange={(event) =>
                                    setData(prev => ({
                                        ...prev,
                                        president: { ...prev.president, name: event.target.value },
                                    }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="유병구 목사"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">대표자 전화</label>
                            <input
                                type="tel"
                                required
                                value={data.president.phone}
                                onChange={(event) => updatePhone('president', event.target.value)}
                                maxLength={13}
                                inputMode="numeric"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="010-4324-0756"
                            />
                        </div>
                    </section>

                    <section className="border border-gray-200 rounded-lg p-5 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">노회 서기 정보</h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">노회 서기</label>
                            <input
                                type="text"
                                required
                                value={data.secretary.name}
                                onChange={(event) =>
                                    setData(prev => ({
                                        ...prev,
                                        secretary: { ...prev.secretary, name: event.target.value },
                                    }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="문보길 목사"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">서기 전화</label>
                            <input
                                type="tel"
                                required
                                value={data.secretary.phone}
                                onChange={(event) => updatePhone('secretary', event.target.value)}
                                maxLength={13}
                                inputMode="numeric"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="010-9777-1409"
                            />
                        </div>
                    </section>
                </div>

                <section className="border border-gray-200 rounded-lg p-5 space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">사무실 및 이메일</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">서기 Email</label>
                            <input
                                type="email"
                                required
                                value={data.email}
                                onChange={(event) => setData(prev => ({ ...prev, email: event.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="bo-gil71@hanmail.net"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">사무실 주소</label>
                            <input
                                type="text"
                                required
                                value={data.address}
                                onChange={(event) => setData(prev => ({ ...prev, address: event.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                placeholder="경기도 안산시 상록구 광덕산2로 5-1 (월피동)"
                            />
                        </div>
                    </div>
                </section>

                <section className="border border-gray-200 rounded-lg p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Footer 표시 미리보기</h2>
                    <div className="bg-gray-900 text-gray-300 rounded-lg p-5 text-sm space-y-2">
                        <p className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500" /><span><span className="font-medium">대표자:</span> {data.president.name}</span></p>
                        <p className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500" /><span><span className="font-medium">대표자 전화:</span> {data.president.phone}</span></p>
                        <p className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500" /><span><span className="font-medium">노회 서기:</span> {data.secretary.name}</span></p>
                        <p className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500" /><span><span className="font-medium">서기 전화:</span> {data.secretary.phone}</span></p>
                        <p className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500" /><span><span className="font-medium">서기 Email:</span> {data.email}</span></p>
                        <p className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-500" /><span><span className="font-medium">사무실 주소:</span> {data.address}</span></p>
                    </div>
                </section>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving || deleting}
                        className="px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? '저장 중...' : '저장'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={saving || deleting}
                        className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        기본값 불러오기
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={saving || deleting}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {deleting ? '삭제 중...' : '삭제'}
                    </button>
                </div>
            </form>
        </div>
    );
}
