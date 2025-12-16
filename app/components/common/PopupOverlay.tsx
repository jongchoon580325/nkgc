'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Popup {
    id: number;
    title: string;
    contentHtml?: string;
    imageUrl?: string;
    linkUrl?: string;
    width?: number;
    height?: number;
    positionX?: number | null;
    positionY?: number | null;
}

export default function PopupOverlay() {
    const [popups, setPopups] = useState<Popup[]>([]);
    const [isMobile, setIsMobile] = useState(true); // Default to mobile for safety, will be updated client-side

    useEffect(() => {
        // Check window size and set up listener
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile(); // Initial check
        window.addEventListener('resize', checkMobile);

        const fetchPopups = async () => {
            try {
                const res = await fetch('/api/admin/popup?active=true');
                const data = await res.json();

                if (data.popups) {
                    // Filter out hidden popups from localStorage
                    // Key format: HIDE_POPUP_{id}_{dateString} (e.g. HIDE_POPUP_1_2023-12-25)
                    const today = new Date().toISOString().split('T')[0];
                    const visiblePopups = data.popups.filter((p: Popup) => {
                        const hideKey = `HIDE_POPUP_${p.id}_${today}`;
                        return !localStorage.getItem(hideKey);
                    });
                    setPopups(visiblePopups);
                }
            } catch (error) {
                console.error('Failed to load popups', error);
            }
        };

        fetchPopups();

        return () => window.removeEventListener('resize', checkMobile); // Cleanup
    }, []);

    const handleClose = (id: number, doNotShowToday: boolean) => {
        if (doNotShowToday) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`HIDE_POPUP_${id}_${today}`, 'true');
        }
        setPopups(prev => prev.filter(p => p.id !== id));
    };

    if (popups.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {popups.map((popup) => {
                const hasCustomPos = popup.positionX !== null && popup.positionY !== null && popup.positionX !== undefined && popup.positionY !== undefined;

                // Positioning Logic
                // Mobile: Always Center
                // Desktop + No Pos: Center
                // Desktop + Pos: Absolute X/Y
                const isCenter = isMobile || !hasCustomPos;

                const positionStyle: React.CSSProperties = isCenter
                    ? {
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                    }
                    : {
                        top: `${popup.positionY}px`,
                        left: `${popup.positionX}px`
                    };

                return (
                    <div
                        key={popup.id}
                        className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 fixed pointer-events-auto"
                        style={{
                            ...positionStyle,
                            width: `${popup.width || 400}px`,
                            maxWidth: '90vw',
                            height: popup.height ? `${popup.height}px` : 'auto',
                            maxHeight: '85vh' // Leave room for browser UI
                        }}
                    >
                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto relative bg-white">
                            {popup.linkUrl ? (
                                <Link href={popup.linkUrl} target="_blank" className="block relative h-full">
                                    {popup.imageUrl ? (
                                        <Image
                                            src={popup.imageUrl}
                                            alt={popup.title}
                                            width={popup.width || 400}
                                            height={popup.height || 500}
                                            className="w-full h-auto object-contain"
                                            style={{ minHeight: '100px' }} // Prevent collapse
                                        />
                                    ) : (
                                        <div className="p-6 text-center h-full flex items-center justify-center flex-col bg-gray-50">
                                            <h3 className="font-bold text-lg mb-2">{popup.title}</h3>
                                            {popup.contentHtml && <div className="text-sm text-gray-600 prose" dangerouslySetInnerHTML={{ __html: popup.contentHtml }} />}
                                        </div>
                                    )}
                                </Link>
                            ) : (
                                <>
                                    {popup.imageUrl ? (
                                        <Image
                                            src={popup.imageUrl}
                                            alt={popup.title}
                                            width={popup.width || 400}
                                            height={popup.height || 500}
                                            className="w-full h-auto object-contain"
                                        />
                                    ) : (
                                        <div className="p-6 h-full bg-white">
                                            <h3 className="font-bold text-lg mb-4 text-center border-b pb-2">{popup.title}</h3>
                                            {popup.contentHtml ? (
                                                <div className="text-sm text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: popup.contentHtml }} />
                                            ) : (
                                                <p className="text-center text-gray-500 py-10">내용이 없습니다.</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer / Controls - Fixed at bottom */}
                        <div className="bg-gray-900 text-white p-2 flex justify-between items-center text-sm flex-none z-10">
                            <button
                                onClick={() => handleClose(popup.id, true)}
                                className="text-gray-300 hover:text-white px-2 py-1 flex items-center gap-1"
                            >
                                <span className="w-4 h-4 border border-gray-500 rounded-sm inline-block mr-1"></span>
                                오늘 하루 열지 않기
                            </button>
                            <button
                                onClick={() => handleClose(popup.id, false)}
                                className="font-bold px-3 py-1 hover:bg-gray-700 rounded transition"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
