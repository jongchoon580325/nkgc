'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { MENU_ITEMS } from '@/lib/menu-constants';
import NotificationModal from '@/components/common/NotificationModal';

export default function MenuManagementPage() {
    const [visibility, setVisibility] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'alert' | 'confirm';
    }>({ isOpen: false, title: '', message: '', type: 'alert' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/system/menu');
            const data = await res.json();
            if (data.visibility) {
                setVisibility(data.visibility);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: string) => {
        setVisibility(prev => ({
            ...prev,
            [key]: prev[key] === undefined ? false : !prev[key]
        }));
    };

    // Helper to check if a menu item is visible (default true if not set)
    const isVisible = (key: string) => visibility[key] !== false;

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/system/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visibility }),
            });

            if (!res.ok) throw new Error('Failed to save');

            setNotification({
                isOpen: true,
                title: '저장 완료',
                message: '메뉴 설정이 성공적으로 저장되었습니다.',
                type: 'alert'
            });
        } catch (error) {
            console.error('Error saving:', error);
            setNotification({
                isOpen: true,
                title: '저장 실패',
                message: '저장 중 오류가 발생했습니다.',
                type: 'alert'
            });
        } finally {
            setSaving(false);
        }
    };

    const renderMenuItem = (item: any, parentKey: string = '') => {
        // Use href or label as unique key. Href is safer but label works for headers.
        // Let's use a composite key for submenus: ParentLabel > ChildLabel
        const currentKey = parentKey ? `${parentKey} > ${item.label}` : item.label;
        const visible = isVisible(currentKey);

        return (
            <div key={currentKey} className="border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <span className={`font-medium ${parentKey ? 'text-sm text-gray-600 pl-4 border-l-2 border-gray-200' : 'text-gray-900'}`}>
                            {item.label}
                        </span>
                        <span className="text-xs text-gray-400 font-mono hidden sm:inline-block">({item.href})</span>
                    </div>
                    <div>
                        <button
                            onClick={() => handleToggle(currentKey)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${visible ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${visible ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>
                </div>
                {/* Recursively render submenus */}
                {item.submenu && item.submenu.length > 0 && (
                    <div className="bg-gray-50/50">
                        {item.submenu.map((sub: any) => renderMenuItem(sub, item.label))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <PageHeader title="메뉴 관리" description="홈페이지 상단 메뉴의 보임/숨김 처리를 관리합니다." />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">전체 메뉴 목록</h3>
                    <div className="text-sm text-gray-500">
                        * 관리자는 모든 메뉴가 항상 보입니다.
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {MENU_ITEMS.map(item => renderMenuItem(item))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                    {saving ? '저장 중...' : '설정 저장하기'}
                </button>
            </div>

            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                message={notification.message}
                type={notification.type}
            />
        </div>
    );
}
