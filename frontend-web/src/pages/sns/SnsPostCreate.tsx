import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaTimes, FaPlus, FaImage, FaFont, FaRedo, FaExchangeAlt, FaMagic } from 'react-icons/fa';
import CommonModal from '../../components/common/CommonModal';

interface TextOverlay {
    text: string;
    color: string;
    bgColor: string;
    fontSize: number;
    posY: number; // 10% ~ 90%
}

interface ImageEditState {
    filter: string; // 'none' | 'blur' | 'bright' | 'dark' | 'grayscale' | 'sepia' | 'warm' | 'cool'
    rotation: number; // 0, 90, 180, 270
    flipH: boolean;
    textOverlay: TextOverlay;
}

interface PreviewImage {
    file: File;
    previewUrl: string;
    editedPreviewUrl?: string;
    edit: ImageEditState;
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

const DEFAULT_EDIT_STATE: ImageEditState = {
    filter: 'none',
    rotation: 0,
    flipH: false,
    textOverlay: {
        text: '',
        color: '#ffffff',
        bgColor: 'rgba(0,0,0,0.5)',
        fontSize: 24,
        posY: 50
    }
};

const SnsPostCreate: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: 이미지 선택/편집, 1: 정보 입력
    const [content, setContent] = useState('');
    const [publicTypeCd, setPublicTypeCd] = useState('A'); // BD007 디폴트 전체공개(A)
    const [publicTypes, setPublicTypes] = useState<{ commDtlCd: string; commDtlNm: string }[]>([]);

    // 편집 탭 선택: 'filter' | 'text' | 'transform'
    const [activeTab, setActiveTab] = useState<'filter' | 'text' | 'transform'>('filter');

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
    
