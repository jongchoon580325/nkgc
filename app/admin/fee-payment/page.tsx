'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import NotificationModal from '@/components/common/NotificationModal';

interface FeePaymentAccount {
    id: number;
    title: string;
    bank: string;
    accountNumber: string;
    accountHolder: string;
    displayOrder: number;
    isActive: boolean;
}

const emptyForm = {
    title: '',
    bank: '',
    accountNumber: '',
    accountHolder: '',
    displayOrder: 0,
    isActive: true,
};

export default function FeePaymentAdminPage() {
    const [accounts, setAccounts] = useState<FeePaymentAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<FeePaymentAccount | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: false,
        type: 'alert' as 'alert' | 'confirm',
    });

    const showAlert = (title: string, message: string) => {
        setModal({ isOpen: true, title, message, onConfirm: () => setModal(m => ({ ...m, isOpen: false })), isDestructive: false, type: 'alert' });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
        setModal({
            isOpen: true, title, message,
            onConfirm: () => { onConfirm(); setModal(m => ({ ...m, isOpen: false })); },
            isDestructive, type: 'confirm',
        });
    };

    useEffect(() => { fetchAccounts(); }, []);

    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/admin/fee-payment');
            const result = await res.json();
            if (result.success) setAccounts(result.data);
            else showAlert('오류', result.error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setFormData({ ...emptyForm, displayOrder: accounts.length + 1 });
        setIsAddModalOpen(true);
    };

    const handleEdit = (account: FeePaymentAccount) => {
        setSelectedAccount(account);
        setFormData({
            title: account.title,
            bank: account.bank,
            accountNumber: account.accountNumber,
            accountHolder: account.accountHolder,
            displayOrder: account.displayOrder,
            isActive: account.isActive,
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteConfirm = (account: FeePaymentAccount) => {
        showConfirm(
            '계좌 삭제',
            `"${account.title}" 계좌를 삭제하시겠습니까?`,
            () => handleDelete(account.id),
            true
        );
    };

    const handleDelete = async (id: number) => {
        const res = await fetch(`/api/admin/fee-payment/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showAlert('완료', '삭제되었습니다.');
            fetchAccounts();
        } else {
            showAlert('오류', result.error);
        }
    };

    const handleSaveAdd = async () => {
        if (!formData.title || !formData.bank || !formData.accountNumber || !formData.accountHolder) {
            showAlert('입력 오류', '모든 항목을 입력해주세요.');
            return;
        }
        const res = await fetch('/api/admin/fee-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
            setIsAddModalOpen(false);
            showAlert('완료', '계좌가 추가되었습니다.');
            fetchAccounts();
        } else {
            showAlert('오류', result.error);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedAccount) return;
        if (!formData.title || !formData.bank || !formData.accountNumber || !formData.accountHolder) {
            showAlert('입력 오류', '모든 항목을 입력해주세요.');
            return;
        }
        const res = await fetch(`/api/admin/fee-payment/${selectedAccount.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
            setIsEditModalOpen(false);
            showAlert('완료', '수정되었습니다.');
            fetchAccounts();
        } else {
            showAlert('오류', result.error);
        }
    };

    const FormFields = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계좌 명칭 <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                    placeholder="예: 노회 상회비"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">은행명 <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.bank}
                    onChange={e => setFormData(f => ({ ...f, bank: e.target.value }))}
                    placeholder="예: 농협"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호 <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={e => setFormData(f => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="예: 351-1196-9056-43"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예금주 <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.accountHolder}
                    onChange={e => setFormData(f => ({ ...f, accountHolder: e.target.value }))}
                    placeholder="예: 대한예수교장로회남경기노회"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">표시 순서</label>
                    <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={e => setFormData(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                        min={0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={e => setFormData(f => ({ ...f, isActive: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">활성화</span>
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <PageHeader
                title="상회비납부 관리"
                subtitle="TopBar '상회비 납부' 버튼에 표시되는 계좌 정보를 관리합니다."
            />

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    계좌 추가
                </button>
            </div>

            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">불러오는 중...</div>
                ) : accounts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">등록된 계좌가 없습니다.</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순서</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">명칭</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">은행</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계좌번호</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예금주</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {accounts.map(account => (
                                <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">{account.displayOrder}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{account.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{account.bank}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-blue-700">{account.accountNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{account.accountHolder}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${account.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {account.isActive ? '활성' : '비활성'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(account)}
                                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() => handleDeleteConfirm(account)}
                                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-bold text-gray-900">계좌 추가</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <FormFields />
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">취소</button>
                            <button onClick={handleSaveAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setIsEditModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-bold text-gray-900">계좌 수정</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <FormFields />
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">취소</button>
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">저장</button>
                        </div>
                    </div>
                </div>
            )}

            <NotificationModal
                isOpen={modal.isOpen}
                onClose={() => setModal(m => ({ ...m, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                isDestructive={modal.isDestructive}
                type={modal.type}
            />
        </div>
    );
}
