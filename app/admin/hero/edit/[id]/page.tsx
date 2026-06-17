'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HeroForm from '@/components/admin/HeroForm';

interface HeroFormData {
    name: string;
    backgroundImage: string;
    backgroundImageMobile: string;
    backgroundVideo: string;
    animationType: string;
    animationSpeed: string;
    hideText: boolean;
    titleText: string;
    titleColor: string;
    titleAnimation: string;
    subtitleText: string;
    motto1: string;
    motto2: string;
    motto3: string;
    descriptionText: string;
}

interface HeroConfig extends HeroFormData {
    id: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function EditHeroPresetPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [config, setConfig] = useState<HeroConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // 전체 목록에서 해당 ID 찾기
                const res = await fetch('/api/hero-config');
                if (res.ok) {
                    const configs = await res.json();
                    const found = configs.find((c: HeroConfig) => c.id === parseInt(id));
                    if (found) {
                        setConfig(found);
                    } else {
                        alert('프리셋을 찾을 수 없습니다.');
                        router.push('/admin/hero');
                    }
                }
            } catch (error) {
                console.error('Error fetching config:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchConfig();
        }
    }, [id, router]);

    const handleSubmit = async (data: HeroFormData) => {
        try {
            const res = await fetch(`/api/hero-config/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                alert('프리셋이 수정되었습니다.');
                router.push('/admin/hero');
            } else {
                const errorData = await res.json();
                alert(errorData.error || '프리셋 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error updating preset:', error);
            alert('프리셋 수정 중 오류가 발생했습니다.');
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">로딩 중...</div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="p-8">
                <p className="text-red-500">프리셋을 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">프리셋 수정</h1>
                <p className="text-gray-600">
                    &quot;{config.name}&quot; 프리셋을 수정합니다.
                    {config.isActive && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            ⭐ 활성화됨
                        </span>
                    )}
                </p>
            </div>

            <HeroForm
                initialData={{
                    name: config.name,
                    backgroundImage: config.backgroundImage || '',
                    backgroundImageMobile: config.backgroundImageMobile || '',
                    backgroundVideo: config.backgroundVideo || '',
                    animationType: config.animationType || 'static',
                    animationSpeed: config.animationSpeed || 'normal',
                    hideText: config.hideText || false,
                    titleText: config.titleText || '',
                    titleColor: config.titleColor || '#ffffff',
                    titleAnimation: config.titleAnimation || 'none',
                    subtitleText: config.subtitleText || '',
                    motto1: config.motto1 || '',
                    motto2: config.motto2 || '',
                    motto3: config.motto3 || '',
                    descriptionText: config.descriptionText || '',
                }}
                onSubmit={handleSubmit}
                submitLabel="수정 저장"
            />
        </div>
    );
}
