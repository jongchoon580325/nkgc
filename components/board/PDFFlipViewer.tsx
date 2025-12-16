'use client';

import './polyfill'; // Must be imported before react-pdf
import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import HTMLFlipBook from 'react-pageflip';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker 설정
// pdfjs.version이 올바르게 로드되지 않을 경우를 대비해 하드코딩된 버전 사용 가능성 열어둠
const PDFJS_VERSION = pdfjs.version || '4.4.168';

interface PDFFlipViewerProps {
    fileUrl: string;
    title?: string;
    onClose: () => void;
}

export default function PDFFlipViewer({ fileUrl, title, onClose }: PDFFlipViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [width, setWidth] = useState(400); // Base width calculated from viewport
    const [scale, setScale] = useState(1);   // Zoom level
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 클라이언트 사이드에서만 워커 설정
        if (typeof window !== 'undefined') {
            try {
                // unpkg CDN 사용
                pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
            } catch (e) {
                console.error('PDF Worker setup failed:', e);
            }
        }
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    // 반응형 크기 조절
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                // 화면 크기에 따라 적절한 너비 계산 (모바일 고려)
                const containerWidth = containerRef.current.clientWidth;
                const windowHeight = window.innerHeight;

                // 상하단 여백 및 헤더/푸터 공간 확보 (약 180px)
                const availableHeight = windowHeight - 180;
                // 모바일은 너비 95%, 데스크탑은 여유있게
                const availableWidth = containerWidth * (window.innerWidth < 768 ? 0.95 : 0.8);

                // A4 비율 (1 : 1.414) 기준으로 높이에 맞춘 너비 계산
                const widthBasedOnHeight = availableHeight / 1.414;

                // 너비와 높이 제약 중 더 작은 쪽을 선택하여 잘리지 않게 함
                const finalWidth = Math.min(availableWidth, widthBasedOnHeight);

                setWidth(finalWidth);
            }
        };

        window.addEventListener('resize', updateSize);
        // 약간의 지연 후 초기 계산 (모달 렌더링 직후 레이아웃 잡힐 시간 확보)
        setTimeout(updateSize, 100);

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleZoomChange = (value: string) => {
        const num = parseInt(value);
        if (!isNaN(num) && num >= 50 && num <= 200) {
            setScale(num / 100);
        }
    };

    const currentWidth = width * scale;
    const currentHeight = currentWidth * 1.414;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
            {/* Header - Unified Design */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/50">
                <div className="w-10" /> {/* Spacer for centering */}
                <h2 className="text-white text-xl font-bold text-center flex-1">
                    {title || '자료 뷰어'}
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

            {/* Viewer Container */}
            <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto py-4 px-8">
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="text-white animate-pulse">문서를 불러오는 중...</div>}
                    error={<div className="text-red-400">문서를 불러오는데 실패했습니다.</div>}
                    className="flex justify-center"
                >
                    {numPages > 0 && (
                        // @ts-ignore
                        <HTMLFlipBook
                            width={currentWidth}
                            height={currentHeight}
                            size="fixed"
                            minWidth={200}
                            maxWidth={2000}
                            minHeight={300}
                            maxHeight={2500}
                            maxShadowOpacity={0.5}
                            showCover={true}
                            mobileScrollSupport={true}
                            className={`demo-book transition-transform duration-300`}
                        >
                            {Array.from(new Array(numPages), (el, index) => (
                                <div key={`page_${index + 1}`} className="bg-white shadow-lg overflow-hidden">
                                    <Page
                                        pageNumber={index + 1}
                                        width={currentWidth}
                                        renderAnnotationLayer={false}
                                        renderTextLayer={false}
                                        loading=""
                                    />
                                    <div className="absolute bottom-2 w-full text-center text-[10px] text-gray-400">
                                        - {index + 1} -
                                    </div>
                                </div>
                            ))}
                        </HTMLFlipBook>
                    )}
                </Document>
            </div>

            {/* Footer Controls - Unified Design */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/50">
                {/* Pagination */}
                <div className="text-white text-sm min-w-[100px]">
                    {numPages > 0 ? `${numPages} 페이지` : '로딩 중...'}
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

                {/* Placeholder for navigation (PDF uses drag/click) */}
                <div className="text-white text-sm min-w-[100px] text-right opacity-60">
                    드래그로 넘김
                </div>
            </div>

            {/* Instructions */}
            <div className="text-center text-white/60 text-xs pb-2">
                좌우로 드래그하거나 클릭하여 페이지를 넘길 수 있습니다.
            </div>
        </div>
    );
}
