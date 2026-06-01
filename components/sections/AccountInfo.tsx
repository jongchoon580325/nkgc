'use client'

import { useState } from 'react'

interface AccountDetails {
    type: string
    bank: string
    accountNumber: string
    accountHolder: string
}

const accounts: AccountDetails[] = [
    {
        type: '노회 상회비',
        bank: '농협',
        accountNumber: '351-1196-9056-43',
        accountHolder: '대한예수교장로회남경기노회',
    },
    {
        type: '전도·구제·미자립',
        bank: '농협',
        accountNumber: '351-1196-9067-23',
        accountHolder: '대한예수교장로회남경기노회',
    },
]

export default function AccountInfo() {
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null)

    const copyToClipboard = (accountNumber: string) => {
        navigator.clipboard.writeText(accountNumber)
        setCopiedAccount(accountNumber)
        setTimeout(() => setCopiedAccount(null), 2000)
    }

    return (
        <div className="h-full">
            <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    남경기노회 계좌안내
                </h2>
                <p className="text-gray-600">
                    노회 운영을 위한 헌금 계좌 정보입니다
                </p>
            </div>

            <div className="grid gap-6 mb-6">
                {accounts.map((account, index) => (
                    <div
                        key={index}
                        className="bg-gradient-to-br from-brand-50 to-accent-50 rounded-2xl p-6 border-2 border-brand-200 hover:border-brand-300 transition-colors"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {account.type}
                            </h3>
                            <div className="bg-white p-2 rounded-lg">
                                <svg
                                    className="w-5 h-5 text-brand-600"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">은행</p>
                                <p className="text-base font-semibold text-gray-900">
                                    {account.bank}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 mb-1">계좌번호</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-lg font-bold text-brand-700 tracking-wide">
                                        {account.accountNumber}
                                    </p>
                                    <button
                                        onClick={() => copyToClipboard(account.accountNumber)}
                                        className="p-2 hover:bg-white rounded-lg transition-colors"
                                        title="계좌번호 복사"
                                    >
                                        {copiedAccount === account.accountNumber ? (
                                            <svg
                                                className="w-5 h-5 text-green-600"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5 text-gray-600"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 mb-1">예금주</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {account.accountHolder}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center">
                <p className="text-sm text-gray-500">
                    헌금 문의: 노회 서기실{' '}
                    <a
                        href="tel:010-9777-1409"
                        className="text-primary-blue hover:underline"
                    >
                        010-9777-1409
                    </a>
                </p>
            </div>
        </div>
    )
}
