import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaTimes, FaPlus, FaVideo, FaImage } from 'react-icons/fa';
import CommonModal from '../../components/common/CommonModal';

const SnsShortsCreate: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: 영상 선택, 1: 정보 입력
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

    const handleNext = () => {
        if (!videoFile) {
            showAlert("쇼츠 동영상을 등록해주세요.");
            return;
        }
        setStep(1);
    };

    const handleSubmit = async () => {
        if (publicTypeCd === '') {
            showAlert("공개 설정을 선택해주세요.");
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
        <div className="flex flex-col h-full bg-white font-['Pretendard'] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-20 border-b border-gray-100 shadow-sm">
                <button 
                    onClick={() => step === 0 ? navigate(-1) : setStep(0)} 
                    className="text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <FaChevronLeft size={18} />
                </button>
                <h1 className="text-[15px] font-bold text-gray-800">
                    {step === 0 ? '쇼츠 만들기' : '게시 정보 입력'}
                </h1>
                <button 
                    onClick={step === 0 ? handleNext : handleSubmit} 
                    className="text-blue-500 font-bold text-[15px] px-3 py-1 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    {step === 0 ? '다음' : '공유'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {step === 0 ? (
                    /* 1단계: 비디오 선택 및 프리뷰 */
                    <div className="w-full bg-gray-900 relative aspect-[9/16] flex flex-col items-center justify-center overflow-hidden shadow-inner">
                        {videoPreviewUrl ? (
                            <div className="relative w-full h-full">
                                <video 
                                    src={videoPreviewUrl} 
                                    controls 
                                    className="w-full h-full object-cover bg-black"
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
                                <div className="absolute bottom-6 left-3 bg-white/20 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md pointer-events-none border border-white/10">
                                    권장 비율 9:16
                                </div>
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
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center shadow-lg border border-gray-700">
                                    <FaVideo size={24} className="text-gray-300" />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-sm font-medium text-gray-300">동영상을 선택해주세요 (필수)</span>
                                    <span className="text-[11px] text-gray-500 italic">권장 비율 9:16 (세로형)</span>
                                </div>
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
                ) : (
                    /* 2단계: 상세 정보 입력 */
                    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* 썸네일 미리보기 섹션 */}
                        <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="w-24 aspect-[9/16] bg-black rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                                <video 
                                    src={videoPreviewUrl} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <span className="text-[12px] text-gray-400 font-medium mb-1">선택된 영상</span>
                                <span className="text-[14px] text-gray-700 font-bold truncate">동영상 {duration}초</span>
                                <button 
                                    onClick={() => setStep(0)}
                                    className="mt-2 text-blue-500 text-[12px] font-medium self-start hover:underline"
                                >
                                    영상 변경하기
                                </button>
                            </div>
                        </div>

                        {/* 입력 폼 */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[14px] font-bold text-gray-700 ml-1">설명</label>
                                <textarea
                                    className="w-full min-h-[150px] rounded-xl bg-gray-50 border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all resize-none text-[14px] p-4 text-gray-800 placeholder:text-gray-400"
                                    placeholder="쇼츠에 대한 설명을 입력하세요..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="text-[14px] font-bold text-gray-700 ml-1">공개 설정</label>
                                <div className="flex items-center gap-6 px-1">
                                    {publicTypes.length > 0 ? (
                                        publicTypes.map((pt) => (
                                            <label key={pt.commDtlCd} className="flex items-center gap-2 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        name="publicTypeCd"
                                                        value={pt.commDtlCd}
                                                        checked={publicTypeCd === pt.commDtlCd}
                                                        onChange={(e) => setPublicTypeCd(e.target.value)}
                                                        className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-full checked:border-blue-500 transition-all cursor-pointer"
                                                    />
                                                    <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-500 scale-0 peer-checked:scale-100 transition-transform pointer-events-none"></div>
                                                </div>
                                                <span className={`text-[14px] transition-colors ${publicTypeCd === pt.commDtlCd ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                                    {pt.commDtlNm}
                                                </span>
                                            </label>
                                        ))
                                    ) : (
                                        <span className="text-[13px] text-gray-400 italic">로딩 중...</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
