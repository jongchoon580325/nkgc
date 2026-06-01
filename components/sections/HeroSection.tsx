'use client';

import { useEffect, useState } from 'react';

interface HeroConfig {
    id: number;
    name: string;
    isActive: boolean;
    backgroundImage: string | null;
    backgroundImageMobile: string | null;
    animationType: string;
    animationSpeed: string;
    hideText: boolean;
    titleText: string | null;
    subtitleText: string | null;
    motto1: string | null;
    motto2: string | null;
    motto3: string | null;
    descriptionText: string | null;
}

// 애니메이션 타입에 따른 CSS 클래스 매핑
const ANIMATION_CLASSES: Record<string, string> = {
    static: '',
    kenburns: 'hero-anim-kenburns',
    wave: 'hero-anim-wave',
    pulse: 'hero-anim-pulse',
    pan: 'hero-anim-pan',
};

// 속도 CSS 클래스 매핑
const SPEED_CLASSES: Record<string, string> = {
    slow: 'hero-speed-slow',
    normal: 'hero-speed-normal',
    fast: 'hero-speed-fast',
};

export default function HeroSection() {
    const [config, setConfig] = useState<HeroConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveConfig = async () => {
            try {
                const res = await fetch('/api/hero-config/active');
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);
                }
            } catch (error) {
                console.error('Error fetching hero config:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveConfig();
    }, []);

    // 텍스트 표시 여부
    const showText = !config?.hideText;

    // 배경 이미지와 애니메이션 클래스 결정
    const hasCustomBackground = config?.backgroundImage;
    const animationClass = hasCustomBackground
        ? ANIMATION_CLASSES[config?.animationType || 'static'] || ''
        : '';
    const speedClass = hasCustomBackground
        ? SPEED_CLASSES[config?.animationSpeed || 'normal'] || ''
        : '';

    return (
        <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
            {/* SVG Filter for Wave Effect */}
            <svg className="hidden">
                <defs>
                    <filter id="hero-wave-filter">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.01"
                            numOctaves="3"
                            result="noise"
                        >
                            <animate
                                attributeName="baseFrequency"
                                dur="30s"
                                values="0.01;0.02;0.01"
                                repeatCount="indefinite"
                            />
                        </feTurbulence>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="noise"
                            scale="10"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>

            {/* Background Layer */}
            {hasCustomBackground ? (
                /* Custom Background Image with Animation */
                <div className="absolute inset-0">
                    <div
                        className={`absolute inset-0 bg-center ${animationClass} ${speedClass}`}
                        style={{
                            backgroundImage: `url(${config?.backgroundImage})`,
                            backgroundSize: '100% 100%',
                        }}
                    />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 hero-overlay" />
                </div>
            ) : (
                /* Default Space Animation Background */
                <div className="absolute inset-0 space-bg opacity-80" />
            )}

            {/* Content */}
            <div className="relative z-10 container-custom text-center text-white px-4 h-full flex flex-col justify-center">
                <div className="max-w-4xl mx-auto mb-32">
                    {/* Text Content - Only show if not hidden */}
                    {showText && (
                        <>
                            {/* Main Slogan */}
                            {config?.titleText && (
                                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
                                    {config.titleText}
                                </h1>
                            )}

                            {/* Organization Name */}
                            {config?.subtitleText && (
                                <p className="text-xl md:text-2xl lg:text-3xl font-semibold mb-8 opacity-95">
                                    {config.subtitleText}
                                </p>
                            )}

                            {/* Motto */}
                            {(config?.motto1 || config?.motto2 || config?.motto3) && (
                                <div className="mb-8 space-y-4 text-lg md:text-xl lg:text-2xl leading-relaxed max-w-3xl mx-auto">
                                    {config?.motto1 && <p className="font-bold text-white">{config.motto1}</p>}
                                    {config?.motto2 && <p className="font-bold text-white">{config.motto2}</p>}
                                    {config?.motto3 && <p className="font-bold text-white">{config.motto3}</p>}
                                </div>
                            )}

                            {/* Subtitle */}
                            {config?.descriptionText && (
                                <div className="mb-10 text-base md:text-lg opacity-90">
                                    <p className="italic">{config.descriptionText}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Call to Action Buttons (Moved to Bottom) */}
            <div className="absolute bottom-[140px] left-0 right-0 z-20 px-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="/board/FORM_ADMIN"
                        className="px-8 py-4 bg-white text-brand-700 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        노회 행정 서식 다운로드
                    </a>
                    <a
                        href="/board/NOTICE"
                        className="px-8 py-4 bg-accent-500 text-white rounded-lg font-semibold text-lg hover:bg-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-2 border-white/30"
                    >
                        최신 노회 공지 확인
                    </a>
                </div>
            </div>

            {/* Decorative Bottom Wave */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
                <svg
                    viewBox="0 0 1440 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto"
                >
                    <path
                        d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
                        fill="white"
                    />
                </svg>
            </div>
        </section>
    );
}
