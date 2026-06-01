'use client'
import Link from 'next/link';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ContactInfo {
    secretary: {
        name: string
        phone: string
    }
    president: {
        name: string
        phone: string
    }
    address: string
    email: string
}

export default function AdminContactInfoPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [data, setData] = useState<ContactInfo | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch('/api/contact-info')
            const result = await response.json()
            setData(result)
            setLoading(false)
        } catch (error) {
            alert('데이터 로드 실패')
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch('/api/contact-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                alert('✅ 성공적으로 저장되었습니다!')
                router.push('/')
            } else {
                alert('❌ 저장 실패')
            }
        } catch (error) {
            alert('❌ 오류 발생')
        } finally {
            setSaving(false)
        }
    }

    if (loading || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
                    <p className="text-gray-600">데이터 로딩 중...</p>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="container-custom max-w-4xl">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            연락처 정보 관리
                        </h1>
                        <p className="text-gray-600">
                            Footer에 표시될 연락처 정보를 수정할 수 있습니다.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* 노회서기 */}
                        <div className="border-2 border-gray-200 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                노회서기 정보
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        이름
                                    </label>
                                    <input
                                        type="text"
                                        value={data.secretary.name}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                secretary: {
                                                    ...data.secretary,
                                                    name: e.target.value,
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                        placeholder="문보길 목사"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        전화번호
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.secretary.phone}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                secretary: {
                                                    ...data.secretary,
                                                    phone: e.target.value,
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                        placeholder="010-9777-1409"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 관리자(노회장) */}
                        <div className="border-2 border-gray-200 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                관리자(노회장) 정보
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        이름
                                    </label>
                                    <input
                                        type="text"
                                        value={data.president.name}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                president: {
                                                    ...data.president,
                                                    name: e.target.value,
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                        placeholder="정영교(노회장)"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        전화번호
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.president.phone}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                president: {
                                                    ...data.president,
                                                    phone: e.target.value,
                                                },
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                        placeholder="010-3705-1950"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 주소 및 이메일 */}
                        <div className="border-2 border-gray-200 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                기타 정보
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        주소
                                    </label>
                                    <input
                                        type="text"
                                        value={data.address}
                                        onChange={(e) =>
                                            setData({ ...data, address: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                        placeholder="경기도 수원시 영통구 영통로 255번길 34 (영통동)"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        이메일
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData({ ...data, email: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                        placeholder="nkgc1409@daum.net"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? '저장 중...' : '✅ 저장하기'}
                            </button>
                            <Link
                                href="/"
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
                            >
                                취소
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-primary-blue hover:text-brand-700 font-medium transition-colors"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </main>
    )
}
