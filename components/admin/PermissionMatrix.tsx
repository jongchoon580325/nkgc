'use client';

import { useState, useEffect } from 'react';
import { BoardType } from '@/lib/board-config';
import { BoardAction } from '@/lib/permission';
import NotificationModal from '@/components/common/NotificationModal';

interface PermissionMatrixProps {
    boardType: string;
}

interface PermissionData {
    role: string;
    actions: BoardAction[];
}

const ROLES = [
    { key: 'guest', label: '비회원 (손님)' },
    { key: 'pending', label: '승인 대기자' },
    { key: 'member', label: '정회원 (교인)' },
    { key: 'evangelist', label: '전도사' },
    { key: 'elder', label: '장로' },
    { key: 'pastor', label: '목사' },
    // Admin is excluded as they always have full access
];

const ACTIONS: { key: BoardAction; label: string }[] = [
    { key: 'BOARD_LIST', label: '목록 조회' },
    { key: 'BOARD_READ', label: '글 읽기' },
    { key: 'BOARD_WRITE', label: '글 쓰기' },
    { key: 'BOARD_COMMENT', label: '댓글 쓰기' },
    // EDIT/DELETE are usually context-based (own post), 
    // but enabling them here might mean "Can modify ANY post" (Moderator)?
    // OR "Can modify OWN post"? 
    // PRD says: "BOARD_EDIT: Edit Own Post" 
    // So if checked, it means "Allowed to edit own post". 
    // If unchecked, even own post cannot be edited (e.g., Notice board).
    { key: 'BOARD_EDIT', label: '글 수정 (본인)' },
    { key: 'BOARD_DELETE', label: '글 삭제 (본인)' },
];

export default function PermissionMatrix({ boardType }: PermissionMatrixProps) {
    const [permissions, setPermissions] = useState<PermissionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert' as 'alert' | 'confirm',
        isDestructive: false,
        confirmText: undefined as string | undefined,
        onConfirm: () => { }
    });

    useEffect(() => {
        fetchPermissions();
    }, [boardType]);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/board-settings/${boardType}/permissions`);
            if (res.ok) {
                const data = await res.json();
                setPermissions(data.permissions || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (role: string, action: BoardAction) => {
        setPermissions(prev => {
            const existing = prev.find(p => p.role === role);
            if (existing) {
                // Toggle action
                const newActions = existing.actions.includes(action)
                    ? existing.actions.filter(a => a !== action)
                    : [...existing.actions, action];

                return prev.map(p => p.role === role ? { ...p, actions: newActions } : p);
            } else {
                // New role entry
                return [...prev, { role, actions: [action] }];
            }
        });
    };

    const executeSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/board-settings/${boardType}/permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions }),
            });

            if (res.ok) {
                // Success Modal
                setModal({
                    isOpen: true,
                    title: '저장 완료',
                    message: '권한 설정이 성공적으로 저장되었습니다.',
                    type: 'alert',
                    isDestructive: false,
                    confirmText: undefined,
                    onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                });
            } else {
                const data = await res.json();
                throw new Error(data.error || '저장 실패');
            }
        } catch (error: any) {
            console.error(error);
            // Error Modal
            setModal({
                isOpen: true,
                title: '저장 실패',
                message: error.message || '설정 저장 중 오류가 발생했습니다.',
                type: 'alert',
                isDestructive: true,
                confirmText: undefined,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveClick = () => {
        setModal({
            isOpen: true,
            title: '권한 설정 저장',
            message: '현재 설정된 권한 내용을 저장하시겠습니까?',
            type: 'confirm',
            isDestructive: false,
            confirmText: '저장',
            onConfirm: () => {
                setModal(prev => ({ ...prev, isOpen: false }));
                executeSave();
            }
        });
    };

    const isChecked = (role: string, action: BoardAction) => {
        const p = permissions.find(item => item.role === role);
        return p?.actions.includes(action) || false;
    };

    if (loading) return <div className="text-center py-4 text-gray-500">권한 정보를 불러오는 중...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">권한 설정 매트릭스</h3>
                <button
                    onClick={handleSaveClick}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? '저장 중...' : '저장하기'}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-medium">
                        <tr>
                            <th className="px-4 py-3 sticky left-0 bg-gray-100 z-10 w-32 border-r border-gray-200">역할</th>
                            {ACTIONS.map(action => (
                                <th key={action.key} className="px-4 py-3 text-center min-w-[100px]">{action.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ROLES.map(role => (
                            <tr key={role.key} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium bg-white sticky left-0 border-r border-gray-200 z-10">
                                    {role.label}
                                    <div className="text-xs text-gray-400 font-normal">{role.key}</div>
                                </td>
                                {ACTIONS.map(action => (
                                    <td key={action.key} className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isChecked(role.key, action.key)}
                                            onChange={() => togglePermission(role.key, action.key)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-yellow-50 text-xs text-yellow-800">
                Tip: 관리자(Admin) 그룹은 모든 권한이 자동으로 부여되므로 이 목록에 표시되지 않습니다.
            </div>

            <NotificationModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                isDestructive={modal.isDestructive}
                onConfirm={modal.onConfirm}
                confirmText={modal.type === 'confirm' ? '저장' : '확인'}
            />
        </div>
    );
}
