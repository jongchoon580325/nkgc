'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GalleryImage {
    id: number
    title: string
    content: string
    createdAt: string
    author: {
        name: string;
    };
    attachments: {
        id: number;
        fileUrl: string;
        fileName: string;
    }[];
}

interface GallerySettings {
    homeEnabled: boolean;
    homeCount: number;
}

export default function Gallery() {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [settings, setSettings] = useState<GallerySettings>({ homeEnabled: true, homeCount: 6 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGalleryData();
    }, []);

    const fetchGalleryData = async () => {
        try {
            setLoading(true);

            // Fetch settings
            const settingsRes = await fetch('/api/board-settings/GALLERY');
            const settingsData = await settingsRes.json();

            let fetchedSettings = { homeEnabled: true, homeCount: 6 };

            if (settingsRes.ok && settingsData.settings) {
                try {
                    const parsed = JSON.parse(settingsData.settings);
                    fetchedSettings = {
                        homeEnabled: parsed.homeEnabled !== undefined ? parsed.homeEnabled : true,
                        homeCount: parsed.homeCount || 6,
                    };
                } catch (e) {
                    console.error('Error parsing settings:', e);
                }
            }

            setSettings(fetchedSettings);

            // Always try to fetch posts if homeEnabled (default true)
            if (fetchedSettings.homeEnabled !== false) {
                const postsRes = await fetch(`/api/posts?type=GALLERY&page=1&limit=${fetchedSettings.homeCount}`);
                const postsData = await postsRes.json();
                setImages(postsData.posts || []);
            }
        } catch (error) {
            console.error('Error fetching gallery:', error);
        } finally {
            setLoading(false);
        }
    };

    // 이미지 URL 추출
    const extractImageUrl = (post: GalleryImage): string | null => {
        // 1. Content에서 이미지 찾기
        const match = post.content.match(/<img[^>]+src="([^">]+)"/);
        if (match) return match[1];

        // 2. Attachments에서 이미지 찾기
        if (post.attachments && post.attachments.length > 0) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const imageAttachment = post.attachments.find(att =>
                imageExtensions.some(ext => att.fileName.toLowerCase().endsWith(ext))
            );
            if (imageAttachment) {
                return imageAttachment.fileUrl;
            }
        }

        return null;
    };

    // Home에 표시 안 함 설정인 경우 컴포넌트를 렌더링하지 않음
    if (!settings.homeEnabled || loading) {
        return null;
    }

    if (images.length === 0) {
        return null;
    }

    return (
        <>
            <section className="section-padding bg-gray-50">
                <div className="container-custom">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            PHOTO GALLERY
                        </h2>
                        <p className="text-gray-600 text-lg">
                            남경기노회의 주요 활동과 행사를 사진으로 만나보세요
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image) => {
                            const imageUrl = extractImageUrl(image);
                            if (!imageUrl) return null;

                            return (
                                <Link
                                    key={image.id}
                                    href={`/board/gallery?open=${image.id}`}
                                    className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                                >
                                    {/* 실제 이미지 */}
                                    <img
                                        src={imageUrl}
                                        alt={image.title}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />

                                    {/* 호버 시 오버레이 (선택 사항 - 완전히 없애달라고 했으므로 주석 처리하거나 제거) */}
                                    {/* <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" /> */}
                                </Link>
                            );
                        })}
                    </div>

                    {/* View All Button */}
                    <div className="text-center mt-10">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/board/gallery"
                                className="inline-flex items-center px-8 py-3 bg-white text-primary-blue border-2 border-primary-blue rounded-lg font-semibold hover:bg-primary-blue hover:text-white transition-all duration-300"
                            >
                                전체 사진 보기
                                <svg
                                    className="w-5 h-5 ml-2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </a>
                            <a
                                href="/board/video"
                                className="inline-flex items-center px-8 py-3 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition-all duration-300"
                            >
                                영상 자료실
                                <svg
                                    className="w-5 h-5 ml-2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lightbox Modal (simple version) */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl w-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300"
                        >
                            <svg
                                className="w-8 h-8"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="bg-white rounded-lg overflow-hidden">
                            <div className="aspect-video bg-gradient-to-br from-brand-300 to-accent-300 flex items-center justify-center">
                                {extractImageUrl(selectedImage) && (
                                    <img
                                        src={extractImageUrl(selectedImage) || ''}
                                        alt={selectedImage.title}
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2">
                                    {selectedImage.title}
                                </h3>
                                <p className="text-gray-600">
                                    {selectedImage.author.name} | {new Date(selectedImage.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
