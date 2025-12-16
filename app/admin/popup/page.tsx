'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/app/components/common/PageHeader';
import NotificationModal from '@/app/components/common/NotificationModal';
import FileUploader from '@/components/board/FileUploader';
import Image from 'next/image';

interface Popup {
    id: number;
    title: string;
    contentHtml?: string;
    imageUrl?: string;
    linkUrl?: string;
    startAt: string;
    endAt: string;
    isActive: boolean;
    priority: number;
    width?: number;
    height?: number;
    positionX?: number | null;
    positionY?: number | null;
}

export default function PopupManagementPage() {
    const [popups, setPopups] = useState<Popup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        contentHtml: '',
        imageUrl: '',
        linkUrl: '',
        startAt: new Date().toISOString().split('T')[0],
        endAt: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        startTime: '00:00',
        endTime: '23:59',
        priority: 0,
        isActive: true,
        width: 400,
        height: 500,
        positionX: '',
        positionY: '',
    });
    const [files, setFiles] = useState<File[]>([]); // For image upload

    const [notification, setNotification] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert' as 'alert' | 'confirm',
        onConfirm: undefined as undefined | (() => void),
    });

    useEffect(() => {
        fetchPopups();
    }, []);

    const fetchPopups = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/popup');
            const data = await res.json();
            if (data.popups) setPopups(data.popups);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (popup?: Popup) => {
        if (popup) {
            const startDateTime = new Date(popup.startAt);
            const endDateTime = new Date(popup.endAt);

            setEditingId(popup.id);
            setFormData({
                title: popup.title,
                contentHtml: popup.contentHtml || '',
                imageUrl: popup.imageUrl || '',
                linkUrl: popup.linkUrl || '',
                startAt: startDateTime.toISOString().split('T')[0],
                startTime: startDateTime.toTimeString().slice(0, 5),
                endAt: endDateTime.toISOString().split('T')[0],
                endTime: endDateTime.toTimeString().slice(0, 5),
                priority: popup.priority,
                isActive: popup.isActive,
                width: popup.width || 400,
                height: popup.height || 500,
                positionX: popup.positionX ?? '',
                positionY: popup.positionY ?? '',
            });
        } else {
            setEditingId(null);
            setFormData({
                title: '',
                contentHtml: '',
                imageUrl: '',
                linkUrl: '',
                startAt: new Date().toISOString().split('T')[0],
                endTime: '23:59',
                startTime: '00:00',
                endAt: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                priority: 0,
                isActive: true,
                width: 400,
                height: 500,
                positionX: '',
                positionY: '',
            });
        }
        setFiles([]);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let finalImageUrl = formData.imageUrl;

            // Handle Image Upload
            if (files.length > 0) {
                const uploadData = new FormData();
                uploadData.append('file', files[0]);
                const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
                if (!res.ok) throw new Error('Upload failed');
                const data = await res.json();
                finalImageUrl = data.fileUrl;
            }

            const startDateTime = new Date(`${formData.startAt}T${formData.startTime}:00`);
            const endDateTime = new Date(`${formData.endAt}T${formData.endTime}:00`);

            const payload = {
                ...formData,
                imageUrl: finalImageUrl,
                startAt: startDateTime.toISOString(),
                endAt: endDateTime.toISOString(),
            };

            const url = '/api/admin/popup';
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...payload, id: editingId } : payload;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed to save');

            setIsModalOpen(false);
            fetchPopups();
        } catch (error) {
            console.error(error);
            alert('저장에 실패했습니다.');
        }
    };

    const handleDelete = (id: number) => {
        setNotification({
            isOpen: true,
            title: '삭제 확인',
            message: '정말로 이 팝업을 삭제하시겠습니까?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/popup?id=${id}`, { method: 'DELETE' });
                    fetchPopups();
                    setNotification(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error(error);
                    alert('삭제 실패');
                }
            }
        });
    };

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
            <PageHeader title="팝업 관리" description="홈페이지에 노출될 팝업 공지를 관리합니다." />

            <div className="flex justify-end">
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    + 새 팝업 등록
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500">우선순위</th>
                            <th className="p-4 text-xs font-semibold text-gray-500">이미지/제목</th>
                            <th className="p-4 text-xs font-semibold text-gray-500">노출 기간</th>
                            <th className="p-4 text-xs font-semibold text-gray-500">상태</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {popups.map(popup => (
                            <tr key={popup.id} className="hover:bg-gray-50">
                                <td className="p-4 text-center w-20 font-mono text-gray-600">{popup.priority}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {popup.imageUrl ? (
                                            <div className="w-16 h-16 relative rounded overflow-hidden border bg-gray-100 flex-shrink-0">
                                                <Image src={popup.imageUrl} alt={popup.title} fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900 line-clamp-1">{popup.title}</p>
                                            {popup.linkUrl && <p className="text-xs text-blue-500 truncate max-w-[200px]">{popup.linkUrl}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    <div className="flex flex-col">
                                        <span>{new Date(popup.startAt).toLocaleString()}</span>
                                        <span className="text-gray-400 text-xs text-center border-l-2 ml-1 pl-1">~</span>
                                        <span>{new Date(popup.endAt).toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${popup.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {popup.isActive ? '노출중' : '비활성'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleOpenModal(popup)} className="text-blue-600 hover:underline mr-3 text-sm">수정</button>
                                    <button onClick={() => handleDelete(popup.id)} className="text-red-600 hover:underline text-sm">삭제</button>
                                </td>
                            </tr>
                        ))}
                        {popups.length === 0 && !loading && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">등록된 팝업이 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">{editingId ? '팝업 수정' : '새 팝업 등록'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-6">

                                {/* 1. 기본 정보 섹션 */}
                                <section>
                                    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                                        기본 정보
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1 text-gray-700">제목 <span className="text-red-500">*</span></label>
                                            <input type="text" className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" required
                                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="팝업 제목을 입력하세요" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1 text-gray-700">링크 URL (선택사항)</label>
                                            <input type="url" className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="https:// 클릭 시 이동할 주소"
                                                value={formData.linkUrl} onChange={e => setFormData({ ...formData, linkUrl: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">우선순위</label>
                                            <input type="number" className="w-full border border-gray-300 rounded-md p-2" placeholder="0 (높을수록 위로)"
                                                value={formData.priority} onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="flex items-center pt-6">
                                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                                <input type="checkbox" className="w-5 h-5 accent-blue-600 rounded focus:ring-offset-2"
                                                    checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                                <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">팝업 활성화 (즉시 노출)</span>
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-gray-100" />

                                {/* 2. 노출 일정 섹션 */}
                                <section>
                                    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                                        노출 일정
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/80 p-5 rounded-xl border border-gray-200">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">시작 일시</label>
                                            <div className="flex gap-2">
                                                <input type="date" className="border border-gray-300 rounded-md p-2 flex-1 shadow-sm"
                                                    value={formData.startAt} onChange={e => setFormData({ ...formData, startAt: e.target.value })} />
                                                <input type="time" className="border border-gray-300 rounded-md p-2 w-32 shadow-sm"
                                                    value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">종료 일시</label>
                                            <div className="flex gap-2">
                                                <input type="date" className="border border-gray-300 rounded-md p-2 flex-1 shadow-sm"
                                                    value={formData.endAt} onChange={e => setFormData({ ...formData, endAt: e.target.value })} />
                                                <input type="time" className="border border-gray-300 rounded-md p-2 w-32 shadow-sm"
                                                    value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-gray-100" />

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* 3. 디자인 & 규격 */}
                                    <section className="space-y-3">
                                        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                            <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                                            디자인 및 규격
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 h-full">
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700">이미지 첨부 (권장: 400x500)</label>
                                                <FileUploader maxFiles={1} onFilesChange={setFiles} maxSizeMB={5} />
                                                {formData.imageUrl && (
                                                    <div className="mt-2 p-2 border rounded-md bg-white flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100">
                                                                <Image src={formData.imageUrl} alt="preview" fill className="object-cover" />
                                                            </div>
                                                            <span className="text-xs text-gray-500 truncate max-w-[120px]">이미지 유지됨</span>
                                                        </div>
                                                        <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' })} className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded">삭제</button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">너비 (px)</label>
                                                    <input type="number" className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                                        value={formData.width} onChange={e => setFormData({ ...formData, width: parseInt(e.target.value) || 400 })} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">높이 (px)</label>
                                                    <input type="number" className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                                        value={formData.height} onChange={e => setFormData({ ...formData, height: parseInt(e.target.value) || 500 })} />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 4. 위치 설정 */}
                                    <section className="space-y-3">
                                        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                            <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                                            화면 위치
                                        </h3>
                                        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-4 h-full flex flex-col justify-center">
                                            <div className="text-xs text-indigo-800 bg-indigo-100 p-2 rounded flex items-start gap-2 leading-relaxed">
                                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                PC에서만 적용되며, 비워두면 중앙에 표시됩니다.
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs text-indigo-900 mb-1 font-medium">가로 위치 (Left)</label>
                                                    <input type="number" className="w-full border border-indigo-200 rounded-md p-2 text-sm bg-white focus:border-indigo-500 focus:ring-indigo-500" placeholder="Auto"
                                                        value={formData.positionX} onChange={e => setFormData({ ...formData, positionX: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-indigo-900 mb-1 font-medium">세로 위치 (Top)</label>
                                                    <input type="number" className="w-full border border-indigo-200 rounded-md p-2 text-sm bg-white focus:border-indigo-500 focus:ring-indigo-500" placeholder="Auto"
                                                        value={formData.positionY} onChange={e => setFormData({ ...formData, positionY: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* 5. 상세 내용 */}
                                <section>
                                    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-gray-400 rounded-full"></span>
                                        상세 내용 (HTML/Text)
                                    </h3>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[120px] font-mono focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all shadow-sm"
                                        placeholder="HTML 태그 혹은 텍스트 입력..."
                                        value={formData.contentHtml}
                                        onChange={e => setFormData({ ...formData, contentHtml: e.target.value })}
                                    />
                                </section>

                            </div>
                            <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">취소</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">저장</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                onConfirm={notification.onConfirm}
            />
        </div>
    );
}
