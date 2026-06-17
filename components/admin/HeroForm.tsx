'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MediaPickerModal from '@/components/media/MediaPickerModal';

function getYouTubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]{11})/);
    return m ? m[1] : null;
}

function buildYouTubeEmbed(id: string): string {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&modestbranding=1&playsinline=1`;
}

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

interface HeroFormProps {
    initialData?: Partial<HeroFormData>;
    onSubmit: (data: HeroFormData) => Promise<void>;
    submitLabel?: string;
}

const ANIMATION_OPTIONS = [
    { value: 'static', label: '정지 (Static)', description: '애니메이션 없음' },
    { value: 'kenburns', label: '켄번즈 (Ken Burns)', description: '느린 줌인/아웃 효과' },
    { value: 'wave', label: '물결 (Wave)', description: '물결치듯 일렁이는 효과' },
    { value: 'pulse', label: '맥동 (Pulse)', description: '미세하게 숨쉬는 효과' },
    { value: 'pan', label: '패닝 (Pan)', description: '느린 좌우 이동 효과' },
];

const SPEED_OPTIONS = [
    { value: 'slow', label: '느리게', description: '2배 느린 속도' },
    { value: 'normal', label: '보통', description: '기본 속도' },
    { value: 'fast', label: '빠르게', description: '2배 빠른 속도' },
];

const ANIMATION_CLASSES: Record<string, string> = {
    static: '',
    kenburns: 'hero-anim-kenburns',
    wave: 'hero-anim-wave',
    pulse: 'hero-anim-pulse',
    pan: 'hero-anim-pan',
};

const SPEED_CLASSES: Record<string, string> = {
    slow: 'hero-speed-slow',
    normal: 'hero-speed-normal',
    fast: 'hero-speed-fast',
};

const PRESET_COLORS = [
    { hex: '#ffffff', label: '흰색' },
    { hex: '#ffd700', label: '금색' },
    { hex: '#87CEEB', label: '하늘색' },
    { hex: '#ffff99', label: '연노랑' },
    { hex: '#98FB98', label: '연초록' },
    { hex: '#FFB6C1', label: '연분홍' },
    { hex: '#E6E6FA', label: '연보라' },
    { hex: '#FFA500', label: '주황' },
];

const TITLE_ANIMATION_OPTIONS = [
    { value: 'none', label: '없음', desc: '효과 없이 바로 표시' },
    { value: 'fadeInZoom', label: 'FadeIn + ZoomIn', desc: '서서히 나타나며 살짝 커짐' },
    { value: 'glow', label: 'Glow', desc: '발광 반복 효과' },
];

const RECENT_COLORS_KEY = 'heroTitleRecentColors';

export default function HeroForm({ initialData, onSubmit, submitLabel = '저장' }: HeroFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
    const [isVideoPickerOpen, setIsVideoPickerOpen] = useState(false);
    const [recentColors, setRecentColors] = useState<string[]>([]);
    const colorInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_COLORS_KEY);
            if (stored) setRecentColors(JSON.parse(stored));
        } catch {}
    }, []);

    const [formData, setFormData] = useState<HeroFormData>({
        name: initialData?.name || '',
        backgroundImage: initialData?.backgroundImage || '',
        backgroundImageMobile: initialData?.backgroundImageMobile || '',
        backgroundVideo: initialData?.backgroundVideo || '',
        animationType: initialData?.animationType || 'kenburns',
        animationSpeed: initialData?.animationSpeed || 'normal',
        hideText: initialData?.hideText || false,
        titleText: initialData?.titleText || '',
        titleColor: initialData?.titleColor || '#ffffff',
        titleAnimation: initialData?.titleAnimation || 'none',
        subtitleText: initialData?.subtitleText || '',
        motto1: initialData?.motto1 || '',
        motto2: initialData?.motto2 || '',
        motto3: initialData?.motto3 || '',
        descriptionText: initialData?.descriptionText || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const applyTitleColor = (hex: string) => {
        setFormData(prev => ({ ...prev, titleColor: hex }));
        setRecentColors(prev => {
            const next = [hex, ...prev.filter(c => c !== hex)].slice(0, 5);
            try { localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(next)); } catch {}
            return next;
        });
    };

    const handleImageMediaSelect = (assets: any[]) => {
        if (assets.length === 0) return;
        setFormData(prev => ({ ...prev, backgroundImage: assets[0].path }));
    };

    const handleVideoMediaSelect = (assets: any[]) => {
        if (assets.length === 0) return;
        setFormData(prev => ({ ...prev, backgroundVideo: assets[0].path }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('프리셋 이름을 입력해주세요.');
            return;
        }
        setSaving(true);
        try {
            await onSubmit(formData);
        } finally {
            setSaving(false);
        }
    };

    const previewAnimClass = ANIMATION_CLASSES[formData.animationType] || '';
    const previewSpeedClass = SPEED_CLASSES[formData.animationSpeed] || '';

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* 프리셋 이름 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            프리셋 이름 *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="예: 크리스마스 특집, 부활절 시즌"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* 배경 이미지 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            배경 이미지
                        </label>
                        <div className="space-y-2">
                            {formData.backgroundImage && (
                                <div className="relative w-full h-28 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={formData.backgroundImage}
                                        alt="배경 미리보기"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, backgroundImage: '' }))}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsImagePickerOpen(true)}
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-2 text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                미디어 라이브러리에서 선택 (이미지)
                            </button>
                            <p className="text-xs text-gray-400">※ 동영상 배경이 설정되면 이미지 배경은 무시됩니다.</p>
                        </div>
                    </div>

                    {/* 배경 동영상 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            배경 동영상
                            <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">우선 적용</span>
                        </label>
                        <div className="space-y-2">
                            {/* 현재 동영상 미리보기 */}
                            {formData.backgroundVideo && (() => {
                                const ytId = getYouTubeId(formData.backgroundVideo);
                                return (
                                <div className="relative w-full rounded-lg overflow-hidden bg-black">
                                    {ytId ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                            alt="YouTube 썸네일"
                                            className="w-full h-28 object-cover opacity-80"
                                        />
                                    ) : (
                                        <video
                                            src={formData.backgroundVideo}
                                            className="w-full h-28 object-cover opacity-80"
                                            muted
                                            playsInline
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                                            {ytId ? 'YouTube 배경 설정됨' : '동영상 배경 설정됨'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, backgroundVideo: '' }))}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                );
                            })()}

                            {/* 미디어 라이브러리에서 MP4 선택 */}
                            <button
                                type="button"
                                onClick={() => setIsVideoPickerOpen(true)}
                                className="w-full px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition flex items-center justify-center gap-2 text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                미디어 라이브러리에서 선택 (MP4)
                            </button>

                            {/* URL 직접 입력 */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">또는 URL 직접 입력</label>
                                <input
                                    type="text"
                                    name="backgroundVideo"
                                    value={formData.backgroundVideo}
                                    onChange={handleChange}
                                    placeholder="https://example.com/video.mp4 또는 /uploads/video.mp4"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                                />
                            </div>
                            <p className="text-xs text-gray-400">※ MP4 파일 URL 또는 외부 동영상 URL. 자동재생·음소거·반복 재생됩니다.</p>
                        </div>
                    </div>

                    {/* 애니메이션 설정 (이미지 배경 전용) */}
                    {!formData.backgroundVideo && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    애니메이션 효과
                                    <span className="ml-1 text-xs font-normal text-gray-400">(이미지 배경)</span>
                                </label>
                                <select
                                    name="animationType"
                                    value={formData.animationType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {ANIMATION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    애니메이션 속도
                                </label>
                                <select
                                    name="animationSpeed"
                                    value={formData.animationSpeed}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {SPEED_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <hr className="my-4 border-gray-200" />

                    {/* 텍스트 숨기기 */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="hideText"
                            name="hideText"
                            checked={formData.hideText}
                            onChange={handleChange}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="hideText" className="flex-1">
                            <span className="font-semibold text-gray-800">텍스트 숨기기</span>
                            <p className="text-sm text-gray-500">배경만 표시합니다. (CTA 버튼은 유지)</p>
                        </label>
                    </div>

                    {/* 텍스트 설정 */}
                    {!formData.hideText && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800">텍스트 설정</h3>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">타이틀 (H1)</label>
                                <input type="text" name="titleText" value={formData.titleText} onChange={handleChange}
                                    placeholder="예: Coram Deo"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>

                            {/* 타이틀 폰트 컬러 */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-3">타이틀 폰트 컬러</label>

                                {/* 프리셋 색상 */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {PRESET_COLORS.map(({ hex, label }) => (
                                        <button
                                            key={hex}
                                            type="button"
                                            title={label}
                                            onClick={() => applyTitleColor(hex)}
                                            className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                                            style={{
                                                backgroundColor: hex,
                                                borderColor: formData.titleColor === hex ? '#3b82f6' : '#d1d5db',
                                                boxShadow: formData.titleColor === hex ? '0 0 0 2px #3b82f6' : undefined,
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* 최근 사용 색상 */}
                                {recentColors.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-400 mb-1">최근 사용</p>
                                        <div className="flex gap-2">
                                            {recentColors.map(hex => (
                                                <button
                                                    key={hex}
                                                    type="button"
                                                    title={hex}
                                                    onClick={() => applyTitleColor(hex)}
                                                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                                                    style={{
                                                        backgroundColor: hex,
                                                        borderColor: formData.titleColor === hex ? '#3b82f6' : '#e5e7eb',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 사용자 지정 */}
                                <div className="flex items-center gap-3">
                                    <input
                                        ref={colorInputRef}
                                        type="color"
                                        value={formData.titleColor}
                                        onChange={e => applyTitleColor(e.target.value)}
                                        className="sr-only"
                                        aria-hidden
                                    />
                                    <button
                                        type="button"
                                        onClick={() => colorInputRef.current?.click()}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:border-blue-400 transition"
                                    >
                                        <span
                                            className="w-5 h-5 rounded-full border border-gray-300 inline-block"
                                            style={{ backgroundColor: formData.titleColor }}
                                        />
                                        사용자 지정
                                    </button>
                                    <span className="text-xs text-gray-500 font-mono">{formData.titleColor}</span>
                                </div>
                            </div>

                            {/* 타이틀 텍스트 애니메이션 */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-3">타이틀 텍스트 애니메이션</label>
                                <div className="flex flex-col gap-2">
                                    {TITLE_ANIMATION_OPTIONS.map(opt => (
                                        <label
                                            key={opt.value}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                                                formData.titleAnimation === opt.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="titleAnimation"
                                                value={opt.value}
                                                checked={formData.titleAnimation === opt.value}
                                                onChange={handleChange}
                                                className="text-blue-600"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                                                <p className="text-xs text-gray-500">{opt.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">서브타이틀</label>
                                <input type="text" name="subtitleText" value={formData.subtitleText} onChange={handleChange}
                                    placeholder="예: 대한예수교 장로회 남경기노회"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">모토 1</label>
                                <input type="text" name="motto1" value={formData.motto1} onChange={handleChange}
                                    placeholder="예: 1. 우리는 창조주 하나님을 믿습니다."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">모토 2</label>
                                <input type="text" name="motto2" value={formData.motto2} onChange={handleChange}
                                    placeholder="예: 2. 우리는 구세주 예수님을 믿습니다."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">모토 3</label>
                                <input type="text" name="motto3" value={formData.motto3} onChange={handleChange}
                                    placeholder="예: 3. 우리는 보혜사 성령님을 믿습니다."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">설명 (영문)</label>
                                <input type="text" name="descriptionText" value={formData.descriptionText} onChange={handleChange}
                                    placeholder="예: Living as Christians before the Word of God."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex gap-4 pt-4">
                        <button type="submit" disabled={saving}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                            {saving ? '저장 중...' : submitLabel}
                        </button>
                        <button type="button" onClick={() => router.back()}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition">
                            취소
                        </button>
                    </div>
                </form>
            </div>

            {/* Right: Preview */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4">미리보기</h3>
                <div className="relative rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                    <svg className="hidden">
                        <defs>
                            <filter id="hero-wave-filter">
                                <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
                                <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
                            </filter>
                        </defs>
                    </svg>

                    {/* Background: 동영상 > 이미지 > 기본 우선순위 */}
                    {formData.backgroundVideo ? (() => {
                        const ytId = getYouTubeId(formData.backgroundVideo);
                        return (
                        <div className="absolute inset-0 overflow-hidden">
                            {ytId ? (
                                <iframe
                                    key={ytId}
                                    src={buildYouTubeEmbed(ytId)}
                                    allow="autoplay; encrypted-media"
                                    style={{
                                        position: 'absolute',
                                        top: '50%', left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        minWidth: '100%', minHeight: '100%',
                                        width: '177.78vh', height: '56.25vw',
                                        border: 'none', pointerEvents: 'none',
                                    }}
                                />
                            ) : (
                                <video
                                    key={formData.backgroundVideo}
                                    src={formData.backgroundVideo}
                                    autoPlay loop muted playsInline
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 hero-overlay" />
                        </div>
                        );
                    })() : formData.backgroundImage ? (
                        <div className="absolute inset-0">
                            <div
                                className={`absolute inset-0 bg-center ${previewAnimClass} ${previewSpeedClass}`}
                                style={{ backgroundImage: `url(${formData.backgroundImage})`, backgroundSize: '100% 100%' }}
                            />
                            <div className="absolute inset-0 hero-overlay" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 space-bg opacity-80" />
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-center text-center text-white p-8" style={{ minHeight: '400px' }}>
                        <div className="max-w-lg">
                            {!formData.hideText ? (
                                <>
                                    {formData.titleText && (
                                        <h1
                                            className={`text-3xl md:text-4xl font-bold mb-3 ${formData.titleAnimation === 'glow' ? 'hero-text-glow' : ''}`}
                                            style={{ color: formData.titleColor || '#ffffff' }}
                                        >
                                            {formData.titleText}
                                        </h1>
                                    )}
                                    {formData.subtitleText && <p className="text-lg md:text-xl mb-4 opacity-95">{formData.subtitleText}</p>}
                                    <div className="mb-4 space-y-2 text-sm md:text-base">
                                        {formData.motto1 && <p className="font-bold">{formData.motto1}</p>}
                                        {formData.motto2 && <p className="font-bold">{formData.motto2}</p>}
                                        {formData.motto3 && <p className="font-bold">{formData.motto3}</p>}
                                    </div>
                                    {formData.descriptionText && <p className="text-sm opacity-90 italic">{formData.descriptionText}</p>}
                                </>
                            ) : (
                                <p className="text-gray-300 text-sm">텍스트 숨김 모드 (CTA 버튼만 표시)</p>
                            )}
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                    ※ 실제 홈 페이지에서는 더 크게 표시됩니다.
                </p>
            </div>
        </div>

        {/* 이미지 미디어 피커 */}
        <MediaPickerModal
            isOpen={isImagePickerOpen}
            onClose={() => setIsImagePickerOpen(false)}
            onSelect={handleImageMediaSelect}
            selectionMode="single"
            title="배경 이미지 선택"
        />

        {/* 동영상 미디어 피커 */}
        <MediaPickerModal
            isOpen={isVideoPickerOpen}
            onClose={() => setIsVideoPickerOpen(false)}
            onSelect={handleVideoMediaSelect}
            selectionMode="single"
            title="배경 동영상 선택 (MP4)"
        />
        </>
    );
}
