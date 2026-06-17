'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';

interface Officer {
    position: string;
    name: string;
    title: string;
    church: string;
    photo: string;
}

interface OfficersData {
    term: string;
    officers: Officer[];
}

export default function AdminCurrentOfficersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<OfficersData>({
        term: '',
        officers: [],
    });

    const defaultPositions = [
        '노회장',
        '부노회장(목사)',
        '부노회장(장로)',
        '서기',
        '부서기',
        '회록서기',
        '부회록서기',
        '회계',
        '부회계',
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/officers');
            const result = await response.json();
            setData(result);
        } catch (error) {
            alert('데이터 로드 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleTermChange = (value: string) => {
        setData({ ...data, term: value });
    };

    const handleOfficerChange = (index: number, field: keyof Officer, value: string) => {
        const newOfficers = [...data.officers];
        newOfficers[index] = { ...newOfficers[index], [field]: value };
        setData({ ...data, officers: newOfficers });
    };

    const addOfficer = () => {
        const newOfficer: Officer = {
            position: '',
            name: '',
            title: '',
            church: '',
            photo: '',
        };
        setData({ ...data, officers: [...data.officers, newOfficer] });
    };

    const deleteOfficer = (index: number) => {
        if (confirm('이 임원을 삭제하시겠습니까?')) {
            const newOfficers = data.officers.filter((_, i) => i !== index);
            setData({ ...data, officers: newOfficers });
        }
    };

    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    const handlePhotoUpload = async (index: number, file: File) => {
        setUploadingIndex(index);

        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const pathname = `media/${year}/${month}/${safeName}`;

            const blob = await upload(pathname, file, {
                access: 'public',
                handleUploadUrl: '/api/media/upload',
                clientPayload: JSON.stringify({ size: file.size }),
            });

            handleOfficerChange(index, 'photo', blob.url);
        } catch (error) {
            alert('❌ 업로드 중 오류 발생');
        } finally {
            setUploadingIndex(null);
        }
    };

    const handleDrop = (index: number, e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handlePhotoUpload(index, file);
            } else {
                alert('이미지 파일만 업로드 가능합니다.');
            }
        }
    };

    const handleFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handlePhotoUpload(index, files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/officers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('✅ 성공적으로 저장되었습니다!');
                router.push('/about/officers');
            } else {
                alert('❌ 저장 실패');
            }
        } catch (error) {
            alert('❌ 오류 발생');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
                    <p className="text-gray-600">데이터 로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            현직임원 정보 관리
                        </h1>
                        <p className="text-gray-600">
                            현재 노회 임원진의 정보를 수정할 수 있습니다.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addOfficer}
                        className="px-6 py-3 bg-accent-600 text-white rounded-lg font-semibold hover:bg-accent-700 transition-colors shadow-md"
                    >
                        ➕ 임원 추가
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Term */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            임기 *
                        </label>
                        <input
                            type="text"
                            required
                            value={data.term}
                            onChange={(e) => handleTermChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                            placeholder="예) 제 48-49회기"
                        />
                    </div>

                    {/* Officers List */}
                    <div className="space-y-6">
                        {data.officers.map((officer, index) => (
                            <div
                                key={index}
                                className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 relative"
                            >
                                {/* Delete Button */}
                                <button
                                    type="button"
                                    onClick={() => deleteOfficer(index)}
                                    className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-bold text-xl"
                                    title="삭제"
                                >
                                    ✕
                                </button>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Position */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            직책 *
                                        </label>
                                        <select
                                            required
                                            value={officer.position}
                                            onChange={(e) =>
                                                handleOfficerChange(index, 'position', e.target.value)
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                        >
                                            <option value="">선택하세요</option>
                                            {defaultPositions.map((pos) => (
                                                <option key={pos} value={pos}>
                                                    {pos}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            이름
                                        </label>
                                        <input
                                            type="text"
                                            value={officer.name}
                                            onChange={(e) =>
                                                handleOfficerChange(index, 'name', e.target.value)
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                            placeholder="이름"
                                        />
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            직분
                                        </label>
                                        <select
                                            value={officer.title}
                                            onChange={(e) =>
                                                handleOfficerChange(index, 'title', e.target.value)
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                        >
                                            <option value="">선택하세요</option>
                                            <option value="목사">목사</option>
                                            <option value="장로">장로</option>
                                        </select>
                                    </div>

                                    {/* Church */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            교회
                                        </label>
                                        <input
                                            type="text"
                                            value={officer.church}
                                            onChange={(e) =>
                                                handleOfficerChange(index, 'church', e.target.value)
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
                                            placeholder="교회명"
                                        />
                                    </div>

                                    {/* Photo Upload */}
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            사진
                                        </label>
                                        <div className="flex gap-4 items-start">
                                            {/* Preview */}
                                            {officer.photo && (
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={officer.photo}
                                                        alt="미리보기"
                                                        className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                                                    />
                                                </div>
                                            )}

                                            {/* Drop Zone */}
                                            <div
                                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                onDrop={(e) => handleDrop(index, e)}
                                                onClick={() => document.getElementById(`photo-input-${index}`)?.click()}
                                                className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${uploadingIndex === index
                                                    ? 'border-blue-400 bg-blue-50'
                                                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                    }`}
                                            >
                                                <input
                                                    id={`photo-input-${index}`}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleFileSelect(index, e)}
                                                />
                                                {uploadingIndex === index ? (
                                                    <div className="flex items-center justify-center gap-2 text-blue-600">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                        <span>업로드 중...</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500">
                                                        <div className="text-2xl mb-1">📷</div>
                                                        <p className="text-sm">사진을 드래그하거나 클릭하여 업로드</p>
                                                        {officer.photo && (
                                                            <p className="text-xs text-gray-400 mt-1 truncate">{officer.photo}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {data.officers.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                임원 데이터가 없습니다. "임원 추가" 버튼을 클릭하여 추가하세요.
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
                            href="/about/officers"
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
                        >
                            취소
                        </a>
                    </div>
                </form>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-l-4 border-primary-blue p-6 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-3">📌 사용 안내</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li>• "임원 추가" 버튼으로 새로운 임원을 추가할 수 있습니다.</li>
                    <li>• 각 임원의 직책, 이름, 직분, 교회, 사진을 입력하세요.</li>
                    <li>• 임원 카드 우측 상단의 ✕ 버튼으로 삭제할 수 있습니다.</li>
                    <li>• 사진은 /public/images/ 폴더에 업로드 후 경로를 입력하세요.</li>
                    <li>• 저장 후 자동으로 현직임원 페이지로 이동합니다.</li>
                </ul>
            </div>
        </div>
    );
}
