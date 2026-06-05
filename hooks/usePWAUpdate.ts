'use client'

import { useEffect, useState } from 'react'

export function usePWAUpdate() {
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
    const [updateAvailable, setUpdateAvailable] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

        const checkForUpdate = async () => {
            const registration = await navigator.serviceWorker.getRegistration()
            if (!registration) return

            // 이미 대기 중인 새 SW가 있으면 즉시 표시
            if (registration.waiting) {
                setWaitingWorker(registration.waiting)
                setUpdateAvailable(true)
                return
            }

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing
                if (!newWorker) return

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        setWaitingWorker(newWorker)
                        setUpdateAvailable(true)
                    }
                })
            })

            // 백그라운드에서 업데이트 체크
            registration.update().catch(() => {})
        }

        checkForUpdate()
    }, [])

    const applyUpdate = () => {
        if (!waitingWorker) return
        waitingWorker.postMessage({ type: 'SKIP_WAITING' })
        setUpdateAvailable(false)
        // 새 SW가 활성화되면 페이지 새로고침
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload()
        }, { once: true })
    }

    return { updateAvailable, applyUpdate }
}
