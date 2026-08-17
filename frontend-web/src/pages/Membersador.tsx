import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    FaGraduationCap,
    FaStar,
    FaPlay,
    FaBook,
    FaClock,
    FaCheckCircle,
    FaYoutube,
    FaInstagram,
    FaExternalLinkAlt,
    FaTimes,
    FaSearch,
    FaUserCheck,
    FaInfoCircle,
    FaLayerGroup,
    FaVideo,
    FaRegCommentDots,
    FaMusic
} from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface CommonCode {
    commCd: string;
    commDtlCd: string;
    commDtlNm: string;
    commOrder?: number;
}

interface CourseItem {
    courseNo: number;
    userId: string;
    courseTitle: string;
    courseDesc: string;
    eduTypeFg: 'F' | 'P';
    courseAmt: number;
    attachNoImg: number | null;
    imgUrl: string | null;
    attachNoMov: number | null;
    movUrl: string | null;
    courseStatCd: string;
    insDtime: string;
    lessonCount: number;
    approvedLessonCount: number;
    evaluationCount: number;
    avgRating: number;
}

interface AmbassadorGroup {
    userId: string;
    userNm: string;
    userNickNm: string;
    profileImg: string | null;
    activityField: string;
    activityFieldNm: string;
    introContent: string;
    portfolioUrl: string;
    snsUrl: string;
    courseCount: number;
    totalLessons: number;
    avgRating: number;
    totalEvaluations: number;
    courses: CourseItem[];
}

interface LessonItem {
    lessonNo: number;
    courseNo: number;
    lessonSeq: number;
    lessonTitle: string;
    lessonDesc: string;
    attachNoMov: number;
    videoUrl: string | null;
    attachNoImg: number | null;
    imgUrl: string | null;
    durationSec: number;
    lessonStatCd: string;
    insDtime: string;
}

interface EvaluationItem {
    evalNo: number;
    courseNo: number;
    userId: string;
    userNm: string;
    userNickNm: string;
    ratingScore: number;
    reviewContent: string;
    likeFg: string;
    insDtime: string;
}

interface CourseDetailData {
    course: CourseItem;
    ambassador: AmbassadorGroup;
    lessons: LessonItem[];
    evaluations: EvaluationItem[];
}

interface MyApplication {
    appNo: number;
    courseNo: number;
    courseTitle: string;
    eduTypeFg: string;
    userId: string;
    userNm: string;
    userNickNm: string;
    phoneNo: string;
    paymentAmt: number;
    paymentStatFg: string;
    appStatCd: string;
    appRejectBigo: string;
    insDtime: string;
}

