'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import PageHeader from '@/app/components/common/PageHeader'
import { BOARD_TYPES } from '@/lib/board-config'

// Dynamic imports for viewers to avoid SSR issues
const PDFFlipViewer = dynamic(() => import('@/components/board/PDFFlipViewer'), { ssr: false })
const ImageFlipViewer = dynamic(() => import('@/components/board/ImageFlipViewer'), { ssr: false })

interface Resolution {
    id: number
    tabType: string
    meetingNum: number
    title: string
    fileType: string
    fileName: string
    fileUrl: string
}

interface BoardSettings {
    gridColumns?: number
    viewMode?: 'new_tab' | 'flip_book'
    coverImage?: string
    titleColor?: string
    titleSize?: string
}

export default function ResolutionsPage() {
    const [activeTab, setActiveTab] = useState<'1-20' | '21-40' | '41-60' | '61-80'>('1-20')
    const [resolutions, setResolutions] = useState<Resolution[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Board Settings State
    const [settings, setSettings] = useState<BoardSettings>({
        gridColumns: 4,
        viewMode: 'flip_book',
        coverImage: '',
        titleColor: '#ffffff',
        titleSize: '1.25rem'
    })

    // Viewer State
    const [selectedPDF, setSelectedPDF] = useState<string | null>(null)
    const [selectedImages, setSelectedImages] = useState<string[] | null>(null)
    const [selectedTitle, setSelectedTitle] = useState<string>('')

    useEffect(() => {
        fetchSettings()
    }, [])

    useEffect(() => {
        fetchResolutions(activeTab)
    }, [activeTab])

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/board-settings/${BOARD_TYPES.RESOLUTION}`)
            const data = await res.json()
            if (data.settings) {
                setSettings({
                    gridColumns: data.settings.gridColumns || 4,
                    viewMode: data.settings.viewMode || 'flip_book',
                    coverImage: data.settings.coverImage || '',
                    titleColor: data.settings.titleColor || '#000000',
                    titleSize: data.settings.titleSize || '1.25rem'
                })
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
        }
    }

    const fetchResolutions = async (tab: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/resolutions?tab=${tab}`)
            const result = await response.json()
            if (result.success) {
                setResolutions(result.data)
            } else {
                setResolutions([])
            }
        } catch (error) {
            console.error('Failed to fetch resolutions:', error)
            setResolutions([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleCardClick = (resolution: Resolution) => {
        const fileUrl = resolution.fileUrl
        const fileType = resolution.fileType

        if (settings.viewMode === 'new_tab') {
            // Open in new tab
            window.open(fileUrl, '_blank')
        } else {
            // Use flip viewer based on file type
            setSelectedTitle(resolution.title)
            if (fileType === 'PDF') {
                setSelectedPDF(fileUrl)
            } else if (fileType === 'IMAGE') {
                // For single image, wrap in array
                setSelectedImages([fileUrl])
            }
        }
    }

    const tabs = [
        { key: '1-20' as const, label: '제1회 ~ 제20회' },
        { key: '21-40' as const, label: '제21회 ~ 제40회' },
        { key: '41-60' as const, label: '제41회 ~ 제60회' },
        { key: '61-80' as const, label: '제61회 ~ 제80회' }
    ]

    return (
        <main className="min-h-screen bg-gray-50">
            <PageHeader title="결의서자료실" />

            {/* Content Section */}
            <section className="section-padding">
                <div className="container-custom max-w-6xl">
                    {/* Tab Navigation */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 ${activeTab === tab.key
                                            ? 'border-b-2 border-primary-blue text-primary-blue bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Grid Content */}
                        <div className="p-8 min-h-[400px]">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
                                </div>
                            ) : resolutions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    등록된 결의서가 없습니다.
                                </div>
                            ) : (
                                <div
                                    className="grid gap-6"
                                    style={{
                                        gridTemplateColumns: `repeat(${settings.gridColumns || 4}, minmax(0, 1fr))`
                                    }}
                                >
                                    {resolutions.map((resolution) => (
                                        <div
                                            key={resolution.id}
                                            onClick={() => handleCardClick(resolution)}
                                            className="aspect-[3/4] max-w-[180px] min-h-[200px] mx-auto rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 relative overflow-hidden bg-gray-200"
                                            style={{
                                                backgroundImage: settings.coverImage
                                                    ? `url('${settings.coverImage}')`
                                                    : `url('/pdf/노회록/00-겉표지.jpg')`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            {/* File Type Badge */}
                                            <div className="absolute top-2 right-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${resolution.fileType === 'PDF'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-blue-500 text-white'
                                                    }`}>
                                                    {resolution.fileType}
                                                </span>
                                            </div>

                                            {/* Title - Center Aligned */}
                                            <div className="absolute inset-0 flex items-center justify-center p-3">
                                                <h3
                                                    className="font-bold text-center break-keep leading-snug"
                                                    style={{
                                                        color: settings.titleColor || '#ffffff',
                                                        fontSize: settings.titleSize || '0.875rem',
                                                        textShadow: '0 2px 4px rgba(0,0,0,0.7)'
                                                    }}
                                                >
                                                    {resolution.title}
                                                </h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* PDF Flip Viewer Modal */}
            {selectedPDF && (
                <PDFFlipViewer
                    fileUrl={selectedPDF}
                    title={selectedTitle}
                    onClose={() => { setSelectedPDF(null); setSelectedTitle(''); }}
                />
            )}

            {/* Image Flip Viewer Modal */}
            {selectedImages && (
                <ImageFlipViewer
                    images={selectedImages}
                    title={selectedTitle}
                    onClose={() => { setSelectedImages(null); setSelectedTitle(''); }}
                />
            )}
        </main>
    )
}
