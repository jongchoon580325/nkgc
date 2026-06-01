'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface AccountModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [contactInfo, setContactInfo] = useState<{ secretary: { phone: string } } | null>(null)

    useEffect(() => {
        setMounted(true)
        // Fetch contact info
        fetch('/api/contact-info')
            .then(res => res.json())
            .then(data => setContactInfo(data))
            .catch(err => console.error('Failed to fetch contact info:', err))

        return () => setMounted(false)
    }, [])

    if (!isOpen || !mounted) return null

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopiedAccount(label)
        setTimeout(() => setCopiedAccount(null), 2000)
    }

    const accounts = [
        {
            title: '노회 상회비',
            bank: '농협',
            accountNumber: '351-1196-9056-43',
            accountHolder: '대한예수교장로회남경기노회',
            label: 'presbyteryFee'
        },
        {
            title: '전도·구제·미자립',
            bank: '농협',
            accountNumber: '351-1196-9067-23',
            accountHolder: '대한예수교장로회남경기노회',
            label: 'mission'
        }
    ]

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 z-10">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-blue to-blue-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">남경기노회 계좌안내</h2>
                            <p className="text-blue-100 text-sm">노회 운영을 위한 상회비 계좌 정보입니다</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {accounts.map((account) => (
                            <div
                                key={account.label}
                                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">{account.title}</h3>
                                    <div className="bg-blue-500 text-white p-2 rounded-lg">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">은행</p>
                                        <p className="text-lg font-semibold text-gray-800">{account.bank}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">계좌번호</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-2xl font-bold text-primary-blue tracking-wider">
                                                {account.accountNumber}
                                            </p>
                                            <button
                                                onClick={() => copyToClipboard(account.accountNumber, account.label)}
                                                className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-lg border border-gray-300 transition-colors flex items-center gap-1 text-sm"
                                            >
                                                {copiedAccount === account.label ? (
                                                    <>
                                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="text-green-600">복사됨</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        복사
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">예금주</p>
                                        <p className="text-base font-medium text-gray-800">{account.accountHolder}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Note */}
                    <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm text-gray-700 mb-1">
                                    <strong>상회비 문의:</strong> 노회 서기실
                                    <a href={`tel:${contactInfo?.secretary.phone || '010-9777-1409'}`} className="text-primary-blue hover:underline ml-1">
                                        {contactInfo?.secretary.phone || '010-9777-1409'}
                                    </a>
                                </p>
                                <p className="text-xs text-gray-600">
                                    노회 운영을 위해 기도와 상회비로 동참해 주시기 바랍니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
