'use client';

import { useState } from 'react';

type Tab = 'backup' | 'import';

interface ImportTarget {
    id: string;
    name: string;
    description: string;
}

const IMPORT_TARGETS: ImportTarget[] = [
    { id: 'standing-committees', name: '상비부 조직', description: '각 부서별 부장, 서기, 부원 명단' },
    { id: 'fees-status', name: '상회비 현황', description: '교회별 상회비 납부 내역' },
    { id: 'members', name: '정회원 명부', description: '노회 소속 목사님 명단' },
    { id: 'current-officers', name: '현직임원 관리', description: '현재 노회 임원 명단' },
    { id: 'past-officers', name: '역대임원 관리', description: '역대 노회 임원 명단' },
    { id: 'inspections', name: '시찰 관리', description: '시찰회 및 소속 교회 관리' },
    { id: 'organizations', name: '기관 관리', description: '노회 기관 정보 관리' },
];

export default function DataManagementPage() {
    const [activeTab, setActiveTab] = useState<Tab>('backup');
    const [selectedTarget, setSelectedTarget] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

    const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.name.endsWith('.zip')) {
                setRestoreFile(file);
                setShowRestoreConfirm(true);
            } else {
                alert('ZIP 파일만 업로드 가능합니다.');
            }
        }
    };

    const handleRestoreConfirm = async () => {
        if (!restoreFile) return;

        try {
            setIsRestoring(true);
            setShowRestoreConfirm(false);
            formData.append('file', restoreFile);

            const response = await fetch('/api/admin/restore', {
                method: 'POST',
                body: formData,
            });

                console.error('Restore failed:', errorData);
                throw new Error(errorData.error || 'Restore failed');
            }

            const result = await response.json();
            window.location.reload();
        } catch (error) {
            console.error('Restore error:', error);
            alert(`복구 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setIsRestoring(false);
            setRestoreFile(null);
        }
    };

    const handleRestoreCancel = () => {
        setShowRestoreConfirm(false);
        setRestoreFile(null);
    };

    const handleBackupDownload = async () => {
        try {
            setIsDownloadingBackup(true);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Backup failed:', errorData);
                throw new Error(errorData.error || 'Backup failed');
            }

            const a = document.createElement('a');
            a.href = url;
            a.download = `nkgc-backup-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('백업 파일 다운로드가 완료되었습니다!');
        } catch (error) {
            console.error('Backup error:', error);
            alert(`백업 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setIsDownloadingBackup(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            // Parse CSV for preview
            const text = await selectedFile.text();
            const Papa = (await import('papaparse')).default;

            const result = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                preview: 3 // Show only first 3 rows
            });

            if (result.data && result.data.length > 0) {
                setPreviewData(result.data);
            }
        }
    };

    const handleTemplateDownload = async () => {
        if (!selectedTarget) return;

        try {
            const response = await fetch(`/api/admin/csv?target=${selectedTarget}`);

            if (!response.ok) {
                throw new Error('Template download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedTarget}-template.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Template download error:', error);
            alert('양식 다운로드 중 오류가 발생했습니다.');
        }
    };

    const handleCsvImport = async () => {
        if (!selectedTarget || !file) return;

        try {
            const formData = new FormData();
            formData.append('target', selectedTarget);
            formData.append('file', file);

            const response = await fetch('/api/admin/csv', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Import failed');
            }

            const result = await response.json();
            alert(`✅ ${result.imported}개의 데이터가 성공적으로 등록되었습니다!`);

            // Reset form
            setFile(null);
            setPreviewData([]);
            setSelectedTarget('');
        } catch (error) {
            console.error('CSV import error:', error);
            alert(`데이터 등록 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900">데이터 관리</h2>
                <p className="text-sm text-gray-600 mt-1">시스템 데이터를 백업하거나 엑셀(CSV) 파일을 통해 대량의 데이터를 일괄 등록합니다.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('backup')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'backup'
                        ? 'bg-white text-primary-blue shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    시스템 백업/복구
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'import'
                        ? 'bg-white text-primary-blue shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    엑셀 일괄 등록
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-md p-6 min-h-[500px]">
                {activeTab === 'backup' ? (
                    <div className="grid md:grid-cols-2 gap-8 h-full">
                        {/* Backup Section */}
                        <div className="border rounded-xl p-6 bg-blue-50 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-blue-100 rounded-full">
                                <svg className="w-8 h-8 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">전체 백업 다운로드</h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    데이터베이스, 업로드 파일, 설정 등<br />
                                    모든 시스템 데이터를 압축(ZIP)하여 다운로드합니다.
                                </p>
                            </div>
                            <button
                                onClick={handleBackupDownload}
                                disabled={isDownloadingBackup}
                                className="px-6 py-3 bg-primary-blue text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md w-full max-w-xs disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isDownloadingBackup ? '⏳ 백업 중...' : '💾 백업 파일 다운로드'}
                            </button>
                            <div className="text-xs text-gray-500 text-left w-full max-w-xs mt-4 bg-white p-3 rounded border">
                                <p className="font-semibold mb-1">✅ 포함되는 데이터:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>데이터베이스 (DB)</li>
                                    <li>업로드된 이미지/문서</li>
                                    <li>JSON 데이터 파일</li>
                                </ul>
                            </div>
                        </div>

                        {/* Restore Section */}
                        <div className="border rounded-xl p-6 bg-red-50 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-red-100 rounded-full">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">시스템 복구</h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    백업 파일을 업로드하여 시스템을 복구합니다.<br />
                                    <span className="text-red-600 font-bold">⚠️ 현재 데이터가 모두 덮어씌워집니다.</span>
                                </p>
                            </div>
                            <div className="w-full max-w-xs">
                                <label className="block w-full cursor-pointer border-2 border-dashed border-red-300 rounded-lg p-4 hover:bg-red-100 transition-colors text-center">
                                    <span className="text-sm text-gray-600">
                                        {restoreFile ? `선택됨: ${restoreFile.name}` : '클릭하여 백업 파일(.zip) 선택'}
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".zip"
                                        onChange={handleRestoreFileChange}
                                        disabled={isRestoring}
                                    />
                                </label>
                            </div>
                            <button
                                onClick={() => restoreFile && setShowRestoreConfirm(true)}
                                disabled={!restoreFile || isRestoring}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md w-full max-w-xs disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isRestoring ? '⏳ 복구 중...' : '🔄 복구 시작'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Step 1: Target Selection */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">1</span>
                                등록 대상 선택
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {IMPORT_TARGETS.map((target) => (
                                    <label
                                        key={target.id}
                                        className={`relative border rounded-xl p-4 cursor-pointer transition-all ${selectedTarget === target.id
                                            ? 'border-primary-blue bg-blue-50 ring-2 ring-primary-blue ring-opacity-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="target"
                                            value={target.id}
                                            checked={selectedTarget === target.id}
                                            onChange={(e) => setSelectedTarget(e.target.value)}
                                            className="absolute top-4 right-4 text-primary-blue focus:ring-primary-blue"
                                        />
                                        <div className="font-bold text-gray-900">{target.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">{target.description}</div>
                                    </label>
                                ))}
                            </div>
                        </section>

                        {selectedTarget && (
                            <>
                                {/* Step 2: Template Download */}
                                <section className="border-t pt-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">2</span>
                                        양식 준비
                                    </h3>
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700">
                                                선택한 <strong>{IMPORT_TARGETS.find(t => t.id === selectedTarget)?.name}</strong> 등록을 위한 엑셀 양식을 다운로드하세요.
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                * 다운로드된 CSV 파일을 엑셀에서 열어 데이터를 작성한 후 저장하세요.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleTemplateDownload}
                                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            양식 다운로드
                                        </button>
                                    </div>
                                </section>

                                {/* Step 3: Upload & Preview */}
                                <section className="border-t pt-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">3</span>
                                        파일 업로드 및 미리보기
                                    </h3>

                                    <div className="space-y-4">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-blue-50 file:text-primary-blue
                                                hover:file:bg-blue-100"
                                        />

                                        {file && previewData.length > 0 && (
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-bold text-gray-700">데이터 미리보기 (상위 3개)</h4>
                                                    <span className="text-xs text-gray-500">총 {previewData.length}개 데이터 감지됨</span>
                                                </div>
                                                <div className="overflow-x-auto border rounded-lg">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                {Object.keys(previewData[0]).map((key) => (
                                                                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                        {key}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {previewData.map((row, idx) => (
                                                                <tr key={idx}>
                                                                    {Object.values(row).map((val: any, i) => (
                                                                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                            {val}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="mt-6 flex justify-end">
                                                    <button
                                                        onClick={handleCsvImport}
                                                        className="px-8 py-3 bg-primary-blue text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        데이터 일괄 등록하기
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showRestoreConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">시스템 복구 확인</h3>
                        </div>
                        <p className="text-sm text-gray-700 mb-6">
                            <strong className="text-red-600">⚠️ 경고</strong><br />
                            현재 시스템의 <strong>모든 데이터가 백업 파일로 덮어씌워집니다.</strong><br />
                            이 작업은 되돌릴 수 없습니다.<br /><br />
                            백업 파일: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{restoreFile?.name}</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRestoreCancel}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleRestoreConfirm}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                            >
                                복구 진행
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
