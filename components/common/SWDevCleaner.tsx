'use client'

import { useEffect } from 'react'

export default function SWDevCleaner() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

        navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((reg) => reg.unregister())
        })
    }, [])

    return null
}
