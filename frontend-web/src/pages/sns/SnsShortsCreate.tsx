import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaTimes, FaVideo, FaMagic, FaFont, FaCut, FaPlay } from 'react-icons/fa';
import CommonModal from '../../components/common/CommonModal';

interface TextOverlay {
    text: string;
    color: string;
    bgColor: string;
    fontSize: number;
    posY: number; // 10% ~ 90%
    posX: number; // 10% ~ 90%
}

const FILTER_OPTIONS = [
    { id: 'none', label: '원본', filterCss: 'none' },
    { id: 'blur', label: '흐리게', filterCss: 'blur(3px)' },
    { id: 'bright', label: '밝게', filterCss: 'brightness(1.25)' },
    { id: 'dark', label: '어둡게', filterCss: 'brightness(0.75)' },
    { id: 'grayscale', label: '흑백', filterCss: 'grayscale(1)' },
    { id: 'sepia', label: '세피아', filterCss: 'sepia(0.8)' },
    { id: 'warm', label: '따뜻함', filterCss: 'sepia(0.3) brightness(1.05) saturate(1.2)' },
    { id: 'cool', label: '시원함', filterCss: 'hue-rotate(30deg) brightness(1.05) saturate(0.9)' },
];

const SnsShortsCreate: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: 영상 선택/편집, 1: 정보 입력
    const [title, setTitle] = useState('');
    const [publicTypeCd, setPublicTypeCd] = useState('A'); // BD007 디폴트 전체공개(A)
    const [publicTypes, setPublicTypes] = useState<{ commDtlCd: string; commDtlNm: string }[]>([]);

    // 탭 선택: 'filter' | 'text' | 'trim'
    const [activeTab, setActiveTab] = useState<'filter' | 'text' | 'trim'>('filter');

    useEffect(() => {
        const fetchCommonCodes = async () => {
            try {
                const res = await fetch('/api/auth/common/codes/BD007');
                if (res.ok) {
                    const data = await res.json();
                    setPublicTypes(data.filter((pt: any) => pt.commDtlNm !== '친구'));
                }
            } catch (err) {
                console.error("공통코드 BD007 조회 실패", err);
            }
        };
        fetchCommonCodes();
    }, []);

    // 비디오 상태 및 편집 상태
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);
    const [filter, setFilter] = useState<string>('none');
    const [textOverlay, setTextOverlay] = useState<TextOverlay>({
        text: '',
        color: '#ffffff',
        bgColor: 'rgba(0,0,0,0.5)',
        fontSize: 24,
        posY: 50,
        posX: 50
    });

    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
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
            // 초기화
            setFilter('none');
            setTextOverlay({ text: '', color: '#ffffff', bgColor: 'rgba(0,0,0,0.5)', fontSize: 24, posY: 50, posX: 50 });
        }
    };

    const removeVideo = () => {
        if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        setVideoFile(null);
        setVideoPreviewUrl('');
        setTotalDuration(0);
        setStartTime(0);
        setEndTime(0);
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    // 언마운트 해제
    useEffect(() => {
        return () => {
            if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        };
    }, []);

    // 영상 재생 타임 루프 제어
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const curr = videoRef.current.currentTime;
            if (curr < startTime || curr >= endTime) {
                videoRef.current.currentTime = startTime;
            }
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };


    const handleNext = () => {
        if (!videoFile) {
            showAlert("릴스 동영상을 등록해주세요.");
            return;
        }
        setStep(1);
    };

    const handleSubmit = async () => {
        if (publicTypeCd === '') {
            showAlert("공개 설정을 선택해주세요.");
            return;
        }
        setConfirmMessage("릴스를 등록하시겠습니까?");
        setIsConfirmOpen(true);
    };

    const executeSubmit = async () => {
        setIsConfirmOpen(false);
        setIsProcessing(true);
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showAlert("로그인 정보가 없습니다.");
            setIsProcessing(false);
            return;
        }

        // 최종 저장 시점에 파일 사이즈 재확인 (50MB 제한)
        if (videoFile && videoFile.size > 50 * 1024 * 1024) {
            showAlert("동영상 크기가 너무 큽니다 (최대 50MB). 더 짧거나 작은 영상을 선택해주세요.");
            setIsProcessing(false);
            return;
        }

        try {
            const durationSec = Math.max(1, Math.round(endTime - startTime));

            // 메타데이터 준비 (속도 0.1초 즉시 업로드)
            const overlayDataObj = {
                filter,
                textOverlay,
                startTime,
                endTime
            };

            const formData = new FormData();
            const data = {
                userId: userId,
                title: title,
                duration: durationSec,
                publicTypeCd: publicTypeCd,
                overlayData: JSON.stringify(overlayDataObj)
            };

            formData.append('data', new Blob([JSON.stringify(data)], { type: "application/json" }));
            formData.append('video', videoFile!);

            const response = await fetch('/api/sns/shorts', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                showAlert("릴스가 성공적으로 등록되었습니다.");
                setTimeout(() => {
                    navigate('/main/profile');
                }, 1500);
            } else {
                const errorText = await response.text();
                showAlert(`업로드 실패: ${errorText}`);
            }
        } catch (error) {
            showAlert("릴스 등록 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filterObj = FILTER_OPTIONS.find(f => f.id === filter);
    const selectedDuration = Math.max(1, Math.round(endTime - startTime));

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
                    {step === 0 ? '릴스 편집 및 만들기' : '게시 정보 입력'}
                </h1>
                <button
                    onClick={step === 0 ? handleNext : handleSubmit}
                    disabled={isProcessing}
                    className="text-blue-500 font-bold text-[15px] px-3 py-1 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                >
                    {isProcessing ? '처리중...' : (step === 0 ? '다음' : '공유')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {step === 0 ? (
                    /* 1단계: 비디오 선택 & 편집 영역 */
                    <div className="flex flex-col min-h-full">
                        {/* 동영상 프리뷰 영역 */}
                        <div className="w-full bg-gray-900 relative aspect-[9/16] max-h-[55vh] flex flex-col items-center justify-center overflow-hidden shadow-inner">
                            {videoPreviewUrl ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-black">
                                    <video
                                        ref={videoRef}
                                        src={videoPreviewUrl}
                                        autoPlay
                                        loop
                                        playsInline
                                        onTimeUpdate={handleTimeUpdate}
                                        onClick={togglePlay}
                                        className="w-full h-full object-contain cursor-pointer"
                                        style={{
                                            filter: filterObj?.filterCss || 'none'
                                        }}
                                        onLoadedMetadata={(e) => {
                                            const dur = Math.round(e.currentTarget.duration);
                                            setTotalDuration(dur);
                                            setStartTime(0);
                                            setEndTime(Math.min(dur, 60));
                                        }}
                                    />

                                    {/* 재생/일시정지 오버레이 버튼 */}
                                    {!isPlaying && (
                                        <div
                                            onClick={togglePlay}
                                            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10"
                                        >
                                            <div className="w-14 h-14 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                                <FaPlay size={20} className="ml-1" />
                                            </div>
                                        </div>
                                    )}

                                    {/* 자막 라이브 프리뷰 */}
                                    {textOverlay.text && (
                                        <div
                                            className="absolute flex justify-center pointer-events-none z-10"
                                            style={{
                                                top: `${textOverlay.posY}%`,
                                                left: `${textOverlay.posX}%`,
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        >
                                            <span
                                                className="px-3 py-1.5 rounded-lg font-bold shadow-md text-center max-w-[90vw] break-words"
                                                style={{
                                                    color: textOverlay.color,
                                                    backgroundColor: textOverlay.bgColor,
                                                    fontSize: `${textOverlay.fontSize}px`
                                                }}
                                            >
                                                {textOverlay.text}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-md pointer-events-none border border-white/10 z-10 font-medium">
                                        구간: {selectedDuration}초 ({startTime}초 ~ {endTime}초)
                                    </div>

                                    <button
                                        onClick={removeVideo}
                                        className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-all z-20"
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
                                        <span className="text-[11px] text-gray-500 italic">권장 비율 9:16 (최대 1분)</span>
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

                        {/* 편집 툴바 영역 */}
                        {videoPreviewUrl && (
                            <div className="flex-1 bg-white flex flex-col border-t border-gray-100">
                                {/* 탭 선택 버튼 */}
                                <div className="flex border-b border-gray-100 bg-gray-50 text-[13px] font-bold text-gray-500">
                                    <button
                                        onClick={() => setActiveTab('filter')}
                                        className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'filter' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent hover:text-gray-700'}`}
                                    >
                                        <FaMagic size={14} /> 필터
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('text')}
                                        className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'text' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent hover:text-gray-700'}`}
                                    >
                                        <FaFont size={14} /> 자막/글쓰기
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('trim')}
                                        className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'trim' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent hover:text-gray-700'}`}
                                    >
                                        <FaCut size={14} /> 구간 자르기
                                    </button>
                                </div>

                                {/* 탭별 상세 도구 */}
                                <div className="p-4 flex-1">
                                    {activeTab === 'filter' && (
                                        <div className="space-y-2">
                                            <span className="text-[12px] font-bold text-gray-500">비디오 필터 선택</span>
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {FILTER_OPTIONS.map(f => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => setFilter(f.id)}
                                                        className={`flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer`}
                                                    >
                                                        <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-black flex items-center justify-center transition-all ${filter === f.id ? 'border-blue-500 ring-2 ring-blue-100 scale-105' : 'border-gray-200'}`}>
                                                            <video
                                                                src={videoPreviewUrl}
                                                                className="w-full h-full object-cover pointer-events-none"
                                                                style={{ filter: f.filterCss }}
                                                            />
                                                        </div>
                                                        <span className={`text-[11px] ${filter === f.id ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                                                            {f.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'text' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[12px] font-bold text-gray-500 block mb-1">자막 입력</label>
                                                <input
                                                    type="text"
                                                    placeholder="릴스에 표시할 자막 문구 추가..."
                                                    value={textOverlay.text}
                                                    onChange={(e) => setTextOverlay(prev => ({ ...prev, text: e.target.value }))}
                                                    className="w-full px-3 py-2 text-[14px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            {textOverlay.text && (
                                                <div className="space-y-3 pt-1">
                                                    <div>
                                                        <label className="text-[12px] font-bold text-gray-500 block mb-1">글자 색상</label>
                                                        <div className="flex gap-2">
                                                            {['#ffffff', '#000000', '#ff4d4f', '#ffc53d', '#52c41a', '#1890ff', '#722ed1'].map(c => (
                                                                <button
                                                                    key={c}
                                                                    onClick={() => setTextOverlay(prev => ({ ...prev, color: c }))}
                                                                    className={`w-6 h-6 rounded-full border border-gray-300 transition-transform ${textOverlay.color === c ? 'scale-125 ring-2 ring-blue-400' : ''}`}
                                                                    style={{ backgroundColor: c }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[12px] font-bold text-gray-500 block mb-1">위치 (상하)</label>
                                                            <input
                                                                type="range"
                                                                min="10"
                                                                max="90"
                                                                value={textOverlay.posY}
                                                                onChange={(e) => setTextOverlay(prev => ({ ...prev, posY: Number(e.target.value) }))}
                                                                className="w-full accent-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[12px] font-bold text-gray-500 block mb-1">위치 (좌우)</label>
                                                            <input
                                                                type="range"
                                                                min="10"
                                                                max="90"
                                                                value={textOverlay.posX ?? 50}
                                                                onChange={(e) => setTextOverlay(prev => ({ ...prev, posX: Number(e.target.value) }))}
                                                                className="w-full accent-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'trim' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[12px] font-bold text-gray-600">
                                                <span>재생 구간 설정</span>
                                                <span className="text-blue-600">{selectedDuration}초 선택됨</span>
                                            </div>

                                            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                                <div>
                                                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                                                        <span>시작 시간</span>
                                                        <span>{startTime}초</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max={Math.max(0, endTime - 1)}
                                                        value={startTime}
                                                        onChange={(e) => {
                                                            const newStart = Number(e.target.value);
                                                            setStartTime(newStart);
                                                            if (videoRef.current) videoRef.current.currentTime = newStart;
                                                        }}
                                                        className="w-full accent-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                                                        <span>종료 시간</span>
                                                        <span>{endTime}초</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={startTime + 1}
                                                        max={totalDuration || 60}
                                                        value={endTime}
                                                        onChange={(e) => {
                                                            const newEnd = Number(e.target.value);
                                                            setEndTime(newEnd);
                                                        }}
                                                        className="w-full accent-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* 2단계: 상세 정보 입력 */
                    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* 썸네일 미리보기 섹션 */}
                        <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="w-24 aspect-[9/16] bg-black rounded-lg overflow-hidden flex-shrink-0 shadow-md relative">
                                <video
                                    src={videoPreviewUrl}
                                    className="w-full h-full object-cover"
                                    style={{ filter: filterObj?.filterCss || 'none' }}
                                />
                                {textOverlay.text && (
                                    <div
                                        className="absolute flex justify-center pointer-events-none"
                                        style={{
                                            top: `${textOverlay.posY}%`,
                                            left: `${textOverlay.posX ?? 50}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        <span
                                            className="px-1 py-0.5 rounded text-[8px] font-bold truncate max-w-full"
                                            style={{ color: textOverlay.color, backgroundColor: textOverlay.bgColor }}
                                        >
                                            {textOverlay.text}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <span className="text-[12px] text-gray-400 font-medium mb-1">편집 완료된 영상</span>
                                <span className="text-[14px] text-gray-700 font-bold truncate">동영상 {selectedDuration}초</span>
                                {filter !== 'none' && <span className="text-[11px] text-blue-500 font-medium">필터: {filterObj?.label}</span>}
                                <button
                                    onClick={() => setStep(0)}
                                    className="mt-2 text-blue-500 text-[12px] font-medium self-start hover:underline"
                                >
                                    편집 수정하기
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

