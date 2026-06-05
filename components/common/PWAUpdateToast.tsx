'use client'

import { usePWAUpdate } from '@/hooks/usePWAUpdate'

export default function PWAUpdateToast() {
    const { updateAvailable, applyUpdate } = usePWAUpdate()

    if (!updateAvailable) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
            <div className="bg-[#1a3a5c] text-white rounded-xl shadow-2xl px-5 py-4 flex items-start gap-3">
                <span className="text-2xl mt-0.5">🔔</span>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug">새 업데이트가 있습니다</p>
                    <p className="text-xs text-blue-200 mt-0.5 leading-snug">
                        남경기노회 웹사이트가 업데이트되었습니다.
                    </p>
                </div>
                <button
                    onClick={applyUpdate}
                    className="shrink-0 bg-white text-[#1a3a5c] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                    지금 적용
                </button>
            </div>
        </div>
    )
}
