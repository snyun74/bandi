import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaTimes, FaPlus, FaVideo, FaImage } from 'react-icons/fa';
import CommonModal from '../../components/common/CommonModal';

const SnsShortsCreate: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [publicTypeCd, setPublicTypeCd] = useState('N'); // BD007 디폴트 미공개(N)
    const [publicTypes, setPublicTypes] = useState<{ commDtlCd: string; commDtlNm: string }[]>([]);

    useEffect(() => {
        const fetchCommonCodes = async () => {
            try {
                const res = await fetch('/api/auth/common/codes/BD007');
                if (res.ok) {
                    const data = await res.json();
                    setPublicTypes(data);
                }
            } catch (err) {
                console.error("공통코드 BD007 조회 실패", err);
            }
        };
        fetchCommonCodes();
    }, []);
    
    // 비디오 상태
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
    const [duration, setDuration] = useState<number>(0);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // 공통 모달 상태
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');

    const showAlert = (msg: string) => {
        setAlertMessage(msg);
        setIsAlertOpen(true);
    };

    // 비디오 선택 처리
    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const sizeLimit = 100 * 1024 * 1024; // 100MB 임의 제한
            if (file.size > sizeLimit) {
                showAlert("동영상 크기가 너무 큽니다 (최대 100MB).");
                return;
            }
            if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
            setVideoFile(file);
            setVideoPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeVideo = () => {
        if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        setVideoFile(null);
        setVideoPreviewUrl('');
        setDuration(0);
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    // 언마운트 해제
    useEffect(() => {
        return () => {
            if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        };
    }, []);

    const handleSubmit = async () => {
        if (!videoFile) {
            showAlert("쇼츠 동영상을 등록해주세요.");
            return;
        }

        setConfirmMessage("쇼츠를 등록하시겠습니까?");
        setIsConfirmOpen(true);
    };

    const executeSubmit = async () => {
        setIsConfirmOpen(false);
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showAlert("로그인 정보가 없습니다.");
            return;
        }

        const formData = new FormData();
        const data = {
            userId: userId,
            title: title,
            duration: duration,
            publicTypeCd: publicTypeCd
        };

        // 데이터 파트 (JSON)
        formData.append('data', new Blob([JSON.stringify(data)], { type: "application/json" }));
        
        // 파일 파트
        formData.append('video', videoFile!);

        try {
            const response = await fetch('/api/sns/shorts', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                showAlert("쇼츠가 성공적으로 등록되었습니다.");
                setTimeout(() => {
                    navigate('/main/profile');
                }, 1500);
            } else {
                const errorText = await response.text();
                showAlert(`업로드 실패: ${errorText}`);
            }
        } catch (error) {
            showAlert("쇼츠 등록 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-20 border-b border-gray-50 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <FaChevronLeft size={18} />
                </button>
                <h1 className="text-[14px] font-bold text-[#003C48]">쇼츠 만들기</h1>
                <button onClick={handleSubmit} className="text-[#003C48] font-bold text-[14px] px-3 py-1 hover:bg-gray-50 rounded-lg">
                    등록
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Video Section */}
                <div className="w-full bg-gray-900 relative aspect-[4/5] flex flex-col items-center justify-center border-b border-gray-100">
                    {videoPreviewUrl ? (
                        <div className="relative w-full h-full">
                            <video 
                                src={videoPreviewUrl} 
                                controls 
                                className="w-full h-full object-contain bg-black"
                                onLoadedMetadata={(e) => {
                                    const dur = Math.round(e.currentTarget.duration);
                                    if (dur > 60) {
                                        showAlert("쇼츠 동영상은 1분(60초)을 초과할 수 없습니다.");
                                        removeVideo();
                                    } else {
                                        setDuration(dur);
                                    }
                                }}
                            />
                            {/* 상단 닫기 버튼 */}
                            <button 
                                onClick={removeVideo}
                                className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all z-10"
                            >
                                <FaTimes size={12} />
                            </button>
                        </div>
                    ) : (
                        <div 
                            className="flex flex-col items-center justify-center text-gray-400 gap-3 cursor-pointer w-full h-full hover:bg-gray-800 transition-colors"
                            onClick={() => videoInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                                <FaVideo size={24} className="text-gray-300" />
                            </div>
                            <span className="text-sm font-medium text-gray-300">동영상을 선택해주세요 (필수)</span>
                        </div>
                    )}
                    <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        ref={videoInputRef}
                        onChange={handleVideoChange}
                    />
                </div>

                {/* Content Section */}
                <div className="px-4 py-4 space-y-4">
                    {/* Text / Title Data */}
                    <div className="w-full">
                        <textarea
                            className="w-full min-h-[120px] rounded-xl bg-gray-50 border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 resize-none text-[14px] p-4 text-gray-800 placeholder:text-gray-400"
                            placeholder="쇼츠 제목/내용 입력..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col px-2 pt-2 border-t border-gray-50 gap-3">
                        <span className="text-[14px] text-gray-600 font-medium pt-1">공개 설정</span>
                        <div className="flex items-center gap-4">
                            {publicTypes.length > 0 ? (
                                publicTypes.map((pt) => (
                                    <label key={pt.commDtlCd} className="flex items-center gap-1.5 cursor-pointer">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="radio"
                                                name="publicTypeCd"
                                                value={pt.commDtlCd}
                                                checked={publicTypeCd === pt.commDtlCd}
                                                onChange={(e) => setPublicTypeCd(e.target.value)}
                                                className="peer appearance-none w-4 h-4 border border-gray-300 rounded-full checked:border-blue-500 transition-all cursor-pointer"
                                            />
                                            <div className="absolute w-2 h-2 rounded-full bg-blue-500 scale-0 peer-checked:scale-100 transition-transform pointer-events-none"></div>
                                        </div>
                                        <span className={`text-[14px] cursor-pointer ${publicTypeCd === pt.commDtlCd ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                                            {pt.commDtlNm}
                                        </span>
                                    </label>
                                ))
                            ) : (
                                <span className="text-[13px] text-gray-400">항목 로딩중...</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 공통 Alert Modal */}
            <CommonModal
                isOpen={isAlertOpen}
                type="alert"
                message={alertMessage}
                onConfirm={() => setIsAlertOpen(false)}
            />

            {/* 공통 Confirm Modal */}
            <CommonModal
                isOpen={isConfirmOpen}
                type="confirm"
                message={confirmMessage}
                onConfirm={executeSubmit}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </div>
    );
};

export default SnsShortsCreate;
