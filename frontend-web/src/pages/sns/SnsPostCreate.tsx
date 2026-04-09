import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaTimes, FaPlus, FaImage } from 'react-icons/fa';
import CommonModal from '../../components/common/CommonModal';

interface PreviewImage {
    file: File;
    previewUrl: string;
}

const SnsPostCreate: React.FC = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState('');
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
    
    // 이미지 처리 상태
    const [images, setImages] = useState<PreviewImage[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
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
            
            // 기존 이미지 배열에 새 이미지 추가 (무제한)
            const newPreviewImages = filesArray.map(file => ({
                file,
                previewUrl: URL.createObjectURL(file)
            }));

            setImages(prev => {
                const updated = [...prev, ...newPreviewImages];
                // 새로 추가할 경우 슬라이드를 추가된 첫 이미지로 이동
                setCurrentSlide(prev.length);
                return updated;
            });
        }
        // 인풋 초기화 (동일 파일 재선택 허용)
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].previewUrl); // 메모리 누수 방지
            newImages.splice(index, 1);
            
            // 슬라이더 인덱스 조정
            if (currentSlide >= newImages.length && newImages.length > 0) {
                setCurrentSlide(newImages.length - 1);
            }
            return newImages;
        });
    };

    const handleSubmit = async () => {
        if (images.length === 0) {
            showAlert("이미지를 1개 이상 추가해주세요.");
            return;
        }

        // 등록 로직 확인 모달 표시
        setConfirmMessage("게시물을 등록하시겠습니까?");
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
            content: content,
            publicTypeCd: publicTypeCd
        };

        // 데이터 부분은 Blob으로 JSON 전송
        formData.append('data', new Blob([JSON.stringify(data)], {
            type: "application/json"
        }));

        // 다중 이미지 파일 전송
        images.forEach((img) => {
            formData.append('files', img.file);
        });

        try {
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
        }
    };

    // 컴포넌트 언마운트 시에만 ObjectURL 해제
    const imagesRef = useRef(images);
    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    useEffect(() => {
        return () => {
            imagesRef.current.forEach(img => URL.revokeObjectURL(img.previewUrl));
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-20 border-b border-gray-50 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <FaChevronLeft size={18} />
                </button>
                <h1 className="text-[14px] font-bold text-[#003C48]">새 게시물</h1>
                <button onClick={handleSubmit} className="text-[#003C48] font-bold text-[14px] px-3 py-1 hover:bg-gray-50 rounded-lg">
                    등록
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Image Section */}
                <div className="w-full bg-gray-50 relative aspect-square flex flex-col items-center justify-center border-b border-gray-100">
                    {images.length > 0 ? (
                        <div className="relative w-full h-full">
                            {/* 메인 이미지 뷰 (Slider 구현부) */}
                            <img 
                                src={images[currentSlide].previewUrl} 
                                alt={`preview-${currentSlide}`} 
                                className="w-full h-full object-cover"
                            />
                            
                            {/* 상단 닫기 버튼 */}
                            <button 
                                onClick={() => removeImage(currentSlide)}
                                className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all z-10"
                            >
                                <FaTimes size={12} />
                            </button>

                            {/* 인디케이터 및 슬라이드 버튼 */}
                            {images.length > 1 && (
                                <>
                                    <div className="absolute bottom-3 w-full flex justify-center gap-1.5 z-10">
                                        {images.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`w-1.5 h-1.5 rounded-full ${idx === currentSlide ? 'bg-blue-500' : 'bg-white/60'}`}
                                            ></div>
                                        ))}
                                    </div>
                                    {/* 좌우 이동 컨트롤 */}
                                    <div className="absolute inset-y-0 w-full flex items-center justify-between px-2">
                                        <button 
                                            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                                            className="p-2 bg-black/20 rounded-full text-white hover:bg-black/40 disabled:opacity-0"
                                            disabled={currentSlide === 0}
                                        >
                                            <FaChevronLeft size={14} />
                                        </button>
                                        <button 
                                            onClick={() => setCurrentSlide(prev => Math.min(images.length - 1, prev + 1))}
                                            className="p-2 bg-black/20 rounded-full text-white hover:bg-black/40 disabled:opacity-0"
                                            disabled={currentSlide === images.length - 1}
                                        >
                                            <FaChevronLeft size={14} className="rotate-180" />
                                        </button>
                                    </div>
                                </>
                            )}
                            
                            {/* 추가 이미지 등록 버튼 (+) */}
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-3 right-3 bg-black/50 text-white p-2.5 rounded-full hover:bg-black/70 transition-all shadow-md z-10"
                            >
                                <FaPlus size={14} />
                            </button>
                        </div>
                    ) : (
                        <div 
                            className="flex flex-col items-center justify-center text-gray-400 gap-3 cursor-pointer w-full h-full hover:bg-gray-100 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <FaImage size={24} className="text-gray-300" />
                            </div>
                            <span className="text-sm font-medium">사진을 선택해주세요 (필수)</span>
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

                {/* 첨부 썸네일 리스트 가로 스크롤 (선택적 표시) */}
                {images.length > 0 && (
                    <div className="flex gap-2 px-4 py-3 overflow-x-auto nice-scroll border-b border-gray-100 bg-white">
                        {images.map((img, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setCurrentSlide(idx)}
                                className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 cursor-pointer transition-all ${idx === currentSlide ? 'border-blue-500 opacity-100' : 'border-transparent opacity-50'}`}
                            >
                                <img src={img.previewUrl} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {/* 더하기 버튼 목록 끝에 포함 */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-shrink-0 w-16 h-16 rounded-md border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50"
                        >
                            <FaPlus />
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="px-4 py-4 space-y-4">
                    <div>
                        <textarea
                            className="w-full min-h-[120px] rounded-xl bg-gray-50 border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 resize-none text-[14px] p-4 text-gray-800 placeholder:text-gray-400"
                            placeholder="문구 입력..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
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

export default SnsPostCreate;