const Membersador: React.FC = () => {
    const [ambassadors, setAmbassadors] = useState<AmbassadorGroup[]>([]);
    const [fieldCodes, setFieldCodes] = useState<CommonCode[]>([]);
    const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Modals
    const [selectedCourseDetail, setSelectedCourseDetail] = useState<CourseDetailData | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
    const [applyTargetCourse, setApplyTargetCourse] = useState<CourseItem | null>(null);
    const [applyMemo, setApplyMemo] = useState<string>('');
    const [isSubmittingApply, setIsSubmittingApply] = useState<boolean>(false);

    // Video Player Modal
    const [videoModal, setVideoModal] = useState<{ isOpen: boolean; title: string; url: string }>({
        isOpen: false,
        title: '',
        url: ''
    });

    // Alert & Confirm Modal
    const [commonModal, setCommonModal] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title?: string;
        message?: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'alert'
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedAmbassadorId, setSelectedAmbassadorId] = useState<string | null>(null);

    // Sync selectedAmbassadorId from URL
    useEffect(() => {
        const ambId = searchParams.get('userId');
        setSelectedAmbassadorId(ambId);
    }, [searchParams]);

    const selectedAmbassador = useMemo(() => {
        if (!selectedAmbassadorId) return null;
        return ambassadors.find(a => a.userId === selectedAmbassadorId) || null;
    }, [ambassadors, selectedAmbassadorId]);

    const handleSelectAmbassador = (amb: AmbassadorGroup) => {
        setSelectedAmbassadorId(amb.userId);
        setSearchParams({ userId: amb.userId });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToList = () => {
        setSelectedAmbassadorId(null);
        setSearchParams({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const showAlert = (message: string, title: string = '알림') => {
        setCommonModal({
            isOpen: true,
            type: 'alert',
            title,
            message
        });
    };

    const currentUserId = localStorage.getItem('userId') || '';
    const currentUserNickNm = localStorage.getItem('userNickNm') || localStorage.getItem('userNm') || currentUserId;

    // Load initial data (Ambassadors, BD900 Common Codes, My Applications)
    const loadPublicData = async () => {
        setIsLoading(true);
        try {
            const [ambRes, codeRes, appRes] = await Promise.all([
                fetch('/api/ambassador/public/ambassadors'),
                fetch('/api/auth/common/codes/BD900'),
                currentUserId ? fetch(`/api/ambassador/public/my-applications?userId=${currentUserId}`) : Promise.resolve(null)
            ]);

            if (ambRes.ok) {
                const data = await ambRes.json();
                setAmbassadors(data || []);
            }

            if (codeRes.ok) {
                const codes: CommonCode[] = await codeRes.json();
                setFieldCodes(codes || []);
            }

            if (appRes && appRes.ok) {
                const appData = await appRes.json();
                setMyApplications(appData || []);
            }
        } catch (err) {
            console.error('Failed to fetch public ambassador data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPublicData();
    }, []);

    // Course application status lookup
    const getApplicationForCourse = (courseNo: number) => {
        return myApplications.find(a => a.courseNo === courseNo);
    };

    // Filter ambassadors by search query
    const filteredAmbassadors = useMemo(() => {
        if (!searchQuery.trim()) return ambassadors;

        const q = searchQuery.toLowerCase().trim();
        return ambassadors.filter(amb => {
            const nameMatch = amb.userNickNm?.toLowerCase().includes(q) || amb.userNm?.toLowerCase().includes(q);
            const fieldMatch = (amb.activityFieldNm || '').toLowerCase().includes(q) || (amb.introContent || '').toLowerCase().includes(q);
            const matchedCourses = (amb.courses || []).some(c =>
                c.courseTitle?.toLowerCase().includes(q) || (c.courseDesc || '').toLowerCase().includes(q)
            );

            return nameMatch || fieldMatch || matchedCourses;
        });
    }, [ambassadors, searchQuery]);

    // Open Course Detail
    const handleOpenCourseDetail = async (courseNo: number) => {
        try {
            const res = await fetch(`/api/ambassador/public/courses/${courseNo}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedCourseDetail(data);
                setIsDetailModalOpen(true);
            } else {
                const err = await res.json().catch(() => null);
                showAlert(err?.message || '교육과정 정보를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            showAlert('통신 오류가 발생했습니다.');
        }
    };

    // Open Apply Modal
    const handleOpenApplyModal = (course: CourseItem) => {
        if (!currentUserId) {
            showAlert('로그인 후 수강 신청을 이용하실 수 있습니다.');
            return;
        }

        if (course.userId === currentUserId) {
            showAlert('본인이 개설한 교육과정은 신청할 수 없습니다.');
            return;
        }

        const app = getApplicationForCourse(course.courseNo);
        if (app && (app.appStatCd === 'R' || app.appStatCd === 'A')) {
            showAlert(app.appStatCd === 'A' ? '이미 수강 승인된 교육과정입니다.' : '현재 수강 신청 심사 중인 교육과정입니다.');
            return;
        }

        setApplyTargetCourse(course);
        setApplyMemo('');
        setIsApplyModalOpen(true);
    };

    // Submit Course Application
    const handleSubmitApply = async () => {
        if (!applyTargetCourse || !currentUserId) return;

        setIsSubmittingApply(true);
        try {
            const res = await fetch(`/api/ambassador/public/courses/${applyTargetCourse.courseNo}/apply?userId=${currentUserId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appMemo: applyMemo })
            });

            if (res.ok) {
                setIsApplyModalOpen(false);
                showAlert(
                    `[${applyTargetCourse.courseTitle}] 수강 신청이 성공적으로 접수되었습니다!\n\n엠버서더(강사)에게 신청 알림이 전달되었으며, 확인 후 승인 처리가 진행됩니다.`,
                    '수강 신청 완료'
                );
                // Refresh my applications
                const appRes = await fetch(`/api/ambassador/public/my-applications?userId=${currentUserId}`);
                if (appRes.ok) {
                    const appData = await appRes.json();
                    setMyApplications(appData || []);
                }
            } else {
                const err = await res.json().catch(() => null);
                showAlert(err?.message || '수강 신청에 실패했습니다.');
            }
        } catch (err) {
            showAlert('통신 오류가 발생했습니다.');
        } finally {
            setIsSubmittingApply(false);
        }
    };

    // Duration formatter helper
    const formatDuration = (sec: number) => {
        if (!sec || sec <= 0) return '00:00';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-white pb-28 text-gray-800" style={{ fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' }}>
            {!selectedAmbassador ? (
                /* ========================================================================= */
                /* 1. Main Ambassador Showcase (Matching the captured screen)               */
                /* ========================================================================= */
                <div className="max-w-md mx-auto px-4 pt-4">
                    {/* Search Input Box (Cyan border, Search Icon, matching screenshot) */}
                    <div className="relative mb-5">
                        <div className="relative flex items-center w-full bg-white border-2 border-[#00B2D2] rounded-xl px-3.5 py-2.5 shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#00B2D2]/20">
                            <FaSearch className="text-[#00B2D2] w-4 h-4 mr-2.5 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="강의, 엠버서더 명으로 검색"
                                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 text-slate-400 hover:text-slate-600 ml-1"
                                >
                                    <FaTimes className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ambassador 2-Column Grid List */}
                    {isLoading ? (
                        <div className="py-24 text-center text-slate-400">
                            <div className="inline-block w-8 h-8 border-4 border-[#00B2D2] border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-sm font-medium">엠버서더 목록을 불러오는 중입니다...</p>
                        </div>
                    ) : filteredAmbassadors.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                                <FaGraduationCap />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">등록된 엠버서더가 없습니다</h3>
                            <p className="text-xs text-slate-400">
                                {searchQuery ? '검색어와 일치하는 엠버서더가 없습니다.' : '새로운 엠버서더가 곧 공개될 예정입니다!'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-6">
                            {filteredAmbassadors.map((amb) => {
                                return (
                                    <div
                                        key={amb.userId}
                                        onClick={() => handleSelectAmbassador(amb)}
                                        className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-[#00B2D2]/40 transition-all flex flex-col p-2.5 sm:p-3 text-left active:scale-[0.98]"
                                    >
                                        {/* 1. Profile Image with default fallback */}
                                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 shadow-2xs">
                                            {amb.profileImg ? (
                                                <img
                                                    src={amb.profileImg.startsWith('http') ? amb.profileImg : `/uploads${amb.profileImg}`}
                                                    alt={amb.userNickNm}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                /* Default Profile Image */
                                                <div className="w-full h-full bg-gradient-to-br from-slate-100 via-indigo-50/50 to-sky-100 flex flex-col items-center justify-center text-slate-400 p-3">
                                                    <div className="w-12 h-12 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#00B2D2] text-xl font-black mb-1 border border-slate-100">
                                                        {amb.userNickNm?.slice(0, 1) || 'B'}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500">BANDI 엠버서더</span>
                                                </div>
                                            )}

                                            {/* Course Count Badge if available */}
                                            {amb.courses && amb.courses.length > 0 && (
                                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                                                    강의 {amb.courses.length}개
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. Nickname & Activity Field */}
                                        <div className="mt-2.5 flex items-center justify-between gap-1 min-w-0">
                                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#00B2D2] transition-colors">
                                                {amb.userNickNm || amb.userNm}
                                            </span>
                                            {amb.activityFieldNm && (
                                                <span className="px-1.5 py-0.5 bg-[#00B2D2]/10 text-[#008CA6] text-[10px] font-bold rounded-md shrink-0 border border-[#00B2D2]/20">
                                                    {amb.activityFieldNm}
                                                </span>
                                            )}
                                        </div>

                                        {/* 3. Introduction & Activity Plan (Line Clamped) */}
                                        <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 leading-relaxed mt-1 flex-1">
                                            {amb.introContent || '자기소개 및 활동계획이 준비 중입니다.'}
                                        </p>

                                        {/* 4. Portfolio & YouTube / SNS Links (Shown only if present) */}
                                        {(amb.snsUrl || amb.portfolioUrl) && (
                                            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 flex-wrap">
                                                {amb.snsUrl && (
                                                    <a
                                                        href={amb.snsUrl.startsWith('http') ? amb.snsUrl : `https://${amb.snsUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-600 transition-colors"
                                                        title="유튜브 / SNS 링크"
                                                    >
                                                        {amb.snsUrl.includes('youtube') || amb.snsUrl.includes('youtu.be') ? (
                                                            <>
                                                                <FaYoutube className="text-red-500 w-3 h-3 shrink-0" />
                                                                <span className="font-medium truncate max-w-[55px]">유튜브</span>
                                                            </>
                                                        ) : amb.snsUrl.includes('instagram') ? (
                                                            <>
                                                                <FaInstagram className="text-pink-500 w-3 h-3 shrink-0" />
                                                                <span className="font-medium truncate max-w-[55px]">SNS</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaExternalLinkAlt className="text-slate-400 w-2.5 h-2.5 shrink-0" />
                                                                <span className="font-medium truncate max-w-[55px]">SNS</span>
                                                            </>
                                                        )}
                                                    </a>
                                                )}

                                                {amb.portfolioUrl && (
                                                    <a
                                                        href={amb.portfolioUrl.startsWith('http') ? amb.portfolioUrl : `https://${amb.portfolioUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-600 transition-colors"
                                                        title="포트폴리오 링크"
                                                    >
                                                        <FaExternalLinkAlt className="text-[#00B2D2] w-2.5 h-2.5 shrink-0" />
                                                        <span className="font-medium truncate max-w-[55px]">포트폴리오</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* ========================================================================= */
                /* 2. Ambassador Detail & Course List View (Existing functions preserved)     */
                /* ========================================================================= */
                <div className="max-w-md sm:max-w-2xl mx-auto px-4 pt-3">
                    {/* Top Bar with Back Button */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 py-1.5 px-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <span className="text-base leading-none">←</span>
                            <span>엠버서더 목록으로 돌아가기</span>
                        </button>
                    </div>

                    {/* Ambassador Profile Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 mb-5">
                        <div className="flex items-start gap-3.5">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-100 shadow-2xs">
                                    {selectedAmbassador.profileImg ? (
                                        <img
                                            src={selectedAmbassador.profileImg.startsWith('http') ? selectedAmbassador.profileImg : `/uploads${selectedAmbassador.profileImg}`}
                                            alt={selectedAmbassador.userNickNm}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00B2D2] to-[#0284C7] text-white font-bold text-xl">
                                            {selectedAmbassador.userNickNm?.slice(0, 1)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ambassador Info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-base sm:text-lg font-bold text-slate-900">
                                        {selectedAmbassador.userNickNm}
                                    </span>
                                    {selectedAmbassador.activityFieldNm && (
                                        <span className="px-2 py-0.5 bg-[#00B2D2]/10 text-[#008CA6] border border-[#00B2D2]/25 text-[11px] font-semibold rounded-md">
                                            {selectedAmbassador.activityFieldNm}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                                        <FaStar className="w-3 h-3 fill-amber-400" />
                                        {selectedAmbassador.avgRating > 0 ? selectedAmbassador.avgRating.toFixed(1) : '5.0'}
                                        <span className="text-slate-400 font-normal text-[11px]">({selectedAmbassador.totalEvaluations})</span>
                                    </span>
                                </div>

                                {selectedAmbassador.introContent && (
                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                                        {selectedAmbassador.introContent}
                                    </p>
                                )}

                                {/* Social Links & Stats */}
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                    <span>
                                        강좌 <strong className="text-slate-800 font-bold">{selectedAmbassador.courses?.length || 0}</strong>개 · 총 <strong className="text-slate-800 font-bold">{selectedAmbassador.totalLessons || 0}</strong>강
                                    </span>

                                    {(selectedAmbassador.snsUrl || selectedAmbassador.portfolioUrl) && (
                                        <div className="flex items-center gap-1.5">
                                            {selectedAmbassador.snsUrl && (
                                                <a
                                                    href={selectedAmbassador.snsUrl.startsWith('http') ? selectedAmbassador.snsUrl : `https://${selectedAmbassador.snsUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-6 h-6 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md flex items-center justify-center border border-slate-200/80 transition-colors"
                                                    title="SNS 링크"
                                                >
                                                    {selectedAmbassador.snsUrl.includes('youtube') || selectedAmbassador.snsUrl.includes('youtu.be') ? (
                                                        <FaYoutube className="w-3 h-3 text-red-500" />
                                                    ) : selectedAmbassador.snsUrl.includes('instagram') ? (
                                                        <FaInstagram className="w-3 h-3 text-pink-500" />
                                                    ) : (
                                                        <FaExternalLinkAlt className="w-2.5 h-2.5" />
                                                    )}
                                                </a>
                                            )}
                                            {selectedAmbassador.portfolioUrl && (
                                                <a
                                                    href={selectedAmbassador.portfolioUrl.startsWith('http') ? selectedAmbassador.portfolioUrl : `https://${selectedAmbassador.portfolioUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-6 h-6 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md flex items-center justify-center border border-slate-200/80 transition-colors"
                                                    title="포트폴리오 링크"
                                                >
                                                    <FaExternalLinkAlt className="w-2.5 h-2.5" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Courses Header */}
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
                        <FaBook className="w-3 h-3 text-[#00B2D2]" />
                        개설된 교육과정 ({selectedAmbassador.courses?.length || 0})
                    </h4>

                    {/* Course Cards Grid */}
                    {!selectedAmbassador.courses || selectedAmbassador.courses.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs">
                            <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                                <FaGraduationCap />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700 mb-1">등록된 교육과정이 없습니다</h3>
                            <p className="text-xs text-slate-400">
                                해당 엠버서더의 새 강좌가 준비 중입니다.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {selectedAmbassador.courses.map((course) => {
                                const application = getApplicationForCourse(course.courseNo);
                                const isApplied = !!application;
                                const isApproved = application?.appStatCd === 'A';
                                const isPending = application?.appStatCd === 'R';

                                return (
                                    <div
                                        key={course.courseNo}
                                        className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#00B2D2]/50 hover:shadow-md transition-all flex flex-col sm:flex-row overflow-hidden group"
                                    >
                                        {/* Thumbnail */}
                                        <div
                                            className="relative aspect-video sm:w-52 bg-slate-900 cursor-pointer overflow-hidden shrink-0"
                                            onClick={() => handleOpenCourseDetail(course.courseNo)}
                                        >
                                            {course.imgUrl ? (
                                                <img
                                                    src={course.imgUrl.startsWith('http') ? course.imgUrl : `/uploads${course.imgUrl}`}
                                                    alt={course.courseTitle}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                                    <FaBook className="w-7 h-7 text-[#00B2D2] mb-1.5 opacity-80" />
                                                    <span className="text-xs font-semibold text-slate-300 line-clamp-1">{course.courseTitle}</span>
                                                </div>
                                            )}

                                            {/* Price Badge */}
                                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                                {course.eduTypeFg === 'F' ? (
                                                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-md shadow-md">
                                                        무료
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-[#0F172A]/90 text-amber-300 text-[10px] font-black rounded-md shadow-md backdrop-blur-xs border border-amber-400/30">
                                                        ₩{course.courseAmt?.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Sample Video Button */}
                                            {course.movUrl && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setVideoModal({
                                                            isOpen: true,
                                                            title: `[샘플영상] ${course.courseTitle}`,
                                                            url: course.movUrl!.startsWith('http') ? course.movUrl! : `/uploads${course.movUrl}`
                                                        });
                                                    }}
                                                    className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 hover:bg-black text-white text-[10px] font-bold rounded-md flex items-center gap-1 backdrop-blur-md border border-white/20 shadow-md transition-transform active:scale-95"
                                                >
                                                    <FaPlay className="w-2 h-2 text-[#38BDF8]" />
                                                    샘플영상
                                                </button>
                                            )}
                                        </div>

                                        {/* Content & Actions */}
                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                                                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                                                        <FaLayerGroup className="w-3 h-3 text-[#00B2D2]" />
                                                        {course.approvedLessonCount}개 강의
                                                    </span>
                                                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                                                        <FaStar className="w-3 h-3 fill-amber-400" />
                                                        {course.avgRating > 0 ? course.avgRating.toFixed(1) : '5.0'}
                                                    </span>
                                                </div>

                                                <h3
                                                    onClick={() => handleOpenCourseDetail(course.courseNo)}
                                                    className="text-sm font-bold text-slate-900 group-hover:text-[#00B2D2] transition-colors line-clamp-1 cursor-pointer mb-1"
                                                >
                                                    {course.courseTitle}
                                                </h3>
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                                    {course.courseDesc || '상세 커리큘럼을 통해 탄탄한 기초와 실전 테크닉을 배워보세요.'}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenCourseDetail(course.courseNo)}
                                                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors text-center"
                                                >
                                                    강의 커리큘럼
                                                </button>

                                                {isApplied ? (
                                                    <button
                                                        disabled
                                                        className={`py-2 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 ${
                                                            isApproved
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : isPending
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                    >
                                                        <FaCheckCircle className="w-3 h-3" />
                                                        {isApproved ? '수강중' : isPending ? '심사대기' : '신청됨'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenApplyModal(course)}
                                                        className="py-2 px-3.5 bg-[#00B2D2] hover:bg-[#0096B3] text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 active:scale-95"
                                                    >
                                                        수강 신청
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 3. Course Detail & Curriculum Modal */}
            {isDetailModalOpen && selectedCourseDetail && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="px-2 py-0.5 bg-[#00B2D2]/20 border border-[#00B2D2]/40 text-[#38BDF8] text-[10px] font-bold rounded-full shrink-0">
                                    {selectedCourseDetail.ambassador.activityFieldNm || '음악 교육'}
                                </span>
                                <h3 className="text-sm sm:text-base font-bold truncate">
                                    {selectedCourseDetail.course.courseTitle}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-3"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body Scroll Area */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Media Preview & Sticky CTA Bar */}
                            <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-md">
                                {selectedCourseDetail.course.imgUrl ? (
                                    <img
                                        src={selectedCourseDetail.course.imgUrl.startsWith('http') ? selectedCourseDetail.course.imgUrl : `/uploads${selectedCourseDetail.course.imgUrl}`}
                                        alt={selectedCourseDetail.course.courseTitle}
                                        className="w-full aspect-video object-cover"
                                    />
                                ) : (
                                    <div className="w-full aspect-video bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                        <FaBook className="w-12 h-12 text-[#00B2D2] mb-2" />
                                        <span className="text-sm font-semibold text-slate-300">{selectedCourseDetail.course.courseTitle}</span>
                                    </div>
                                )}

                                {/* Overlay Video Button */}
                                {selectedCourseDetail.course.movUrl && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <button
                                            onClick={() => {
                                                setVideoModal({
                                                    isOpen: true,
                                                    title: `[샘플영상] ${selectedCourseDetail.course.courseTitle}`,
                                                    url: selectedCourseDetail.course.movUrl!.startsWith('http') ? selectedCourseDetail.course.movUrl! : `/uploads${selectedCourseDetail.course.movUrl}`
                                                });
                                            }}
                                            className="px-5 py-2.5 bg-[#00B2D2] hover:bg-[#0096B3] text-white font-bold rounded-2xl flex items-center gap-2 shadow-xl hover:scale-105 transition-all text-sm"
                                        >
                                            <FaPlay className="w-3.5 h-3.5" />
                                            샘플 영상 재생하기
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Pricing & CTA Card */}
                            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-slate-700">
                                <div>
                                    <div className="text-xs text-slate-400 font-medium mb-0.5">수강료 안내</div>
                                    <div className="text-xl sm:text-2xl font-black text-amber-300">
                                        {selectedCourseDetail.course.eduTypeFg === 'F' ? (
                                            <span className="text-emerald-400">무료 강좌</span>
                                        ) : (
                                            `₩ ${selectedCourseDetail.course.courseAmt?.toLocaleString()} 원`
                                        )}
                                    </div>
                                </div>

                                {(() => {
                                    const app = getApplicationForCourse(selectedCourseDetail.course.courseNo);
                                    if (app) {
                                        return (
                                            <div className={`py-3 px-6 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 ${
                                                app.appStatCd === 'A'
                                                    ? 'bg-emerald-500 text-white'
                                                    : app.appStatCd === 'R'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-slate-700 text-slate-300'
                                            }`}>
                                                <FaCheckCircle />
                                                {app.appStatCd === 'A' ? '수강 승인 완료 (수강중)' : app.appStatCd === 'R' ? '수강 신청 심사중' : '신청 내역 확인'}
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            onClick={() => {
                                                setIsDetailModalOpen(false);
                                                handleOpenApplyModal(selectedCourseDetail.course);
                                            }}
                                            className="py-3 px-6 bg-gradient-to-r from-[#00B2D2] to-[#0284C7] hover:from-[#0096B3] hover:to-[#0369A1] text-white font-extrabold rounded-xl shadow-lg shadow-[#00B2D2]/30 hover:scale-102 active:scale-98 transition-all text-sm text-center flex items-center justify-center gap-2"
                                        >
                                            <FaGraduationCap className="w-4 h-4" />
                                            수강 신청하기
                                        </button>
                                    );
                                })()}
                            </div>

                            {/* Instructor Mini Card */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 border border-amber-400 shrink-0">
                                    {selectedCourseDetail.ambassador.profileImg ? (
                                        <img
                                            src={selectedCourseDetail.ambassador.profileImg.startsWith('http') ? selectedCourseDetail.ambassador.profileImg : `/uploads${selectedCourseDetail.ambassador.profileImg}`}
                                            alt={selectedCourseDetail.ambassador.userNickNm}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold bg-indigo-600">
                                            {selectedCourseDetail.ambassador.userNickNm.slice(0, 1)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-sm text-slate-900">{selectedCourseDetail.ambassador.userNickNm}</span>
                                        <span className="text-[11px] text-[#00B2D2] font-semibold">{selectedCourseDetail.ambassador.activityFieldNm}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-1">{selectedCourseDetail.ambassador.introContent || '프로 엠버서더 강사'}</p>
                                </div>
                            </div>

                            {/* Course Description */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                                    <FaInfoCircle className="text-[#00B2D2]" />
                                    교육과정 소개
                                </h4>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                    {selectedCourseDetail.course.courseDesc || '등록된 상세 소개가 없습니다.'}
                                </div>
                            </div>

                            {/* Approved Lessons Curriculum */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <FaLayerGroup className="text-[#00B2D2]" />
                                        강의 커리큘럼 ({selectedCourseDetail.lessons.length}강)
                                    </span>
                                </h4>

                                {selectedCourseDetail.lessons.length === 0 ? (
                                    <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                                        등록된 승인 강의 자료가 없습니다.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {selectedCourseDetail.lessons.map((lesson, idx) => (
                                            <div
                                                key={lesson.lessonNo}
                                                className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition-all flex items-center gap-3.5"
                                            >
                                                {/* Seq badge */}
                                                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                                                    {lesson.lessonSeq || (idx + 1)}
                                                </div>

                                                {/* Lesson info */}
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate mb-0.5">
                                                        {lesson.lessonTitle}
                                                    </h5>
                                                    {lesson.lessonDesc && (
                                                        <p className="text-[11px] text-slate-500 line-clamp-1 mb-1">{lesson.lessonDesc}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <FaClock className="w-2.5 h-2.5" />
                                                            {formatDuration(lesson.durationSec)}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="text-emerald-600 font-semibold">본강의 동영상 탑재</span>
                                                    </div>
                                                </div>

                                                {/* Lesson Icon */}
                                                <div className="shrink-0 p-2 text-slate-400">
                                                    <FaVideo className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Reviews / Evaluations */}
                            {selectedCourseDetail.evaluations.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                                        <FaRegCommentDots className="text-[#00B2D2]" />
                                        수강생 후기 ({selectedCourseDetail.evaluations.length})
                                    </h4>
                                    <div className="space-y-2.5">
                                        {selectedCourseDetail.evaluations.map((evalItem) => (
                                            <div key={evalItem.evalNo} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-bold text-slate-800">{evalItem.userNickNm || evalItem.userNm}</span>
                                                    <div className="flex items-center text-amber-400 text-xs">
                                                        {Array.from({ length: evalItem.ratingScore || 5 }).map((_, i) => (
                                                            <FaStar key={i} className="w-3 h-3" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed">{evalItem.reviewContent}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Course Application Modal */}
            {isApplyModalOpen && applyTargetCourse && (
                <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FaGraduationCap className="w-5 h-5 text-[#38BDF8]" />
                                <h3 className="font-bold text-sm sm:text-base">교육과정 수강 신청</h3>
                            </div>
                            <button
                                onClick={() => setIsApplyModalOpen(false)}
                                className="text-slate-400 hover:text-white p-1"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-4 text-left">
                            {/* Course summary */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div className="text-[11px] font-bold text-[#00B2D2] mb-1">신청 대상 교육과정</div>
                                <div className="text-sm font-bold text-slate-900 mb-1">{applyTargetCourse.courseTitle}</div>
                                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60 mt-2">
                                    <span>수강료</span>
                                    <strong className="text-slate-900 font-bold text-sm">
                                        {applyTargetCourse.eduTypeFg === 'F' ? (
                                            <span className="text-emerald-600 font-bold">무료 (지원 과정)</span>
                                        ) : (
                                            `₩ ${applyTargetCourse.courseAmt?.toLocaleString()} 원`
                                        )}
                                    </strong>
                                </div>
                            </div>

                            {/* Applicant Info */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">신청자 (본인)</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${currentUserNickNm} (${currentUserId})`}
                                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        학습 목표 및 남기실 말씀 <span className="text-slate-400 font-normal">(선택)</span>
                                    </label>
                                    <textarea
                                        value={applyMemo}
                                        onChange={(e) => setApplyMemo(e.target.value)}
                                        placeholder="강사님께 전달하고 싶은 현재 악기 연주 경력이나 배우고 싶은 곡/목표를 적어주세요."
                                        rows={3}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B2D2] resize-none"
                                    />
                                </div>
                            </div>

                            {/* Notice box */}
                            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 leading-relaxed flex items-start gap-2">
                                <FaInfoCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    신청 완료 시 엠버서더(강사)에게 실시간 푸시 알림이 발송되며, 강사 승인 후 본격적인 수강 및 1:1 학습 피드백이 시작됩니다.
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsApplyModalOpen(false)}
                                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmittingApply}
                                    onClick={handleSubmitApply}
                                    className="w-full py-3 bg-[#00B2D2] hover:bg-[#0096B3] text-white rounded-xl font-bold text-xs shadow-md shadow-[#00B2D2]/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {isSubmittingApply ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <FaUserCheck className="w-3.5 h-3.5" />
                                            수강 신청 완료
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Video Player Modal */}
            {videoModal.isOpen && (
                <div className="fixed inset-0 z-[12000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
                            <h3 className="font-bold text-xs sm:text-sm text-slate-200 truncate flex items-center gap-2">
                                <FaPlay className="text-[#38BDF8] w-3 h-3" />
                                {videoModal.title}
                            </h3>
                            <button
                                onClick={() => setVideoModal({ isOpen: false, title: '', url: '' })}
                                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-2"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="aspect-video w-full bg-black flex items-center justify-center">
                            <video
                                src={videoModal.url}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 7. Common Alert / Confirm Modal */}
            <CommonModal
                isOpen={commonModal.isOpen}
                type={commonModal.type}
                title={commonModal.title}
                message={commonModal.message}
                onConfirm={() => {
                    setCommonModal(prev => ({ ...prev, isOpen: false }));
                    if (commonModal.onConfirm) commonModal.onConfirm();
                }}
                onCancel={() => {
                    setCommonModal(prev => ({ ...prev, isOpen: false }));
                }}
            />
        </div>
    );
};

export default Membersador;
