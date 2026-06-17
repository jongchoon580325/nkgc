'use client';

import { useRouter } from 'next/navigation';
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

export default function NewHeroPresetPage() {
    const router = useRouter();

    const handleSubmit = async (data: HeroFormData) => {
        try {
            const res = await fetch('/api/hero-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                alert('프리셋이 생성되었습니다.');
                router.push('/admin/hero');
            } else {
                const errorData = await res.json();
                alert(errorData.error || '프리셋 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error creating preset:', error);
            alert('프리셋 생성 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">새 프리셋 만들기</h1>
                <p className="text-gray-600">
                    히어로 섹션에 적용할 새로운 프리셋을 만듭니다.
                </p>
            </div>

            <HeroForm onSubmit={handleSubmit} submitLabel="프리셋 생성" />
        </div>
    );
}
