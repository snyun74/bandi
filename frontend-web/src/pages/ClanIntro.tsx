import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaUserPlus } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface ClanIntroData {
    id: number;
    name: string;
    description: string;
    cnUrl: string;
    memberCount: number;
    logoColor: string;
    logoText: string;
    attachFilePath?: string; // Added field
}

const ClanIntro: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [clan, setClan] = useState<ClanIntroData | null>(null);
    const [loading, setLoading] = useState(true);
    const [joinStatus, setJoinStatus] = useState<string>('NONE');

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

    useEffect(() => {
        const fetchClanDetail = async () => {
            if (!id) return;
            const userId = localStorage.getItem('userId');

            try {
                // Fetch Clan Detail
                const response = await fetch(`/api/clans/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setClan({
                        id: data.cnNo,
                        name: data.cnNm,
                        description: data.cnDesc,
                        cnUrl: data.cnUrl,
                        memberCount: data.userCnt,
                        logoColor: "bg-black",
                        logoText: data.cnNm ? data.cnNm.substring(0, 1) : "?",
                        attachFilePath: data.attachFilePath // Mapped field
                    });
                }

                // Fetch Join Status
                if (userId) {
                    const statusRes = await fetch(`/api/clans/${id}/status?userId=${userId}`);
                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        setJoinStatus(statusData.status);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch clan info", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClanDetail();
    }, [id]);

    const handleJoinRequest = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showAlert('로그인이 필요합니다.');
            return;
        }

        if (!id) return;

        try {
            const response = await fetch('/api/clans/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cnNo: Number(id),
                    userId: userId
                }),
            });

            if (response.ok) {
                showAlert('가입 신청이 완료되었습니다.');
                setJoinStatus('RQ'); // Update status immediately
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || '가입 신청에 실패했습니다.');
            }
        } catch (error) {
            console.error("Failed to request join", error);
            showAlert('가입 신청 중 오류가 발생했습니다.');
        }
    };

    const renderActionButton = () => {
        if (joinStatus === 'RQ') {
            return (
                <button
                    disabled
                    className="bg-gray-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-not-allowed"
                >
                    승인대기
                </button>
            );
        } else if (joinStatus === 'RJ') {
            return (
                <button
                    disabled
                    className="bg-red-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-not-allowed"
                >
                    승인거절
                </button>
            );
        } else if (joinStatus === 'CN') {
            return (
                <button
                    onClick={() => navigate(`/main/clan/detail/${id}`)}
                    className="bg-[#00BDF8] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#00ACD8] transition-colors"
                >
                    상세보기
                </button>
            );
        } else {
            return (
                <button
                    onClick={handleJoinRequest}
                    className="bg-gray-100 text-[#003C48] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-200 transition-colors"
                >
                    <FaUserPlus size={12} />
                    클랜 신청
                </button>
            );
        }
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return '';

        let videoId = '';

        // Standard & Shortened (youtu.be) & Embed
        const standardMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (standardMatch && standardMatch[1]) {
            videoId = standardMatch[1];
        }

        // Shorts support
        if (!videoId && url.includes('/shorts/')) {
            const shortsMatch = url.match(/shorts\/([^"&?\/\s]{11})/);
            if (shortsMatch && shortsMatch[1]) {
                videoId = shortsMatch[1];
            }
        }

        if (videoId) {
            // Add modestbranding and rel=0 for cleaner look
            return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`;
        }

        return url; // Return original if not a video ID match
    };

    const renderContent = () => {
        if (clan && clan.cnUrl) {
            const embedUrl = getEmbedUrl(clan.cnUrl);
            if (embedUrl.includes('youtube.com/embed')) {
                return (
                    <div className="w-full relative rounded-xl overflow-hidden shadow-sm aspect-video bg-black mb-6">
                        <iframe
                            width="100%"
                            height="100%"
                            src={embedUrl}
                            title="Clan Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0"
                        ></iframe>
                    </div>
                );
            } else {
                return (
                    <div className="w-full relative rounded-xl overflow-hidden shadow-sm aspect-video bg-gray-900 mb-6 group">
                        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <h3 className="text-white text-xl font-bold mb-1">{clan.name}</h3>
                            <p className="text-gray-300 text-xs">{clan.description}</p>
                        </div>
                        <div className="absolute inset-0 -z-10 bg-gray-700 flex items-center justify-center text-gray-500">
                            (외부 링크 자료)
                        </div>
                        <a
                            href={clan.cnUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#00BDF8] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#00ACD8] transition-colors shadow-lg"
                        >
                            클랜 자료 보러가기
                        </a>
                    </div>
                );
            }
        }

        // Default Placeholder
        return (
            <div className="w-full relative rounded-xl overflow-hidden shadow-sm aspect-video bg-gray-900 mb-6">
                <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white text-xl font-bold mb-1">렛츠무드</h3>
                    <p className="text-gray-300 text-xs">2025 동국대학교 가을 대동제 Full ver.</p>
                    <span className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">19:40</span>
                </div>
                <div className="absolute inset-0 -z-10 bg-gray-700 flex items-center justify-center text-gray-500">
                    (클랜 대표 영상/이미지)
                </div>
            </div>
        );
    };

    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (!clan) return <div className="text-center py-10">Clan not found</div>;

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
                <h1 className="text-xl text-[#003C48] font-bold">클랜</h1>
            </div>

            <div className="px-4">
                {/* Clan Info Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 border-gray-100 overflow-hidden flex-shrink-0 ${!clan.attachFilePath ? clan.logoColor : 'bg-white'}`}>
                        {clan.attachFilePath ? (
                            <img src={clan.attachFilePath} alt={clan.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-2xl font-bold">{clan.logoText}</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-[#003C48] text-xl font-bold mb-0.5">{clan.name}</h2>
                        <p className="text-[#003C48] text-xs mb-1">{clan.description}</p>
                        <p className="text-[#003C48] text-xs font-medium">멤버 : {clan.memberCount}명</p>
                    </div>
                    {renderActionButton()}
                </div>

                {/* Main Content */}
                {renderContent()}

                {/* Additional content could go here */}
            </div>
        </div>
    );
};

export default ClanIntro;
