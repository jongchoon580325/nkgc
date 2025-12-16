'use client';

import { useCallback, useEffect, useRef, useState, forwardRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import react-pageflip to avoid SSR issues
const HTMLFlipBook = dynamic(
    () => import('react-pageflip').then(mod => mod.default as any),
    { ssr: false }
);

interface ImageFlipViewerProps {
    images: string[];
    title?: string;
    onClose: () => void;
}

// Page component for HTMLFlipBook (must use forwardRef)
const Page = forwardRef<HTMLDivElement, { imageUrl: string; index: number }>(
    ({ imageUrl, index }, ref) => {
        return (
            <div ref={ref} className="bg-white w-full h-full">
                <img
                    src={imageUrl}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-contain"
                />
            </div>
        );
    }
);
Page.displayName = 'Page';

export default function ImageFlipViewer({ images, title, onClose }: ImageFlipViewerProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [scale, setScale] = useState(1);
    const flipBookRef = useRef<any>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                flipBookRef.current?.pageFlip()?.flipPrev();
            } else if (e.key === 'ArrowRight') {
                flipBookRef.current?.pageFlip()?.flipNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const onPageChange = useCallback((e: any) => {
        setCurrentPage(e.data);
    }, []);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleZoomChange = (value: string) => {
        const num = parseInt(value);
        if (!isNaN(num) && num >= 50 && num <= 200) {
            setScale(num / 100);
        }
    };

    if (!images || images.length === 0) {
        return null;
    }

    const baseWidth = 400;
    const baseHeight = 560;
    const currentWidth = baseWidth * scale;
    const currentHeight = baseHeight * scale;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Header - Unified Design */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/50">
                <div className="w-10" /> {/* Spacer for centering */}
                <h2 className="text-white text-xl font-bold text-center flex-1">
                    {title || '이미지 뷰어'}
                </h2>
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                    aria-label="닫기"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Flip Book Container */}
            <div className="flex-1 flex items-center justify-center overflow-auto py-4 px-8">
                {isClient && (
                    // @ts-ignore - react-pageflip has incomplete TypeScript definitions
                    <HTMLFlipBook
                        ref={flipBookRef}
                        width={currentWidth}
                        height={currentHeight}
                        size="fixed"
                        showCover={true}
                        mobileScrollSupport={true}
                        onFlip={onPageChange}
                        className="shadow-2xl"
                        style={{ margin: 'auto' }}
                        startPage={0}
                        drawShadow={true}
                        flippingTime={600}
                        usePortrait={true}
                        startZIndex={0}
                        autoSize={false}
                        maxShadowOpacity={0.5}
                        showPageCorners={true}
                        disableFlipByClick={false}
                    >
                        {images.map((imageUrl, index) => (
                            <Page key={index} imageUrl={imageUrl} index={index} />
                        ))}
                    </HTMLFlipBook>
                )}
            </div>

            {/* Footer Controls - Unified Design */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/50">
                {/* Pagination */}
                <div className="text-white text-sm min-w-[100px]">
                    {currentPage + 1} / {images.length} 페이지
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center bg-gray-800 rounded-lg p-1 gap-1">
                    <button
                        onClick={handleZoomOut}
                        className="p-2 hover:bg-gray-700 rounded text-white disabled:opacity-30"
                        disabled={scale <= 0.5}
                        title="축소"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <input
                        type="number"
                        min="50"
                        max="200"
                        step="10"
                        value={Math.round(scale * 100)}
                        onChange={(e) => handleZoomChange(e.target.value)}
                        className="w-14 text-center bg-gray-700 text-white text-sm rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <span className="text-white text-sm">%</span>
                    <button
                        onClick={handleZoomIn}
                        className="p-2 hover:bg-gray-700 rounded text-white disabled:opacity-30"
                        disabled={scale >= 2.0}
                        title="확대"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex gap-2 min-w-[100px] justify-end">
                    <button
                        onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()}
                        disabled={currentPage === 0}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    >
                        ← 이전
                    </button>
                    <button
                        onClick={() => flipBookRef.current?.pageFlip()?.flipNext()}
                        disabled={currentPage >= images.length - 1}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    >
                        다음 →
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div className="text-center text-white/60 text-xs pb-2">
                키보드 ← → 또는 클릭으로 페이지 넘김 | ESC 닫기
            </div>
        </div>
    );
}
