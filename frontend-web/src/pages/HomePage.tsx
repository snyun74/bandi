import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUnlink } from 'react-icons/fa';
import JamEvaluationModal from "../components/common/JamEvaluationModal";
import ProfileEditModal from "../components/profile/ProfileEditModal";

export default function HomePage() {
    const navigate = useNavigate();
    const [pendingEvaluation, setPendingEvaluation] = useState<any>(null);
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [mainBanner, setMainBanner] = useState<{ url: string; isVideo: boolean; linkUrl: string | null } | null>(null);
    const [isBannerLoading, setIsBannerLoading] = useState(true);

    useEffect(() => {
        checkPendingEvaluation();
        checkProfileComplete();
        fetchMainBanner();
    }, []);

    const fetchMainBanner = async () => {
        try {
            const res = await fetch('/api/admin/banners/MAIN');
            if (res.ok) {
                const data = await res.json();
                if (data.fileUrl) {
                    const isVideo = data.mimeType?.startsWith('video/') || data.fileUrl.match(/\.(mp4|webm|ogg)$/i) !== null;
                    setMainBanner({ url: data.fileUrl, isVideo, linkUrl: data.adBannerLinkUrl || null });
                }
            }
        } catch (error) {
            console.error("Failed to fetch main banner", error);
        } finally {
            setIsBannerLoading(false);
        }
    };

    const checkPendingEvaluation = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        try {
            // const userRole = JSON.parse(userRoleString); // Incorrect
            // const userId = userRole.userId; // Incorrect

            const response = await fetch(`/api/bands/evaluation/pending?userId=${userId}`);
            if (response.ok) {
                if (response.status === 204) {
                    // No content
                    setPendingEvaluation(null);
                } else {
                    const data = await response.json();
                    setPendingEvaluation(data);
                }
            }
        } catch (error) {
            console.error("Failed to check pending evaluation", error);
        }
    };

    const handleEvaluationComplete = () => {
        setPendingEvaluation(null);
        checkPendingEvaluation();
    };

    const checkProfileComplete = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        try {
            const res = await fetch(`/api/user/profile/${userId}`);
            if (res.ok) {
                const data = await res.json();
                const isIncomplete =
                    !data.genderCd || String(data.genderCd).trim() === '' || String(data.genderCd) === 'null' ||
                    !data.mbti || String(data.mbti).trim() === '' || String(data.mbti) === 'null' ||
                    !data.skillsConfigured;
                console.log("Profile Data:", data, "isIncomplete:", isIncomplete);
                if (isIncomplete) {
                    setProfileIncomplete(true);
                }
            }
        } catch (e) {
            console.error("Failed to check profile", e);
        }
    };
    const [expandedDayId, setExpandedDayId] = useState<number | null>(null);

    // Helper: Get formatted date string MM/DD
    const formatDate = (date: Date) => {
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${m}/${d}`;
    };

    // Helper: Get day name (Sun, Mon...) -> Now Korean
    const getDayName = (date: Date) => {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return days[date.getDay()];
    };

    // Generate Current Week Data
    const generateCurrentWeek = () => {
        const today = new Date();
        const day = today.getDay(); // 0 (Sun) - 6 (Sat)
        const diff = today.getDate() - day; // Adjust to Sunday

        const weekData = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(today);
            current.setDate(diff + i);

            const isToday = current.toDateString() === today.toDateString();
            const dateStr = formatDate(current);
            const dayName = getDayName(current);
            const id = i; // Use 0-6 as IDs for simplicity

            let item: any = {
                id,
                date: dateStr,
                day: dayName,
                active: isToday,
                sub: '', // Removed "Today" text
                type: '',
                events: []
            };

            // Add Mock Events for Monday (for demo)
            if (dayName === '월') {
                item.sub = '2개 일정';
                item.events = [
                    { type: '클랜', time: '14:00', title: '정기모임합주일정' },
                    { type: '합주', time: '16:00', title: '회원모임-원하는 사람만 참석' }
                ];
            }

            weekData.push(item);
        }
        return weekData;
    };

    const schedules = React.useMemo(() => generateCurrentWeek(), []);
    const [myClan, setMyClan] = useState<any>(null);
    const [myJams, setMyJams] = useState<any[]>([]);
    const [currentJamIndex, setCurrentJamIndex] = useState(0);

    React.useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            // Fetch My Clan
            fetch(`/api/clans/my?userId=${userId}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('No clan found');
                })
                .then(data => setMyClan(data))
                .catch(() => {
                    setMyClan(null);
                });

            // Fetch My Jams
            fetch(`/api/bands/my?userId=${userId}`)
                .then(res => {
                    if (res.ok) return res.json();
                    return [];
                })
                .then(data => setMyJams(data))
                .catch(err => console.error("Failed to fetch jams", err));
        }
    }, []);

    // Rotation Logic
    React.useEffect(() => {
        if (myJams.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentJamIndex(prev => (prev + 1) % myJams.length);
        }, 5000); // 5 seconds

        return () => clearInterval(interval);
    }, [myJams]);


    return (
        <div className="flex flex-col space-y-6 pb-4">
            {/* Banner Section - Original Auto Height */}
            <section className="relative w-full h-auto min-h-[100px] bg-[#003C48] overflow-hidden flex items-center justify-center">
                {isBannerLoading ? (
                    <div className="w-full h-40 bg-gray-200 animate-pulse"></div>
                ) : mainBanner ? (
                    mainBanner.linkUrl ? (
                        <a href={mainBanner.linkUrl.startsWith('http') ? mainBanner.linkUrl : `http://${mainBanner.linkUrl}`} target="_blank" rel="noopener noreferrer" className="w-full">
                            {mainBanner.isVideo ? (
                                <video src={mainBanner.url} autoPlay loop muted playsInline className="w-full h-auto object-contain cursor-pointer" />
                            ) : (
                                <img src={mainBanner.url} alt="Main Banner" className="w-full h-auto object-contain cursor-pointer" />
                            )}
                        </a>
                    ) : (
                        <div className="w-full">
                            {mainBanner.isVideo ? (
                                <video src={mainBanner.url} autoPlay loop muted playsInline className="w-full h-auto object-contain" />
                            ) : (
                                <img src={mainBanner.url} alt="Main Banner" className="w-full h-auto object-contain" />
                            )}
                        </div>
                    )
                ) : (
                    <img src="/images/main_logo.png" alt="Default Main Banner" className="w-full h-auto object-contain" />
                )}
            </section>

            {/* Schedule Section */}
            <section className="px-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: '"Jua", sans-serif' }}>다가오는 합주 일정</h3>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 min-h-[100px]">

                    {/* Days Header - Always Visible */}
                    <div className="grid grid-cols-7 text-center bg-[#00BDF8] py-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-white text-xs font-medium">{day}</div>
                        ))}
                    </div>

                    {/* Content: Detail View OR Grid View */}
                    {expandedDayId !== null ? (
                        // --- Detail View (Expanded) ---
                        (() => {
                            const selectedItem = schedules.find(s => s.id === expandedDayId);
                            if (!selectedItem) return null;

                            return (
                                <div
                                    onClick={() => setExpandedDayId(null)}
                                    className="p-3 cursor-pointer bg-blue-50 h-full min-h-[100px] flex flex-col justify-start"
                                >
                                    {selectedItem.events && selectedItem.events.length > 0 ? (
                                        <div className="space-y-0.5">
                                            {selectedItem.events.map((evt: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1 py-1.5 border-b border-dotted border-blue-300 last:border-none">
                                                    {/* Date & Time Prefix */}
                                                    <span className="text-[#00BDF8] text-[13px] whitespace-nowrap" style={{ fontFamily: '"Jua", sans-serif' }}>
                                                        {evt.type}) {selectedItem.date}({selectedItem.day}) {evt.time} ~
                                                    </span>
                                                    {/* Title - Truncated */}
                                                    <span className="text-[#00BDF8] text-[13px] font-bold truncate flex-1" style={{ fontFamily: '"Jua", sans-serif' }}>
                                                        {evt.title}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-[#00BDF8] text-[13px] text-center pt-4" style={{ fontFamily: '"Jua", sans-serif' }}>
                                            {selectedItem.sub || '등록된 상세 일정이 없습니다.'}
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    ) : (
                        // --- Grid View (Collapsed) ---
                        <div className="grid grid-cols-7 gap-1 p-1">
                            {schedules.map((item) => {
                                // Determine Display Text
                                // Determine Content to Display
                                let content;
                                if (item.events && item.events.length > 0) {
                                    content = item.events.map((evt: any, idx: number) => (
                                        <div key={idx} className="leading-tight whitespace-nowrap text-[11px] tracking-tighter text-[#00BDF8]" style={{ fontFamily: '"Jua", sans-serif' }}>
                                            {evt.type}일정
                                        </div>
                                    ));
                                } else {
                                    content = (
                                        <div className={`${item.active || item.special ? '' : 'text-[#00BDF8]'} leading-tight block whitespace-nowrap text-[11px] tracking-tighter text-[#00BDF8]`} style={{ fontFamily: '"Jua", sans-serif' }}>
                                            {item.active ? 'Today' : item.sub}
                                        </div>
                                    );
                                }

                                return (
                                    <div key={item.id}
                                        onClick={() => setExpandedDayId(item.id)}
                                        className={`
                                        h-[80px] rounded-lg flex flex-col items-center justify-start pt-2 p-1 text-center text-[10px] cursor-pointer transition-colors
                                        ${item.active ? 'bg-white border border-[#00BDF8] text-gray-800' : 'bg-white border border-gray-100'}
                                        ${item.special ? 'bg-[#FF8E8E] text-white font-bold border-none' : ''}
                                        hover:bg-blue-50
                                    `}
                                    >
                                        {item.type && <span className="font-bold block">{item.type}</span>}
                                        <div className={`${item.active || item.special ? '' : 'text-gray-600'} flex flex-col items-center justify-center h-full pb-2`}>
                                            {content}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* My Room Section */}
            <section className="px-4">
                <h3 className="text-lg font-bold text-[#003C48] mb-3" style={{ fontFamily: '"Jua", sans-serif' }}>내 합주</h3>

                {myJams.length > 0 ? (
                    <div
                        onClick={() => {
                            const jam = myJams[currentJamIndex];
                            if (jam.bnType === 'CLAN') {
                                navigate(`/main/clan/jam/room/${jam.bnNo}`);
                            } else {
                                navigate(`/main/jam/room/${jam.bnNo}`);
                            }
                        }}
                        className="bg-white border border-[#00BDF8] rounded-xl p-4 flex items-center shadow-sm relative cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                        {/* Album Art / Icon */}
                        <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-gray-100 overflow-hidden flex-shrink-0 mr-4 bg-gray-100">
                            {myJams[currentJamIndex].bnImg ? (
                                <img src={myJams[currentJamIndex].bnImg} alt={myJams[currentJamIndex].bnNm} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                    <FaUnlink size={20} />
                                    <span className="text-[10px] mt-1">미연결</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 pr-12 overflow-hidden">
                            <h4 className="text-[#003C48] text-lg font-bold mb-1 truncate" style={{ fontFamily: '"Jua", sans-serif' }}>
                                <span className={`mr-1 text-sm ${myJams[currentJamIndex].bnType === 'CLAN' ? 'text-[#00BDF8]' : 'text-gray-500'}`}>
                                    [{myJams[currentJamIndex].bnType === 'CLAN' ? '클랜' : '자유'}]
                                </span>
                                {myJams[currentJamIndex].bnNm}
                            </h4>
                            <p className="text-gray-600 text-[13px] mb-1 truncate">
                                {myJams[currentJamIndex].bnSongNm} : {myJams[currentJamIndex].bnSingerNm}
                            </p>
                            <p className="text-[#003C48] text-[12px] font-medium">
                                내 역할 : {myJams[currentJamIndex].bnRoleCd === 'LEAD' ? <span className="text-yellow-500">👑 리더</span> : '멤버'}
                            </p>
                        </div>

                        {/* More Link / Count */}
                        <div className="absolute bottom-3 right-4 flex flex-col items-end">
                            <span className="text-xs text-gray-400 mb-1">{currentJamIndex + 1} / {myJams.length}</span>
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/main/jam/my');
                                }}
                                className="text-gray-500 text-xs cursor-pointer hover:text-[#00BDF8]"
                                style={{ fontFamily: '"Jua", sans-serif' }}
                            >
                                더보기
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-[#00B2D2] rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                        <p className="text-[#003C48] font-medium mb-4 text-[14px]">참여 중인 방이 없습니다.</p>
                        <button
                            onClick={() => navigate('/main/jam')}
                            className="bg-[#00BDF8] hover:bg-[#00a8e0] text-white px-8 py-2 rounded-full font-bold text-[13px] shadow-md transition-colors"
                        >
                            합주방 보러 가기
                        </button>
                    </div>
                )}
            </section>

            {/* My Clan Section */}
            <section className="px-4">
                <h3 className="text-lg font-bold text-[#003C48] mb-3" style={{ fontFamily: '"Jua", sans-serif' }}>내 클랜</h3>
                {myClan ? (
                    <div
                        onClick={() => navigate(`/main/clan/detail/${myClan.cnNo}`)}
                        className="bg-white border border-[#00BDF8] rounded-xl p-4 flex items-center shadow-sm relative cursor-pointer hover:bg-gray-50 transition-colors">
                        {/* Logo */}
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 border-gray-100 overflow-hidden flex-shrink-0 mr-4 ${!myClan.attachFilePath ? 'bg-black' : 'bg-white'}`}>
                            {myClan.attachFilePath ? (
                                <img src={myClan.attachFilePath} alt={myClan.cnNm} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-bold">
                                    {myClan.cnNm ? myClan.cnNm.substring(0, 1) : "C"}
                                </span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 pr-12 overflow-hidden">
                            <h4 className="text-[#003C48] text-lg font-bold mb-1" style={{ fontFamily: '"Jua", sans-serif' }}>{myClan.cnNm}</h4>
                            <p className="text-gray-600 text-[13px] mb-1 truncate">{myClan.cnDesc ? (myClan.cnDesc.length > 20 ? myClan.cnDesc.substring(0, 20) + '...' : myClan.cnDesc) : ''}</p>
                            <p className="text-[#003C48] text-[12px] font-medium">멤버 : {myClan.userCnt}명</p>
                        </div>

                        {/* More Link */}
                        <div className="absolute bottom-3 right-4">
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/main/clan/my');
                                }}
                                className="text-gray-500 text-xs cursor-pointer hover:text-[#00BDF8]"
                                style={{ fontFamily: '"Jua", sans-serif' }}
                            >
                                더보기
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-[#00B2D2] rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                        <p className="text-[#003C48] font-medium mb-4 text-[14px]">소속된 클랜이 없습니다.</p>
                        <button
                            onClick={() => navigate('/main/clan')}
                            className="bg-[#00BDF8] hover:bg-[#00a8e0] text-white px-8 py-2 rounded-full font-bold text-[13px] shadow-md transition-colors"
                        >
                            클랜 보러 가기
                        </button>
                    </div>
                )}
            </section>


            {/* Practice Room Section */}
            <section className="px-4 pb-5">
                <h3 className="text-lg font-bold text-[#003C48] mb-3" style={{ fontFamily: '"Jua", sans-serif' }}>내 연습실</h3>
                <div className="w-full h-[150px] bg-[#F3F4F6] rounded-xl"></div>
            </section>
            {/* Profile Incomplete Modal */}
            {profileIncomplete && (
                <ProfileEditModal
                    isOpen={profileIncomplete}
                    onClose={() => setProfileIncomplete(false)}
                    userId={localStorage.getItem('userId') || ''}
                    onProfileUpdate={() => setProfileIncomplete(false)}
                />
            )}
            {/* Evaluation Modal */}
            {!profileIncomplete && pendingEvaluation && (
                <JamEvaluationModal
                    evaluation={pendingEvaluation}
                    onComplete={handleEvaluationComplete}
                />
            )}
        </div>
    );
};

