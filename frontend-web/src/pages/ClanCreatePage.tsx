import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaCamera } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

const ClanCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [clanName, setClanName] = useState('');
    const [clanIntro, setClanIntro] = useState('');
    const [proofUrl, setProofUrl] = useState(''); // cnUrl
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'alert' as 'alert' | 'confirm',
        message: '',
        onConfirm: () => { },
    });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const showAlert = (message: string) => {
        setModal({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm: closeModal,
        });
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async () => {
        if (!clanName.trim()) {
            showAlert('클랜명을 입력해주세요.');
            return;
        }
        if (!clanIntro.trim()) {
            showAlert('클랜 소개를 입력해주세요.');
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) {
            showAlert('로그인이 필요합니다.');
            return;
        }

        try {
            const formData = new FormData();

            const clanData = {
                cnNm: clanName,
                cnDesc: clanIntro,
                cnUrl: proofUrl,
                userId: userId
            };

            // JSON 데이터를 Blob으로 변환하여 'data' 파트로 추가 (application/json 타입 지정)
            const jsonBlob = new Blob([JSON.stringify(clanData)], { type: 'application/json' });
            formData.append('data', jsonBlob);

            if (imageFile) {
                formData.append('file', imageFile);
            }

            const response = await fetch('/api/clans', {
                method: 'POST',
                body: formData, // Content-Type 헤더는 브라우저가 자동으로 설정 ('multipart/form-data')
            });

            if (response.ok) {
                setModal({
                    isOpen: true,
                    type: 'alert',
                    message: '클랜 생성 신청이 완료되었습니다.',
                    onConfirm: () => {
                        closeModal();
                        navigate('/main/clan');
                    },
                });
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || '클랜 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error("Failed to create clan", error);
            showAlert('클랜 생성 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />
            <div className="flex items-center px-4 py-4 mb-2">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">클랜 생성 신청</h1>
            </div>

            <div className="px-6 flex-1 overflow-y-auto pb-4">
                {/* Clan Profile Image */}
                <div className="flex justify-center mb-8 mt-4">
                    <div className="relative">
                        <div
                            className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-100 cursor-pointer"
                            onClick={handleImageClick}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Clan Profile" className="w-full h-full object-cover" />
                            ) : (
                                <FaCamera size={32} className="text-gray-400" />
                            )}
                        </div>
                        <div
                            className="absolute bottom-0 right-0 bg-[#00BDF8] p-2 rounded-full border-2 border-white cursor-pointer"
                            onClick={handleImageClick}
                        >
                            <FaCamera size={12} className="text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-[#003C48] text-sm font-bold mb-2">클랜명</label>
                        <input
                            type="text"
                            value={clanName}
                            onChange={(e) => setClanName(e.target.value)}
                            placeholder="클랜명을 입력하세요"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00BDF8] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[#003C48] text-sm font-bold mb-2">클랜 소개</label>
                        <textarea
                            value={clanIntro}
                            onChange={(e) => setClanIntro(e.target.value)}
                            placeholder="클랜 소개를 입력하세요"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00BDF8] transition-colors h-32 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[#003C48] text-sm font-bold mb-2">유트브/참고자료 URL</label>
                        <input
                            type="text"
                            value={proofUrl}
                            onChange={(e) => setProofUrl(e.target.value)}
                            placeholder="유튜브 영상 링크 또는 참고 자료 URL"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00BDF8] transition-colors"
                        />
                        <p className="text-xs text-gray-400 mt-1 ml-1">
                            * 입력한 URL은 클랜 소개 페이지에 표시됩니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Button */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <button
                    onClick={handleCreate}
                    className="w-full bg-[#00BDF8] text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-[#00ACD8] transition-colors"
                >
                    클랜 생성 신청
                </button>
            </div>
        </div>
    );
};

export default ClanCreatePage;
