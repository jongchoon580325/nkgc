'use client';

import { useEffect, useState } from 'react';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean; // For red buttons on delete
}

export default function NotificationModal({
    isOpen, onClose, title, message, type, onConfirm,
    confirmText = '확인', cancelText = '취소',
    isDestructive = false
}: NotificationModalProps) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
        } else {
            const timer = setTimeout(() => setAnimate(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !animate) return null;

    // Determine colors based on type
    let headerColor = 'text-gray-800';
    let buttonColor = 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    const icon = (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );

    if (isDestructive || type === 'error') {
        headerColor = 'text-red-600';
        buttonColor = 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    } else if (type === 'success') {
        headerColor = 'text-green-600';
        buttonColor = 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
    }

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-200 z-10 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className={`text-lg font-bold ${headerColor}`}>
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    {type === 'confirm' && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (type === 'confirm' && onConfirm) {
                                onConfirm();
                            } else {
                                onClose(); // Just close for alert/success/error
                            }
                        }}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:ring-2 focus:ring-offset-1 transition-all ${buttonColor}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
