'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FileUploader from '@/components/board/FileUploader'
import Image from 'next/image'

interface Section {
    heading: string
    content?: string
    items?: string[]
    image?: string
}

interface IntroductionData {
    title: string
    subtitle: string
    description: string
    sections: Section[]
}

export default function AdminIntroductionPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [data, setData] = useState<IntroductionData>({
        title: '',
        subtitle: '',
        description: '',
        sections: [],
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch('/api/introduction')
            const result = await response.json()
            setData(result)
            setLoading(false)
        } catch (error) {
            alert('데이터 로드 실패')
            setLoading(false)
        }
    }

    const handleSectionChange = (
        index: number,
        field: keyof Section,
        value: string
    ) => {
        const newSections = [...data.sections]
        newSections[index] = { ...newSections[index], [field]: value }
        setData({ ...data, sections: newSections })
    }

    const handleItemsChange = (index: number, value: string) => {
        const newSections = [...data.sections]
        newSections[index].items = value.split('\n').filter((item) => item.trim())
        setData({ ...data, sections: newSections })
    }

    const handleImageUpload = async (index: number, file: File) => {
        if (!file) return;

        setSaving(true); // Indicate saving state during upload
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Image upload failed');
            }

            const result = await response.json();
            const imageUrl = result.fileUrl;

            handleSectionChange(index, 'image', imageUrl);
            alert('이미지 업로드 성공!');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('이미지 업로드 실패!');
        } finally {
            setSaving(false);
        }
    };

    const handleImageRemove = (index: number) => {
        if (confirm('정말 이미지를 삭제하시겠습니까?')) {
            handleSectionChange(index, 'image', '');
        }
    };

    const addSection = () => {
        const newSection: Section = {
            heading: '',
            content: '',
            items: [],
        }
        setData({ ...data, sections: [...data.sections, newSection] })
    }

    const deleteSection = (index: number) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            const newSections = data.sections.filter((_, i) => i !== index)
            setData({ ...data, sections: newSections })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch('/api/introduction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                alert('✅ 성공적으로 저장되었습니다!')
                router.push('/about/introduction')
            } else {
                alert('❌ 저장 실패')
            }
        } catch (error) {
            alert('❌ 오류 발생')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
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
            <div className="container-custom max-w-5xl">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                노회소개 관리
                            </h1>
                            <p className="text-gray-600">노회 소개 내용을 수정할 수 있습니다.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addSection}
                            className="px-6 py-3 bg-accent-600 text-white rounded-lg font-semibold hover:bg-accent-700 transition-colors shadow-md"
                        >
                            ➕ 섹션 추가
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    제목 *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.title}
                                    onChange={(e) => setData({ ...data, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="남경기노회 소개"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    부제목
                                </label>
                                <input
                                    type="text"
                                    value={data.subtitle}
                                    onChange={(e) =>
                                        setData({ ...data, subtitle: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="대한예수교 장로회 남경기노회"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    설명 *
                                </label>
                                <textarea
                                    required
                                    value={data.description}
                                    onChange={(e) =>
                                        setData({ ...data, description: e.target.value })
                                    }
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                                    placeholder="노회에 대한 간단한 설명"
                                />
                            </div>
                        </div>

                        {/* Sections */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
                                콘텐츠 섹션
                            </h2>

                            {data.sections.map((section, index) => (
                                <div
                                    key={index}
                                    className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 relative"
                                >
                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={() => deleteSection(index)}
                                        className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-bold"
                                        title="삭제"
                                    >
                                        ✕
                                    </button>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                섹션 제목
                                            </label>
                                            <input
                                                type="text"
                                                value={section.heading}
                                                onChange={(e) =>
                                                    handleSectionChange(index, 'heading', e.target.value)
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary-blue"
                                                placeholder="노회 구성"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    내용 텍스트
                                                </label>
                                                <textarea
                                                    value={section.content || ''}
                                                    onChange={(e) =>
                                                        handleSectionChange(index, 'content', e.target.value)
                                                    }
                                                    rows={5}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary-blue"
                                                    placeholder="섹션 설명 (선택사항)"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    이미지 (선택사항)
                                                </label>
                                                {section.image ? (
                                                    <div className="relative border rounded-lg overflow-hidden group">
                                                        <div className="relative aspect-video w-full bg-gray-100">
                                                            <Image
                                                                src={section.image}
                                                                alt="Section Image"
                                                                fill
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImageRemove(index)}
                                                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700 transition-colors"
                                                            title="이미지 삭제"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                                                        <FileUploader
                                                            maxFiles={1}
                                                            maxSizeMB={5}
                                                            onFilesChange={(files) => handleImageUpload(index, files[0])}
                                                        />
                                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                                            권장: 로고나 관련 이미지
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                목록 항목 (한 줄에 하나씩)
                                            </label>
                                            <textarea
                                                value={section.items?.join('\n') || ''}
                                                onChange={(e) =>
                                                    handleItemsChange(index, e.target.value)
                                                }
                                                rows={4}
                                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary-blue font-mono text-sm"
                                                placeholder="1. 동부시찰&#10;2. 서부시찰&#10;3. 남부시찰"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                각 줄이 하나의 목록 항목이 됩니다.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {data.sections.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    섹션이 없습니다. "섹션 추가" 버튼을 클릭하여 추가하세요.
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-6 border-t">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? '저장 중...' : '✅ 저장하기'}
                            </button>
                            <a
                                href="/about/introduction"
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
                            >
                                취소
                            </a>
                        </div>
                    </form>
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 border-l-4 border-primary-blue p-6 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-3">📌 사용 안내</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li>• 제목과 설명은 필수 항목입니다.</li>
                        <li>• 섹션별로 제목, 내용 텍스트, 목록 항목을 설정할 수 있습니다.</li>
                        <li>
                            • 목록 항목은 한 줄에 하나씩 입력하면 자동으로 불릿 포인트로
                            표시됩니다.
                        </li>
                        <li>• "섹션 추가" 버튼으로 새로운 섹션을 추가할 수 있습니다.</li>
                        <li>• 저장 후 자동으로 노회소개 페이지로 이동합니다.</li>
                    </ul>
                </div>
            </div>
        </main>
    )
}