    // 이미지 처리 상태
    const [images, setImages] = useState<PreviewImage[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 공통 모달 상태
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');

    const showAlert = (msg: string) => {
        setAlertMessage(msg);
        setIsAlertOpen(true);
    };

    // 이미지 다중 선택 처리
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            
            const newPreviewImages: PreviewImage[] = filesArray.map(file => ({
                file,
                previewUrl: URL.createObjectURL(file),
                edit: JSON.parse(JSON.stringify(DEFAULT_EDIT_STATE))
            }));

            setImages(prev => {
                const updated = [...prev, ...newPreviewImages];
                setCurrentSlide(prev.length);
                return updated;
            });
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].previewUrl);
            if (newImages[index].editedPreviewUrl) {
                URL.revokeObjectURL(newImages[index].editedPreviewUrl!);
            }
            newImages.splice(index, 1);
            
            if (currentSlide >= newImages.length && newImages.length > 0) {
                setCurrentSlide(newImages.length - 1);
            }
            return newImages;
        });
    };

    // 현재 선택된 이미지 편집 상태 업데이트 함수
    const updateCurrentEdit = (updater: (prev: ImageEditState) => ImageEditState) => {
        setImages(prev => {
            if (prev.length === 0 || !prev[currentSlide]) return prev;
            const updated = [...prev];
            const currentImg = updated[currentSlide];
            updated[currentSlide] = {
                ...currentImg,
                edit: updater(currentImg.edit)
            };
            return updated;
        });
    };

    // Canvas 기반 이미지 합성 함수
    const processImageToBlob = async (imgItem: PreviewImage): Promise<File> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imgItem.previewUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(imgItem.file);
                    return;
                }

                const { rotation, flipH, filter, textOverlay } = imgItem.edit;
                const isRotated = (rotation / 90) % 2 !== 0;
                const origW = img.width;
                const origH = img.height;
                const drawW = isRotated ? origH : origW;
                const drawH = isRotated ? origW : origH;

                canvas.width = drawW;
                canvas.height = drawH;

                ctx.save();
                ctx.translate(drawW / 2, drawH / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.scale(flipH ? -1 : 1, 1);

                // 필터 적용
                let filterCss = 'none';
                const fObj = FILTER_OPTIONS.find(f => f.id === filter);
                if (fObj) filterCss = fObj.filterCss;
                ctx.filter = filterCss;

                ctx.drawImage(img, -origW / 2, -origH / 2);
                ctx.restore();

                // 텍스트 오버레이 렌더링
                if (textOverlay.text.trim()) {
                    ctx.save();
                    const scaledFontSize = Math.max(20, Math.round(drawW * (textOverlay.fontSize / 350)));
                    ctx.font = `bold ${scaledFontSize}px Pretendard, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const posX = drawW / 2;
                    const posY = (drawH * textOverlay.posY) / 100;

                    // 배경 박스
                    if (textOverlay.bgColor && textOverlay.bgColor !== 'transparent') {
                        const metrics = ctx.measureText(textOverlay.text);
                        const padX = scaledFontSize * 0.5;
                        const padY = scaledFontSize * 0.25;
                        ctx.fillStyle = textOverlay.bgColor;
                        ctx.beginPath();
                        ctx.roundRect(
                            posX - metrics.width / 2 - padX,
                            posY - scaledFontSize / 2 - padY,
                            metrics.width + padX * 2,
                            scaledFontSize + padY * 2,
                            8
                        );
                        ctx.fill();
                    }

                    // 글자 렌더링
                    ctx.fillStyle = textOverlay.color || '#ffffff';
                    ctx.fillText(textOverlay.text, posX, posY);
                    ctx.restore();
                }

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], imgItem.file.name, { type: imgItem.file.type || 'image/jpeg' });
                        resolve(file);
                    } else {
                        resolve(imgItem.file);
                    }
                }, imgItem.file.type || 'image/jpeg', 0.92);
            };
            img.onerror = () => resolve(imgItem.file);
        });
    };

    const handleNext = async () => {
        if (images.length === 0) {
            showAlert("이미지를 1개 이상 추가해주세요.");
            return;
        }
        setIsProcessing(true);
        // Step 1 미리보기를 위해 편집된 캔버스 이미지 생성
        try {
            const updatedImages = await Promise.all(images.map(async (img) => {
                const processedFile = await processImageToBlob(img);
                const editedUrl = URL.createObjectURL(processedFile);
                return {
                    ...img,
                    editedPreviewUrl: editedUrl
                };
            }));
            setImages(updatedImages);
            setStep(1);
        } catch (e) {
            console.error("이미지 편집 렌더링 중 오류", e);
            setStep(1);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async () => {
        if (publicTypeCd === '') {
            showAlert("공개 설정을 선택해주세요.");
            return;
        }
        setConfirmMessage("게시물을 등록하시겠습니까?");
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

        try {
            // 이미지 편집 메타데이터 리스트 생성 (속도 0.1초 즉시 업로드)
            const editDataList = images.map(img => JSON.stringify(img.edit));

            const formData = new FormData();
            const data = {
                userId: userId,
                content: content,
                publicTypeCd: publicTypeCd,
                editDataList: editDataList
            };

            formData.append('data', new Blob([JSON.stringify(data)], {
                type: "application/json"
            }));

            // 원본 이미지 파일 즉시 전송
            images.forEach((img) => {
                formData.append('files', img.file);
            });

            const response = await fetch('/api/sns/posts', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                showAlert("게시물이 성공적으로 등록되었습니다.");
                setTimeout(() => {
                    navigate('/main/profile');
                }, 1500);
            } else {
                const errorText = await response.text();
                showAlert(`업로드 실패: ${errorText}`);
            }
        } catch (error) {
            showAlert("게시물 등록 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(false);
        }
    };

    const imagesRef = useRef(images);
    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    useEffect(() => {
        return () => {
            imagesRef.current.forEach(img => {
                URL.revokeObjectURL(img.previewUrl);
                if (img.editedPreviewUrl) URL.revokeObjectURL(img.editedPreviewUrl);
            });
        };
    }, []);

    const curImg = images[currentSlide];
    const curEdit = curImg?.edit || DEFAULT_EDIT_STATE;
    const filterObj = FILTER_OPTIONS.find(f => f.id === curEdit.filter);

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
                    {step === 0 ? '사진 편집 및 등록' : '정보 입력'}
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
                    /* 1단계: 이미지 프리뷰 & 편집 툴바 */
                    <div className="flex flex-col min-h-full">
                        {/* 이미지 프리뷰 영역 */}
                        <div className="w-full bg-gray-900 relative aspect-[4/5] flex flex-col items-center justify-center overflow-hidden">
                            {images.length > 0 ? (
                                <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                                    <div 
                                        className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
                                        style={{
                                            transform: `rotate(${curEdit.rotation}deg) scaleX(${curEdit.flipH ? -1 : 1})`
                                        }}
                                    >
                                        <img 
                                            src={curImg.previewUrl} 
                                            alt={`preview-${currentSlide}`} 
                                            className="w-full h-full object-contain"
                                            style={{
                                                filter: filterObj?.filterCss || 'none'
                                            }}
                                        />
                                    </div>

                                    {/* 텍스트 오버레이 라이브 프리뷰 (회전과 독립적으로 위에 표시) */}
                                    {curEdit.textOverlay.text && (
                                        <div 
                                            className="absolute left-0 right-0 px-4 flex justify-center pointer-events-none z-10"
                                            style={{ top: `${curEdit.textOverlay.posY}%`, transform: 'translateY(-50%)' }}
                                        >
                                            <span 
                                                className="px-3 py-1.5 rounded-lg font-bold shadow-md text-center max-w-[90%] break-words"
                                                style={{
                                                    color: curEdit.textOverlay.color,
                                                    backgroundColor: curEdit.textOverlay.bgColor,
                                                    fontSize: `${curEdit.textOverlay.fontSize}px`
                                                }}
                                            >
                                                {curEdit.textOverlay.text}
                                            </span>
                                        </div>
                                    )}

                                    {/* 삭제 버튼 */}
                                    <button 
                                        onClick={() => removeImage(currentSlide)}
                                        className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-all z-20"
                                    >
                                        <FaTimes size={12} />
                                    </button>

                                    {/* 슬라이더 컨트롤 */}
                                    {images.length > 1 && (
                                        <>
                                            <div className="absolute bottom-3 w-full flex justify-center gap-1.5 z-20">
                                                {images.map((_, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className={`w-1.5 h-1.5 rounded-full ${idx === currentSlide ? 'bg-blue-500' : 'bg-white/60'}`}
                                                    ></div>
                                                ))}
                                            </div>
                                            <div className="absolute inset-y-0 w-full flex items-center justify-between px-2 pointer-events-none z-20">
                                                <button 
                                                    onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                                                    className="p-2 bg-black/40 rounded-full text-white pointer-events-auto hover:bg-black/60 transition-all"
                                                    disabled={currentSlide === 0}
                                                >
                                                    <FaChevronLeft size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => setCurrentSlide(prev => Math.min(images.length - 1, prev + 1))}
                                                    className="p-2 bg-black/40 rounded-full text-white pointer-events-auto hover:bg-black/60 transition-all"
                                                    disabled={currentSlide === images.length - 1}
                                                >
                                                    <FaChevronLeft size={14} className="rotate-180" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div 
                                    className="flex flex-col items-center justify-center text-gray-400 gap-3 cursor-pointer w-full h-full hover:bg-gray-800 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                                        <FaImage size={24} className="text-gray-300" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-300">사진을 선택해주세요 (필수)</span>
                                </div>
                            )}

                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* 이미지 썸네일 바 */}
                        {images.length > 0 && (
                            <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-gray-100 bg-gray-50 shadow-inner">
                                {images.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 cursor-pointer transition-all ${idx === currentSlide ? 'border-blue-500 scale-95 shadow-md' : 'border-transparent opacity-60'}`}
                                    >
                                        <img src={img.previewUrl} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-shrink-0 w-14 h-14 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100"
                                >
                                    <FaPlus size={14} />
                                </div>
                            </div>
                        )}

                        {/* 편집 컨트롤 영역 */}
                        {images.length > 0 && (
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
                                        <FaFont size={14} /> 텍스트
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('transform')}
                                        className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'transform' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent hover:text-gray-700'}`}
                                    >
                                        <FaRedo size={14} /> 변형
                                    </button>
                                </div>

                                {/* 탭별 상세 편집 도구 */}
                                <div className="p-4 flex-1">
                                    {activeTab === 'filter' && (
                                        <div className="space-y-2">
                                            <span className="text-[12px] font-bold text-gray-500">필터 선택</span>
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {FILTER_OPTIONS.map(f => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => updateCurrentEdit(prev => ({ ...prev, filter: f.id }))}
                                                        className={`flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group`}
                                                    >
                                                        <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${curEdit.filter === f.id ? 'border-blue-500 ring-2 ring-blue-100 scale-105' : 'border-gray-200'}`}>
                                                            <img 
                                                                src={curImg.previewUrl} 
                                                                alt={f.label} 
                                                                className="w-full h-full object-cover"
                                                                style={{ filter: f.filterCss }}
                                                            />
                                                        </div>
                                                        <span className={`text-[11px] ${curEdit.filter === f.id ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
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
                                                <label className="text-[12px] font-bold text-gray-500 block mb-1">문구 입력</label>
                                                <input 
                                                    type="text"
                                                    placeholder="사진에 표시할 텍스트 추가..."
                                                    value={curEdit.textOverlay.text}
                                                    onChange={(e) => updateCurrentEdit(prev => ({
                                                        ...prev,
                                                        textOverlay: { ...prev.textOverlay, text: e.target.value }
                                                    }))}
                                                    className="w-full px-3 py-2 text-[14px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            {curEdit.textOverlay.text && (
                                                <div className="grid grid-cols-2 gap-4 pt-1">
                                                    <div>
                                                        <label className="text-[12px] font-bold text-gray-500 block mb-1">글자 색상</label>
                                                        <div className="flex gap-2">
                                                            {['#ffffff', '#000000', '#ff4d4f', '#ffc53d', '#52c41a', '#1890ff', '#722ed1'].map(c => (
                                                                <button
                                                                    key={c}
                                                                    onClick={() => updateCurrentEdit(prev => ({
                                                                        ...prev,
                                                                        textOverlay: { ...prev.textOverlay, color: c }
                                                                    }))}
                                                                    className={`w-6 h-6 rounded-full border border-gray-300 transition-transform ${curEdit.textOverlay.color === c ? 'scale-125 ring-2 ring-blue-400' : ''}`}
                                                                    style={{ backgroundColor: c }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[12px] font-bold text-gray-500 block mb-1">위치 (상하)</label>
                                                        <input 
                                                            type="range"
                                                            min="10"
                                                            max="90"
                                                            value={curEdit.textOverlay.posY}
                                                            onChange={(e) => updateCurrentEdit(prev => ({
                                                                ...prev,
                                                                textOverlay: { ...prev.textOverlay, posY: Number(e.target.value) }
                                                            }))}
                                                            className="w-full accent-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'transform' && (
                                        <div className="flex gap-4 items-center justify-center py-3">
                                            <button
                                                onClick={() => updateCurrentEdit(prev => ({
                                                    ...prev,
                                                    rotation: (prev.rotation + 90) % 360
                                                }))}
                                                className="flex flex-col items-center gap-2 px-5 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-700 font-medium text-[13px] transition-all"
                                            >
                                                <FaRedo size={18} className="text-blue-500" />
                                                <span>90° 회전</span>
                                            </button>

                                            <button
                                                onClick={() => updateCurrentEdit(prev => ({
                                                    ...prev,
                                                    flipH: !prev.flipH
                                                }))}
                                                className="flex flex-col items-center gap-2 px-5 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-700 font-medium text-[13px] transition-all"
                                            >
                                                <FaExchangeAlt size={18} className="text-blue-500" />
                                                <span>좌우 반전</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* 2단계: 상세 정보 입력 */
                    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <label className="text-[14px] font-bold text-gray-700 ml-1">편집 완료된 이미지</label>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <div key={idx} className="w-20 aspect-[4/5] rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-gray-100 bg-black">
                                        <img src={img.editedPreviewUrl || img.previewUrl} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 입력 폼 */}
                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-[14px] font-bold text-gray-700 ml-1">문구 입력</label>
                                <textarea
                                    className="w-full min-h-[150px] rounded-xl bg-gray-50 border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all resize-none text-[14px] p-4 text-gray-800 placeholder:text-gray-400"
                                    placeholder="게시물에 대한 설명을 입력하세요..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
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

export default SnsPostCreate;

