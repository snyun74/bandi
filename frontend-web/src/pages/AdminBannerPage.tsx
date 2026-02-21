import React, { useEffect, useState, useRef } from 'react';
import { FaChevronLeft, FaPlayCircle, FaImage, FaUpload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import CommonModal from '../components/common/CommonModal';

interface AdBannerDto {
    adBannerCd: string;
    adBannerNm: string;
    attachNo: number;
    fileUrl: string | null;
    mimeType: string | null;
    adBannerLinkUrl: string | null;
    insDtime: string;
    updDtime: string;
}

const AdminBannerPage: React.FC = () => {
    const navigate = useNavigate();
    const [banners, setBanners] = useState<AdBannerDto[]>([]);
    const [loading, setLoading] = useState(false);

    // Alert Modal State
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });

    // Preview Modal State
    const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; url: string | null; isVideo: boolean }>({
        isOpen: false, url: null, isVideo: false
    });

    // URL Input State
    const [urlInputs, setUrlInputs] = useState<{ [key: string]: string }>({});

    // Selected File State for each banner
    const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({});

    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/banners');
            if (res.ok) {
                const data = await res.json();
                setBanners(data);

                // Initialize URL inputs
                const initialUrls: { [key: string]: string } = {};
                data.forEach((banner: AdBannerDto) => {
                    initialUrls[banner.adBannerCd] = banner.adBannerLinkUrl || '';
                });
                setUrlInputs(initialUrls);
            } else {
                showAlert('배너 목록을 불러오지 못했습니다.');
            }
        } catch (error) {
            console.error(error);
            showAlert('서버와 연결할 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message: string) => {
        setAlertModal({ isOpen: true, message });
    };

    const handlePreview = (banner: AdBannerDto) => {
        if (!banner.fileUrl) {
            showAlert('등록된 미디어가 없습니다.');
            return;
        }
        const isVideo = banner.mimeType?.startsWith('video/') || banner.fileUrl.match(/\.(mp4|webm|ogg)$/i) !== null;
        setPreviewModal({ isOpen: true, url: banner.fileUrl, isVideo });
    };

    const handleFileClick = (bannerCd: string) => {
        fileInputRefs.current[bannerCd]?.click();
    };

    const handleSave = async (bannerCd: string) => {
        const file = selectedFiles[bannerCd] || null;
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showAlert('로그인 정보가 없습니다.');
            return;
        }

        const formData = new FormData();
        if (file) {
            formData.append('file', file);
        }
        formData.append('userId', userId);

        const linkUrl = urlInputs[bannerCd];
        if (linkUrl !== undefined) {
            formData.append('linkUrl', linkUrl);
        }

        try {
            showAlert('저장 중입니다...');
            const res = await fetch(`/api/admin/banners/${bannerCd}`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                showAlert('변경되었습니다.');
                setSelectedFiles(prev => ({ ...prev, [bannerCd]: null }));
                fetchBanners(); // 새로고침
            } else {
                const text = await res.text();
                showAlert(`업로드 실패: ${text}`);
            }
        } catch (error) {
            console.error(error);
            showAlert('서버와 통신 중 오류가 발생했습니다.');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, bannerCd: string) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setSelectedFiles(prev => ({ ...prev, [bannerCd]: file }));
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-3 bg-white sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-3">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">배너 및 광고 관리</h1>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">불러오는 중...</div>
                ) : (
                    banners.map(banner => (
                        <div key={banner.adBannerCd} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-[#003C48]">{banner.adBannerNm}</h3>
                                    <p className="text-sm text-gray-400 mt-1">코드: {banner.adBannerCd}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {banner.fileUrl ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">미디어 등록됨</span>
                                        ) : (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">미등록</span>
                                        )}
                                        <span className="text-xs text-gray-400">수정: {banner.updDtime.substring(0, 8)}</span>
                                    </div>
                                </div>
                            </div>
                            {/* URL Input */}
                            <div className="flex flex-col gap-1 mt-2">
                                <label className="text-sm font-bold text-gray-700">링크 URL</label>
                                <input
                                    type="text"
                                    value={urlInputs[banner.adBannerCd] || ''}
                                    onChange={(e) => setUrlInputs(prev => ({ ...prev, [banner.adBannerCd]: e.target.value }))}
                                    placeholder="http://example.com"
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#00BDF8]"
                                />
                            </div>

                            {/* Selected File Name / Action Buttons */}
                            {selectedFiles[banner.adBannerCd] && (
                                <div className="text-sm font-bold text-[#00BDF8] mt-1 bg-cyan-50 p-2 rounded-lg border border-cyan-100 flex items-center justify-between">
                                    <span className="truncate">업로드 대기: {selectedFiles[banner.adBannerCd]?.name}</span>
                                    <button
                                        className="text-xs ml-2 text-gray-500 underline whitespace-nowrap"
                                        onClick={() => {
                                            setSelectedFiles(prev => ({ ...prev, [banner.adBannerCd]: null }));
                                            if (fileInputRefs.current[banner.adBannerCd]) {
                                                fileInputRefs.current[banner.adBannerCd]!.value = '';
                                            }
                                        }}
                                    >취소</button>
                                </div>
                            )}

                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => handlePreview(banner)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    {banner.mimeType?.startsWith('video/') ? <FaPlayCircle /> : <FaImage />}
                                    미리보기
                                </button>
                                <button
                                    onClick={() => handleFileClick(banner.adBannerCd)}
                                    className="flex-1 bg-white border border-[#00BDF8] hover:bg-cyan-50 text-[#00BDF8] py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <FaUpload />
                                    {selectedFiles[banner.adBannerCd] ? '파일 변경' : '파일 선택'}
                                </button>
                                <button
                                    onClick={() => handleSave(banner.adBannerCd)}
                                    className="flex-1 bg-[#00BDF8] hover:bg-[#00aadd] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    저장
                                </button>
                                <input
                                    type="file"
                                    ref={el => { fileInputRefs.current[banner.adBannerCd] = el; }}
                                    onChange={(e) => handleFileChange(e, banner.adBannerCd)}
                                    className="hidden"
                                    accept="image/*,video/*"
                                />
                            </div>
                        </div>
                    ))
                )}
                {!loading && banners.length === 0 && (
                    <div className="text-center py-10 text-gray-500">등록된 배너가 없습니다.</div>
                )}
            </div>

            {/* Alert Modal */}
            <CommonModal
                isOpen={alertModal.isOpen}
                type="alert"
                message={alertModal.message}
                onConfirm={() => setAlertModal({ isOpen: false, message: '' })}
            />

            {/* Preview Modal */}
            {previewModal.isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80" onClick={() => setPreviewModal({ isOpen: false, url: null, isVideo: false })}>
                    <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <button
                            className="absolute -top-10 right-0 text-white font-bold text-xl hover:text-gray-300"
                            onClick={() => setPreviewModal({ isOpen: false, url: null, isVideo: false })}
                        >
                            ✕ 닫기
                        </button>
                        <div className="bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center min-h-[200px]">
                            {previewModal.isVideo ? (
                                <video src={previewModal.url || ''} controls autoPlay className="w-full max-h-[70vh]" />
                            ) : (
                                <img src={previewModal.url || ''} alt="Banner Preview" className="w-full h-auto max-h-[70vh] object-contain" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBannerPage;
