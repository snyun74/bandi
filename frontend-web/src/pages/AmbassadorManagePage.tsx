import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaChevronLeft, FaPlus, FaBook, FaUsers, FaStar, FaVideo,
    FaCheck, FaTimes, FaTrash, FaEye, FaPlay, FaExclamationTriangle,
    FaMoneyBillWave, FaClock, FaCheckCircle, FaTimesCircle, FaHeart,
    FaImage, FaFilm, FaSpinner
} from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import { uploadFileApi } from '../utils/fileUtils';

interface CourseItem {
    courseNo: number;
    userId: string;
    courseTitle: string;
    courseDesc?: string;
    eduTypeFg: 'F' | 'P';
    courseAmt: number;
    attachNoImg?: number;
    imgUrl?: string;
    attachNoMov?: number;
    movUrl?: string;
    courseStatCd: 'R' | 'A' | 'D';
    insDtime: string;
    lessonCount: number;
    approvedLessonCount: number;
    evaluationCount: number;
    avgRating: number;
}

interface LessonItem {
    lessonNo: number;
    courseNo: number;
    lessonSeq: number;
    lessonTitle: string;
    lessonDesc?: string;
    attachNoMov: number;
    videoUrl?: string;
    attachNoImg?: number;
    imgUrl?: string;
    durationSec: number;
    lessonStatCd: 'R' | 'A' | 'D';
    insDtime: string;
}

interface EvaluationItem {
    evalNo: number;
    courseNo: number;
    userId: string;
    userNm: string;
    userNickNm: string;
    ratingScore: number;
    reviewContent?: string;
    likeFg: string;
    insDtime: string;
}

interface ApplicationItem {
    appNo: number;
    courseNo: number;
    courseTitle: string;
    eduTypeFg: 'F' | 'P';
    userId: string;
    userNm: string;
    userNickNm: string;
    phoneNo?: string;
    paymentAmt: number;
    paymentPgKey?: string;
    paymentStatFg: 'F' | 'R' | 'P' | 'C';
    appStatCd: 'R' | 'A' | 'J';
    appRejectBigo?: string;
    insDtime: string;
}

const AmbassadorManagePage: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId') || '';

    const [activeTab, setActiveTab] = useState<'course' | 'application'>('course');
    const [loading, setLoading] = useState<boolean>(true);

    // Data lists
    const [courses, setCourses] = useState<CourseItem[]>([]);
    const [applications, setApplications] = useState<ApplicationItem[]>([]);

    // Modals & Selections
    const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<CourseItem | null>(null);
    const [lessons, setLessons] = useState<LessonItem[]>([]);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState<boolean>(false);

    // Create Course Modal
    const [isCreateCourseOpen, setIsCreateCourseOpen] = useState<boolean>(false);
    const [courseForm, setCourseForm] = useState({
        courseTitle: '',
        courseDesc: '',
        eduTypeFg: 'F' as 'F' | 'P',
        courseAmt: 0,
        attachNoImg: null as number | null,
        imgPreviewUrl: '',
        imgFileName: '',
        attachNoMov: null as number | null,
        movPreviewUrl: '',
        movFileName: ''
    });
    const [isImgUploading, setIsImgUploading] = useState<boolean>(false);
    const [isMovUploading, setIsMovUploading] = useState<boolean>(false);

    // Create Lesson Modal
    const [isCreateLessonOpen, setIsCreateLessonOpen] = useState<boolean>(false);
    const [lessonForm, setLessonForm] = useState({
        lessonSeq: 1,
        lessonTitle: '',
        lessonDesc: '',
        attachNoMov: null as number | null,
        movFileName: '',
        movPreviewUrl: '',
        attachNoImg: null as number | null,
        imgFileName: '',
        imgPreviewUrl: '',
        durationMinutes: 15
    });
    const [isLessonMovUploading, setIsLessonMovUploading] = useState<boolean>(false);
    const [isLessonImgUploading, setIsLessonImgUploading] = useState<boolean>(false);

    // Evaluation Modal
    const [isEvalModalOpen, setIsEvalModalOpen] = useState<boolean>(false);
    const [evalList, setEvalList] = useState<EvaluationItem[]>([]);
    const [evalCourseTitle, setEvalCourseTitle] = useState<string>('');

    // Reject Application Modal
    const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
    const [selectedAppNo, setSelectedAppNo] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState<string>('');

    // Video Player Modal (샘플영상 / 강의영상 재생용)
    const [videoPlayerModal, setVideoPlayerModal] = useState<{
        isOpen: boolean;
        title: string;
        videoUrl: string;
    }>({
        isOpen: false,
        title: '',
        videoUrl: ''
    });

    // Common Alert/Confirm Modal
    const [commonModal, setCommonModal] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title?: string;
        message: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'alert',
        message: ''
    });

    useEffect(() => {
        if (!userId) {
            navigate('/login');
            return;
        }
        loadData();
    }, [userId, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'course') {
                const res = await fetch(`/api/ambassador/courses?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                }
            } else {
                const res = await fetch(`/api/ambassador/applications?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setApplications(data);
                }
            }
        } catch (err) {
            console.error('Failed to load ambassador data', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Course Actions ---

    const handleOpenCreateCourse = () => {
        setCourseForm({
            courseTitle: '',
            courseDesc: '',
            eduTypeFg: 'F',
            courseAmt: 0,
            attachNoImg: null,
            imgPreviewUrl: '',
            imgFileName: '',
            attachNoMov: null,
            movPreviewUrl: '',
            movFileName: ''
        });
        setIsCreateCourseOpen(true);
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImgUploading(true);
        try {
            const res = await uploadFileApi(file, 'ambassador', userId);
            setCourseForm(prev => ({
                ...prev,
                attachNoImg: res.attachNo,
                imgPreviewUrl: res.fullUrl,
                imgFileName: file.name
            }));
        } catch (err: any) {
            showAlert(err.message || '이미지 업로드에 실패했습니다.');
        } finally {
            setIsImgUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveImage = () => {
        setCourseForm(prev => ({
            ...prev,
            attachNoImg: null,
            imgPreviewUrl: '',
            imgFileName: ''
        }));
    };

    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsMovUploading(true);
        try {
            const res = await uploadFileApi(file, 'ambassador', userId);
            setCourseForm(prev => ({
                ...prev,
                attachNoMov: res.attachNo,
                movPreviewUrl: res.fullUrl,
                movFileName: file.name
            }));
        } catch (err: any) {
            showAlert(err.message || '동영상 업로드에 실패했습니다.');
        } finally {
            setIsMovUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveVideo = () => {
        setCourseForm(prev => ({
            ...prev,
            attachNoMov: null,
            movPreviewUrl: '',
            movFileName: ''
        }));
    };

    const handleCreateCourseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseForm.courseTitle.trim()) {
            showAlert('교육과정명을 입력해 주세요.');
            return;
        }
        if (courseForm.eduTypeFg === 'P' && (!courseForm.courseAmt || courseForm.courseAmt <= 0)) {
            showAlert('유상 과정의 수강료를 올바르게 입력해 주세요.');
            return;
        }

        try {
            const payload = {
                courseTitle: courseForm.courseTitle,
                courseDesc: courseForm.courseDesc,
                eduTypeFg: courseForm.eduTypeFg,
                courseAmt: courseForm.courseAmt,
                attachNoImg: courseForm.attachNoImg,
                attachNoMov: courseForm.attachNoMov
            };

            const res = await fetch(`/api/ambassador/courses?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsCreateCourseOpen(false);
                showAlert('신규 교육과정이 등록(대기)되었습니다.\n강의자료를 1개 이상 등록 후 승인(공개)해 주세요.');
                loadData();
            } else {
                const errData = await res.json().catch(() => null);
                showAlert(errData?.message || '교육과정 등록 실패');
            }
        } catch (err) {
            showAlert('통신 오류가 발생했습니다.');
        }
    };

    const handleUpdateCourseStatus = async (courseNo: number, status: 'A' | 'D') => {
        const targetCourse = courses.find(c => c.courseNo === courseNo);
        if (status === 'A' && targetCourse && (targetCourse.approvedLessonCount || 0) === 0) {
            showAlert('승인된 강의 자료(차시)가 최소 1건 이상 존재해야 교육과정을 공개 승인할 수 있습니다.\n[강의차시 관리]에서 강의자료를 먼저 승인해 주세요.');
            return;
        }

        const confirmMsg = status === 'A'
            ? '해당 교육과정을 승인 및 공개하시겠습니까?'
            : '해당 교육과정을 비공개(삭제) 처리하시겠습니까?';

        showConfirm(confirmMsg, async () => {
            try {
                const res = await fetch(`/api/ambassador/courses/${courseNo}/status?userId=${userId}&status=${status}`, {
                    method: 'PUT'
                });

                if (res.ok) {
                    showAlert(status === 'A' ? '교육과정이 성공적으로 공개 승인되었습니다.' : '교육과정이 비공개 처리되었습니다.');
                    loadData();
                } else {
                    const errData = await res.json().catch(() => null);
                    showAlert(errData?.message || '상태 변경 실패');
                }
            } catch (err) {
                showAlert('통신 오류가 발생했습니다.');
            }
        });
    };

    // --- Lessons Management ---

    const handleOpenLessons = async (course: CourseItem) => {
        setSelectedCourseForLessons(course);
        setIsLessonModalOpen(true);
        await loadLessons(course.courseNo);
    };

    const loadLessons = async (courseNo: number) => {
        try {
            const res = await fetch(`/api/ambassador/courses/${courseNo}/lessons`);
            if (res.ok) {
                const data = await res.json();
                setLessons(data);
            }
        } catch (err) {
            console.error('Failed to load lessons', err);
        }
    };

    const handleOpenCreateLesson = () => {
        const nextSeq = lessons.length > 0 ? lessons[lessons.length - 1].lessonSeq + 1 : 1;
        setLessonForm({
            lessonSeq: nextSeq,
            lessonTitle: '',
            lessonDesc: '',
            attachNoMov: null,
            movFileName: '',
            movPreviewUrl: '',
            attachNoImg: null,
            imgFileName: '',
            imgPreviewUrl: '',
            durationMinutes: 15
        });
        setIsCreateLessonOpen(true);
    };

    const handleLessonMovChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLessonMovUploading(true);
        try {
            const res = await uploadFileApi(file, 'ambassador', userId);
            setLessonForm(prev => ({
                ...prev,
                attachNoMov: res.attachNo,
                movFileName: file.name,
                movPreviewUrl: res.fullUrl
            }));
        } catch (err: any) {
            showAlert(err.message || '동영상 업로드에 실패했습니다.');
        } finally {
            setIsLessonMovUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveLessonMov = () => {
        setLessonForm(prev => ({
            ...prev,
            attachNoMov: null,
            movFileName: '',
            movPreviewUrl: ''
        }));
    };

    const handleLessonImgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLessonImgUploading(true);
        try {
            const res = await uploadFileApi(file, 'ambassador', userId);
            setLessonForm(prev => ({
                ...prev,
                attachNoImg: res.attachNo,
                imgFileName: file.name,
                imgPreviewUrl: res.fullUrl
            }));
        } catch (err: any) {
            showAlert(err.message || '이미지 업로드에 실패했습니다.');
        } finally {
            setIsLessonImgUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveLessonImg = () => {
        setLessonForm(prev => ({
            ...prev,
            attachNoImg: null,
            imgFileName: '',
            imgPreviewUrl: ''
        }));
    };

    const handleCreateLessonSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseForLessons) return;

        if (!lessonForm.lessonTitle.trim()) {
            showAlert('강의 제목을 입력해 주세요.');
            return;
        }
        if (!lessonForm.attachNoMov) {
            showAlert('본강의 동영상 파일(ATTACH_NO_MOV)은 필수 등록 항목입니다. 동영상 파일을 첨부해 주세요.');
            return;
        }

        try {
            const payload = {
                lessonSeq: lessonForm.lessonSeq,
                lessonTitle: lessonForm.lessonTitle.trim(),
                lessonDesc: lessonForm.lessonDesc.trim(),
                attachNoMov: lessonForm.attachNoMov,
                attachNoImg: lessonForm.attachNoImg,
                durationSec: (lessonForm.durationMinutes || 0) * 60
            };

            const res = await fetch(`/api/ambassador/courses/${selectedCourseForLessons.courseNo}/lessons?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsCreateLessonOpen(false);
                showAlert('강의 자료가 정상적으로 등록되었습니다.');
                loadLessons(selectedCourseForLessons.courseNo);
                loadData(); // update course lesson count
            } else {
                const errData = await res.json().catch(() => null);
                showAlert(errData?.message || '강의 자료 등록 실패');
            }
        } catch (err) {
            showAlert('통신 오류가 발생했습니다.');
        }
    };

    const handleUpdateLessonStatus = async (lessonNo: number, status: 'A' | 'D') => {
        try {
            const res = await fetch(`/api/ambassador/lessons/${lessonNo}/status?userId=${userId}&status=${status}`, {
                method: 'PUT'
            });
            if (res.ok) {
                if (selectedCourseForLessons) {
                    loadLessons(selectedCourseForLessons.courseNo);
                    loadData();
                }
            } else {
                showAlert('강의 상태 변경 실패');
            }
        } catch (err) {
            showAlert('통신 오류가 발생했습니다.');
        }
    };

    // --- Evaluations Management ---

    const handleOpenEvaluations = async (courseNo: number, title: string) => {
        setEvalCourseTitle(title);
        setIsEvalModalOpen(true);
        try {
            const res = await fetch(`/api/ambassador/courses/${courseNo}/evaluations`);
            if (res.ok) {
                const data = await res.json();
                setEvalList(data);
            }
        } catch (err) {
            console.error('Failed to load evaluations', err);
        }
    };

    // --- Application Actions ---

    const handleUpdatePayment = async (appNo: number) => {
        showConfirm('해당 수강 신청의 결제완료 처리를 진행하시겠습니까?', async () => {
            try {
                const res = await fetch(`/api/ambassador/applications/${appNo}/payment?status=P&userId=${userId}`, {
                    method: 'PUT'
                });
                if (res.ok) {
                    showAlert('결제완료 처리되었습니다. 이제 승인 또는 거절 처리가 가능합니다.');
                    loadData();
                } else {
                    showAlert('결제완료 처리 실패');
                }
            } catch (err) {
                showAlert('통신 오류가 발생했습니다.');
            }
        });
    };

    const handleApproveApplication = async (appNo: number) => {
        showConfirm('수강 신청을 최종 승인하시겠습니까?', async () => {
            try {
                const res = await fetch(`/api/ambassador/applications/${appNo}/status?status=A&userId=${userId}`, {
                    method: 'PUT'
                });
                if (res.ok) {
                    showAlert('수강 신청이 승인되었습니다.');
                    loadData();
                } else {
                    const errData = await res.json().catch(() => null);
                    showAlert(errData?.message || '승인 처리 실패');
                }
            } catch (err) {
                showAlert('통신 오류가 발생했습니다.');
            }
        });
    };

    const handleOpenRejectApplication = (appNo: number) => {
        setSelectedAppNo(appNo);
        setRejectReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectApplicationSubmit = async () => {
        if (!selectedAppNo) return;
        try {
            const res = await fetch(`/api/ambassador/applications/${selectedAppNo}/status?status=J&rejectBigo=${encodeURIComponent(rejectReason)}&userId=${userId}`, {
                method: 'PUT'
            });
            if (res.ok) {
                setIsRejectModalOpen(false);
                showAlert('수강 신청이 거절 처리되었습니다.');
                loadData();
            } else {
                showAlert('거절 처리 실패');
            }
        } catch (err) {
            showAlert('통신 오류가 발생했습니다.');
        }
    };

    // Helper alerts
    const showAlert = (message: string) => {
        setCommonModal({
            isOpen: true,
            type: 'alert',
            message
        });
    };

    const showConfirm = (message: string, onConfirm: () => void) => {
        setCommonModal({
            isOpen: true,
            type: 'confirm',
            message,
            onConfirm
        });
    };

    const formatPhone = (phone?: string) => {
        if (!phone) return '';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11) return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        if (clean.length === 10) return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        return phone;
    };

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] font-['Pretendard'] overflow-hidden">
            {/* Top Bar */}
            <div className="shrink-0 bg-white px-4 py-3.5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => navigate('/main/profile')}
                        className="p-1 -ml-1 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <FaChevronLeft size={18} />
                    </button>
                    <h1 className="text-[16px] font-extrabold text-[#003C48] flex items-center gap-1.5">
                        <FaBook className="text-[#00BDF8]" size={16} />
                        엠버서더 교육강의 관리
                    </h1>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="shrink-0 bg-white px-3 py-1.5 border-b border-gray-100 flex gap-2">
                <button
                    onClick={() => setActiveTab('course')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'course'
                            ? 'bg-[#003C48] text-white shadow-sm'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    📚 교육과정관리 {courses.length > 0 && `(${courses.length})`}
                </button>
                <button
                    onClick={() => setActiveTab('application')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'application'
                            ? 'bg-[#003C48] text-white shadow-sm'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    👥 교육신청관리 {applications.length > 0 && `(${applications.length})`}
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {/* TAB 1: 교육과정관리 */}
                {activeTab === 'course' && (
                    <div className="space-y-3">
                        {/* Header with Add Button */}
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-bold text-gray-600">
                                등록된 교육과정 목록
                            </span>
                            <button
                                onClick={handleOpenCreateCourse}
                                className="px-3.5 py-2 bg-[#00BDF8] text-white rounded-xl text-xs font-bold hover:bg-[#009fd4] active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <FaPlus size={10} /> 신규 교육과정 등록
                            </button>
                        </div>

                        {/* Courses List */}
                        {courses.length === 0 ? (
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center space-y-2">
                                <p className="text-xs text-gray-400">등록된 교육과정이 없습니다.</p>
                                <p className="text-[11px] text-gray-400">
                                    우측 상단의 <strong>[신규 교육과정 등록]</strong> 버튼을 눌러 과정을 신설해 보세요!
                                </p>
                            </div>
                        ) : (
                            courses.map((course) => {
                                const isReq = course.courseStatCd === 'R';
                                const isAppr = course.courseStatCd === 'A';
                                const isDel = course.courseStatCd === 'D';

                                return (
                                    <div
                                        key={course.courseNo}
                                        className={`bg-white rounded-3xl p-4 border transition-all shadow-sm flex flex-col gap-3 ${
                                            isReq
                                                ? 'border-[#00BDF8]/40 bg-[#00BDF8]/5'
                                                : isAppr
                                                ? 'border-gray-100'
                                                : 'border-gray-200 bg-gray-50/60 opacity-80'
                                        }`}
                                    >
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start gap-3">
                                            {course.imgUrl ? (
                                                <img
                                                    src={course.imgUrl}
                                                    alt={course.courseTitle}
                                                    onClick={() => handleOpenLessons(course)}
                                                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-100 shadow-xs cursor-pointer"
                                                />
                                            ) : (
                                                <div
                                                    onClick={() => handleOpenLessons(course)}
                                                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-100 border border-cyan-100 flex flex-col items-center justify-center text-[#003C48] shrink-0 cursor-pointer shadow-xs"
                                                    title="기본 교육과정 이미지"
                                                >
                                                    <FaBook className="text-[#00BDF8]" size={20} />
                                                    <span className="text-[9px] font-bold text-gray-500 mt-0.5">교육과정</span>
                                                </div>
                                            )}

                                            <div
                                                onClick={() => handleOpenLessons(course)}
                                                className="cursor-pointer flex-1 min-w-0"
                                            >
                                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                                                            course.eduTypeFg === 'P'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}
                                                    >
                                                        {course.eduTypeFg === 'P' ? `유상 (${course.courseAmt.toLocaleString()}원)` : '무상 교육'}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                            isReq
                                                                ? 'bg-amber-100 text-amber-700 animate-pulse'
                                                                : isAppr
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-200 text-gray-600'
                                                        }`}
                                                    >
                                                        {isReq ? '● 등록 대기' : isAppr ? '공개 승인' : '비공개/삭제'}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-[#003C48] truncate hover:text-[#00BDF8] transition-colors">
                                                    {course.courseTitle}
                                                </h3>
                                                {course.courseDesc && (
                                                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                                        {course.courseDesc}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                                            <button
                                                onClick={() => handleOpenLessons(course)}
                                                className="flex items-center gap-1.5 text-gray-600 hover:text-[#00BDF8] font-medium"
                                            >
                                                <FaBook className="text-[#00BDF8]" size={12} />
                                                <span>강의 차시 <strong>{course.lessonCount}개</strong></span>
                                            </button>

                                            <button
                                                onClick={() => handleOpenEvaluations(course.courseNo, course.courseTitle)}
                                                className="flex items-center gap-1 text-gray-600 hover:text-amber-500 font-medium"
                                            >
                                                <FaStar className="text-amber-400" size={12} />
                                                <span>{course.avgRating > 0 ? course.avgRating.toFixed(1) : '-'}</span>
                                                <span className="text-gray-400 text-[10px]">({course.evaluationCount}건)</span>
                                            </button>
                                        </div>

                                        {/* Action Buttons Row */}
                                        <div className="flex gap-2 pt-1">
                                            {course.movUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setVideoPlayerModal({
                                                        isOpen: true,
                                                        title: `[교육과정 샘플영상] ${course.courseTitle}`,
                                                        videoUrl: course.movUrl!
                                                    })}
                                                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
                                                    title="샘플 동영상 시청"
                                                >
                                                    <FaFilm size={11} className="text-purple-600" /> 샘플영상
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleOpenLessons(course)}
                                                className="flex-1 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <FaVideo size={11} className="text-[#00BDF8]" /> 강의차시 관리 ({course.lessonCount})
                                            </button>

                                            {isAppr ? (
                                                <button
                                                    onClick={() => handleUpdateCourseStatus(course.courseNo, 'D')}
                                                    className="px-3.5 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all shrink-0"
                                                >
                                                    비공개
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUpdateCourseStatus(course.courseNo, 'A')}
                                                    className="px-3.5 py-2 bg-[#003C48] text-white rounded-xl text-xs font-bold hover:bg-[#002830] transition-all shadow-sm shrink-0"
                                                >
                                                    공개 승인
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* TAB 2: 교육신청관리 */}
                {activeTab === 'application' && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-bold text-gray-600">
                                유저 교육 신청 목록
                            </span>
                            <span className="text-[11px] text-gray-400">
                                총 {applications.length}건
                            </span>
                        </div>

                        {applications.length === 0 ? (
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
                                <p className="text-xs text-gray-400">접수된 교육 신청 내역이 없습니다.</p>
                            </div>
                        ) : (
                            applications.map((app) => {
                                const isReq = app.appStatCd === 'R';
                                const isAppr = app.appStatCd === 'A';
                                const isRej = app.appStatCd === 'J';

                                const isPaidType = app.eduTypeFg === 'P';
                                const isPayComplete = app.paymentStatFg === 'P';

                                return (
                                    <div
                                        key={app.appNo}
                                        className={`bg-white rounded-3xl p-4 border transition-all shadow-sm flex flex-col gap-2.5 ${
                                            isReq
                                                ? 'border-[#00BDF8]/50 bg-[#00BDF8]/5'
                                                : isAppr
                                                ? 'border-gray-100'
                                                : 'border-gray-200 bg-gray-50/60'
                                        }`}
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <span className="text-xs font-bold text-[#003C48] block">
                                                    {app.courseTitle}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    신청자: {app.userNickNm || app.userNm} ({app.userId})
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                        isReq
                                                            ? 'bg-amber-100 text-amber-700 animate-pulse'
                                                            : isAppr
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-600'
                                                    }`}
                                                >
                                                    {isReq ? '● 승인 대기' : isAppr ? '승인 완료' : '거절/반려'}
                                                </span>
                                                {app.phoneNo && (
                                                    <span className="text-[10px] text-gray-500 font-medium tracking-tight">
                                                        {formatPhone(app.phoneNo)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100 my-0.5" />

                                        {/* Details */}
                                        <div className="flex flex-col gap-1 text-[11px] text-gray-600">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">교육 구분</span>
                                                <span className="font-semibold text-gray-800">
                                                    {app.eduTypeFg === 'P' ? `유상 (${app.paymentAmt.toLocaleString()}원)` : '무상 교육'}
                                                </span>
                                            </div>

                                            {isPaidType && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">결제 상태</span>
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                                            isPayComplete
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {isPayComplete ? '결제 완료' : '결제 대기 (미입금)'}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between">
                                                <span className="text-gray-400">신청 일시</span>
                                                <span className="text-gray-500 text-[10px]">
                                                    {app.insDtime.substring(0, 4)}-{app.insDtime.substring(4, 6)}-{app.insDtime.substring(6, 8)} {app.insDtime.substring(8, 10)}:{app.insDtime.substring(10, 12)}
                                                </span>
                                            </div>

                                            {app.appRejectBigo && (
                                                <div className="mt-1 p-2 bg-red-50 text-red-500 rounded-xl text-[10px]">
                                                    <strong>거절 사유:</strong> {app.appRejectBigo}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {isReq && (
                                            <div className="pt-2 border-t border-gray-100 space-y-1.5">
                                                {/* 유상건이고 아직 결제완료가 아닌 경우: 결제완료 처리 버튼 노출 */}
                                                {isPaidType && !isPayComplete && (
                                                    <button
                                                        onClick={() => handleUpdatePayment(app.appNo)}
                                                        className="w-full py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <FaMoneyBillWave size={12} /> 결제 확인 및 완료 처리
                                                    </button>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        disabled={isPaidType && !isPayComplete}
                                                        onClick={() => handleApproveApplication(app.appNo)}
                                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                                            isPaidType && !isPayComplete
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                                                : 'bg-[#003C48] text-white hover:bg-[#002830]'
                                                        }`}
                                                    >
                                                        {isPaidType && !isPayComplete ? '결제완료 후 승인 가능' : '신청 승인'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenRejectApplication(app.appNo)}
                                                        className="flex-1 py-2.5 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                                                    >
                                                        신청 거절
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* --- MODAL 1: 신규 교육과정 등록 모달 --- */}
            {isCreateCourseOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h2 className="text-sm font-bold text-[#003C48] flex items-center gap-1.5">
                                <FaPlus className="text-[#00BDF8]" /> 신규 교육과정 등록
                            </h2>
                            <button onClick={() => setIsCreateCourseOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCourseSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    교육과정명 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={courseForm.courseTitle}
                                    onChange={(e) => setCourseForm({ ...courseForm, courseTitle: e.target.value })}
                                    placeholder="예: 4주 완성 실전 밴드 베이스 마스터 클래스"
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    교육과정 설명
                                </label>
                                <textarea
                                    value={courseForm.courseDesc}
                                    onChange={(e) => setCourseForm({ ...courseForm, courseDesc: e.target.value })}
                                    placeholder="과정 커리큘럼 및 수강 대상, 준비물 등을 자세히 작성해 주세요."
                                    rows={4}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white resize-none leading-relaxed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    교육 구분 (유/무상) <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCourseForm({ ...courseForm, eduTypeFg: 'F', courseAmt: 0 })}
                                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                            courseForm.eduTypeFg === 'F'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        무상 교육 (0원)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCourseForm({ ...courseForm, eduTypeFg: 'P' })}
                                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                            courseForm.eduTypeFg === 'P'
                                                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        유상 교육 (수강료 책정)
                                    </button>
                                </div>
                            </div>

                            {courseForm.eduTypeFg === 'P' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        수강료 (원) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={courseForm.courseAmt > 0 ? courseForm.courseAmt.toLocaleString() : ''}
                                        onChange={(e) => {
                                            const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                                            setCourseForm({ ...courseForm, courseAmt: num });
                                        }}
                                        placeholder="예: 50,000"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white text-right font-bold"
                                    />
                                </div>
                            )}

                            {/* 교육 샘플 이미지 등록 (ATTACH_NO_IMG) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                                    <FaImage className="text-[#00BDF8]" />
                                    <span>교육 샘플 이미지 (ATTACH_NO_IMG)</span>
                                    <span className="text-[10px] text-gray-400 font-normal">(선택)</span>
                                </label>
                                {courseForm.imgPreviewUrl ? (
                                    <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <img
                                                src={courseForm.imgPreviewUrl}
                                                alt="교육 샘플 이미지 미리보기"
                                                className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                    {courseForm.imgFileName || '업로드된 이미지'}
                                                </p>
                                                <p className="text-[10px] text-green-600 font-bold">✓ 첨부 완료 (ID: {courseForm.attachNoImg})</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                                            title="이미지 삭제"
                                        >
                                            <FaTimes size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-[#00BDF8] rounded-2xl p-4 bg-gray-50/60 hover:bg-[#00BDF8]/5 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageFileChange}
                                            disabled={isImgUploading}
                                            className="hidden"
                                        />
                                        {isImgUploading ? (
                                            <div className="flex items-center gap-2 text-xs text-[#00BDF8] font-medium py-1">
                                                <FaSpinner className="animate-spin" />
                                                <span>이미지 업로드 중...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-center">
                                                <FaImage className="text-gray-400" size={20} />
                                                <span className="text-xs font-semibold text-gray-700">샘플 이미지 파일 선택</span>
                                                <span className="text-[10px] text-gray-400">JPG, PNG, GIF 등 이미지 파일 첨부</span>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>

                            {/* 교육 샘플 동영상 등록 (ATTACH_NO_MOV) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                                    <FaFilm className="text-purple-500" />
                                    <span>교육 샘플 동영상 (ATTACH_NO_MOV)</span>
                                    <span className="text-[10px] text-gray-400 font-normal">(선택)</span>
                                </label>
                                {courseForm.movPreviewUrl ? (
                                    <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                                <FaFilm size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                    {courseForm.movFileName || '업로드된 동영상'}
                                                </p>
                                                <p className="text-[10px] text-purple-600 font-bold">✓ 첨부 완료 (ID: {courseForm.attachNoMov})</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveVideo}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                                            title="동영상 삭제"
                                        >
                                            <FaTimes size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-purple-400 rounded-2xl p-4 bg-gray-50/60 hover:bg-purple-50/30 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleVideoFileChange}
                                            disabled={isMovUploading}
                                            className="hidden"
                                        />
                                        {isMovUploading ? (
                                            <div className="flex items-center gap-2 text-xs text-purple-600 font-medium py-1">
                                                <FaSpinner className="animate-spin" />
                                                <span>동영상 업로드 중...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-center">
                                                <FaFilm className="text-gray-400" size={20} />
                                                <span className="text-xs font-semibold text-gray-700">샘플 동영상 파일 선택</span>
                                                <span className="text-[10px] text-gray-400">MP4, MOV, WebM 등 영상 파일 첨부</span>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-[#00BDF8] text-white rounded-xl text-xs font-bold hover:bg-[#009fd4] transition-all shadow-sm"
                                >
                                    등록하기 (등록대기)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateCourseOpen(false)}
                                    className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: 강의자료(차시) 목록 모달 --- */}
            {isLessonModalOpen && selectedCourseForLessons && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-5 w-full max-w-lg max-h-[85vh] flex flex-col gap-3.5 shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0">
                            <div>
                                <span className="text-[10px] text-gray-400 block">강의자료(차시) 관리</span>
                                <h2 className="text-sm font-bold text-[#003C48] truncate max-w-[260px]">
                                    {selectedCourseForLessons.courseTitle}
                                </h2>
                            </div>
                            <button onClick={() => setIsLessonModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <FaTimes size={16} />
                            </button>
                        </div>

                        {/* Top Add Button */}
                        <div className="flex justify-between items-center shrink-0">
                            <span className="text-xs text-gray-500 font-medium">
                                총 <strong>{lessons.length}개</strong>의 차시 등록됨
                            </span>
                            <button
                                onClick={handleOpenCreateLesson}
                                className="px-3 py-1.5 bg-[#00BDF8] text-white rounded-xl text-xs font-bold hover:bg-[#009fd4] transition-all shadow-xs flex items-center gap-1"
                            >
                                <FaPlus size={10} /> 강의자료 등록
                            </button>
                        </div>

                        {/* Lesson Cards List */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                            {lessons.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-xs text-gray-400">등록된 강의자료가 없습니다.</p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        우측 상단의 <strong>[강의자료 등록]</strong>을 눌러 1강을 등록해 주세요.
                                    </p>
                                </div>
                            ) : (
                                lessons.map((l) => {
                                    const isAppr = l.lessonStatCd === 'A';
                                    const isReq = l.lessonStatCd === 'R';
                                    const minutes = Math.floor(l.durationSec / 60);

                                    return (
                                        <div
                                            key={l.lessonNo}
                                            className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/80 flex flex-col gap-2.5"
                                        >
                                            <div className="flex justify-between items-start gap-2.5">
                                                {l.imgUrl && (
                                                    <img
                                                        src={l.imgUrl}
                                                        alt={l.lessonTitle}
                                                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200 shadow-2xs"
                                                    />
                                                )}
                                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                                    <span className="w-6 h-6 rounded-full bg-[#003C48] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                        {l.lessonSeq}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-xs font-bold text-[#003C48] truncate">
                                                            {l.lessonTitle}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                                            <span className="flex items-center gap-1">
                                                                <FaClock size={10} /> 약 {minutes > 0 ? `${minutes}분` : `${l.durationSec}초`}
                                                            </span>
                                                            <span className="text-purple-600 font-medium">
                                                                동영상 첨부됨 (ID: {l.attachNoMov})
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                                        isReq
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : isAppr
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-200 text-gray-500'
                                                    }`}
                                                >
                                                    {isReq ? '대기' : isAppr ? '승인' : '삭제'}
                                                </span>
                                            </div>

                                            {l.lessonDesc && (
                                                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed bg-white/60 p-2 rounded-xl border border-gray-100">
                                                    {l.lessonDesc}
                                                </p>
                                            )}

                                            <div className="flex justify-between items-center pt-1.5 border-t border-gray-200/50 text-[10px]">
                                                {l.videoUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVideoPlayerModal({
                                                            isOpen: true,
                                                            title: `[${l.lessonSeq}강] ${l.lessonTitle}`,
                                                            videoUrl: l.videoUrl!
                                                        })}
                                                        className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 truncate max-w-[200px] transition-colors"
                                                    >
                                                        <FaPlay size={8} /> 강의 동영상 재생
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400">동영상 파일 ID: {l.attachNoMov}</span>
                                                )}

                                                <div className="flex gap-1.5">
                                                    {isAppr ? (
                                                        <button
                                                            onClick={() => handleUpdateLessonStatus(l.lessonNo, 'D')}
                                                            className="px-2.5 py-1 bg-red-50 text-red-500 rounded-lg font-bold hover:bg-red-100 transition-colors"
                                                        >
                                                            삭제
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateLessonStatus(l.lessonNo, 'A')}
                                                            className="px-2.5 py-1 bg-[#003C48] text-white rounded-lg font-bold hover:bg-[#002830] transition-colors"
                                                        >
                                                            승인
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: 강의자료 등록 모달 --- */}
            {isCreateLessonOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h2 className="text-sm font-bold text-[#003C48] flex items-center gap-1.5">
                                <FaPlus className="text-[#00BDF8]" /> 강의 자료(차시) 등록
                            </h2>
                            <button onClick={() => setIsCreateLessonOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateLessonSubmit} className="space-y-3.5">
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        회차 (강)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={lessonForm.lessonSeq}
                                        onChange={(e) => setLessonForm({ ...lessonForm, lessonSeq: parseInt(e.target.value, 10) || 1 })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-center font-bold"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        강의 재생시간 (분)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={lessonForm.durationMinutes}
                                        onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-center font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    강의 제목 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={lessonForm.lessonTitle}
                                    onChange={(e) => setLessonForm({ ...lessonForm, lessonTitle: e.target.value })}
                                    placeholder="예: 1강 - 베이스 기초 운지법 및 리듬 트레이닝"
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white"
                                    required
                                />
                            </div>

                            {/* 본강의 동영상 파일 첨부 (ATTACH_NO_MOV) - 필수 */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <FaFilm className="text-purple-600" />
                                        <span>본강의 동영상 파일 (ATTACH_NO_MOV)</span>
                                        <span className="text-red-500">*</span>
                                    </span>
                                    <span className="text-[10px] text-purple-600 font-bold">필수 등록</span>
                                </label>

                                {lessonForm.movPreviewUrl ? (
                                    <div className="flex items-center justify-between p-2.5 bg-purple-50/50 border border-purple-200 rounded-xl">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-11 h-11 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                                <FaFilm size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                    {lessonForm.movFileName || '업로드된 본강의 영상'}
                                                </p>
                                                <p className="text-[10px] text-purple-600 font-bold">✓ 동영상 첨부 완료 (ID: {lessonForm.attachNoMov})</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveLessonMov}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                                            title="동영상 삭제"
                                        >
                                            <FaTimes size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl p-4 bg-purple-50/20 hover:bg-purple-50/40 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleLessonMovChange}
                                            disabled={isLessonMovUploading}
                                            className="hidden"
                                        />
                                        {isLessonMovUploading ? (
                                            <div className="flex items-center gap-2 text-xs text-purple-600 font-medium py-1">
                                                <FaSpinner className="animate-spin" />
                                                <span>동영상 업로드 중...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-center">
                                                <FaFilm className="text-purple-400" size={20} />
                                                <span className="text-xs font-semibold text-purple-900">본강의 동영상 파일 선택</span>
                                                <span className="text-[10px] text-gray-400">MP4, MOV, WebM 등 영상 파일 첨부</span>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    강의 설명 및 학습 가이드
                                </label>
                                <textarea
                                    value={lessonForm.lessonDesc}
                                    onChange={(e) => setLessonForm({ ...lessonForm, lessonDesc: e.target.value })}
                                    placeholder="이번 차시에서 다루는 핵심 학습 포인트 및 악보 링크를 안내해 주세요."
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white resize-none leading-relaxed"
                                />
                            </div>

                            {/* 강의 대표 이미지 (ATTACH_NO_IMG) - 선택 */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                                    <FaImage className="text-[#00BDF8]" />
                                    <span>강의 대표 이미지 (ATTACH_NO_IMG)</span>
                                    <span className="text-[10px] text-gray-400 font-normal">(선택)</span>
                                </label>
                                {lessonForm.imgPreviewUrl ? (
                                    <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <img
                                                src={lessonForm.imgPreviewUrl}
                                                alt="강의 대표 이미지"
                                                className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                    {lessonForm.imgFileName || '업로드된 이미지'}
                                                </p>
                                                <p className="text-[10px] text-green-600 font-bold">✓ 첨부 완료 (ID: {lessonForm.attachNoImg})</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveLessonImg}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                                            title="이미지 삭제"
                                        >
                                            <FaTimes size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-[#00BDF8] rounded-2xl p-3.5 bg-gray-50/60 hover:bg-[#00BDF8]/5 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLessonImgChange}
                                            disabled={isLessonImgUploading}
                                            className="hidden"
                                        />
                                        {isLessonImgUploading ? (
                                            <div className="flex items-center gap-2 text-xs text-[#00BDF8] font-medium py-1">
                                                <FaSpinner className="animate-spin" />
                                                <span>이미지 업로드 중...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-center">
                                                <FaImage className="text-gray-400" size={18} />
                                                <span className="text-xs font-semibold text-gray-700">대표 썸네일 이미지 선택</span>
                                                <span className="text-[10px] text-gray-400">JPG, PNG, GIF 등</span>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-[#00BDF8] text-white rounded-xl text-xs font-bold hover:bg-[#009fd4] transition-all shadow-sm"
                                >
                                    등록하기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateLessonOpen(false)}
                                    className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: 수강 평가 목록 모달 --- */}
            {isEvalModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-5 w-full max-w-md max-h-[85vh] flex flex-col gap-3 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0">
                            <div>
                                <span className="text-[10px] text-gray-400 block">수강생 평가 및 후기</span>
                                <h2 className="text-sm font-bold text-[#003C48] truncate max-w-[260px]">
                                    {evalCourseTitle}
                                </h2>
                            </div>
                            <button onClick={() => setIsEvalModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                            {evalList.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-xs text-gray-400">아직 등록된 수강 평가가 없습니다.</p>
                                </div>
                            ) : (
                                evalList.map((item) => (
                                    <div key={item.evalNo} className="p-3 bg-gray-50/80 rounded-2xl border border-gray-200/70 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <FaStar
                                                        key={i}
                                                        size={11}
                                                        className={i < item.ratingScore ? 'text-amber-400' : 'text-gray-200'}
                                                    />
                                                ))}
                                                <span className="text-[11px] font-bold text-gray-700 ml-1">
                                                    {item.ratingScore}점
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400">
                                                {item.userNickNm || item.userNm}
                                            </span>
                                        </div>

                                        {item.reviewContent && (
                                            <p className="text-xs text-gray-700 leading-relaxed">
                                                {item.reviewContent}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                                            <span>
                                                {item.insDtime.substring(0, 4)}-{item.insDtime.substring(4, 6)}-{item.insDtime.substring(6, 8)}
                                            </span>
                                            {item.likeFg === 'Y' && (
                                                <span className="flex items-center gap-1 text-red-500 font-bold">
                                                    <FaHeart size={10} /> 추천해요
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 5: 수강 신청 거절 사유 입력 모달 --- */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-3.5 shadow-2xl">
                        <h3 className="text-sm font-bold text-[#003C48]">신청 거절 사유 입력</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="신청자에게 전달할 거절 사유를 입력해 주세요."
                            rows={3}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs resize-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleRejectApplicationSubmit}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold"
                            >
                                거절 확정
                            </button>
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- In-App Video Player Modal (샘플영상 / 강의영상 재생) --- */}
            {videoPlayerModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-3xl p-5 w-full max-w-2xl flex flex-col gap-3.5 shadow-2xl animate-in fade-in zoom-in duration-200 text-white">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3 shrink-0">
                            <h3 className="text-sm font-bold truncate flex items-center gap-2 text-white">
                                <FaFilm className="text-[#00BDF8]" />
                                <span>{videoPlayerModal.title}</span>
                            </h3>
                            <button
                                onClick={() => setVideoPlayerModal({ isOpen: false, title: '', videoUrl: '' })}
                                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <div className="w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center min-h-[260px] border border-white/10">
                            <video
                                src={videoPlayerModal.videoUrl}
                                controls
                                controlsList="nodownload"
                                onContextMenu={(e) => e.preventDefault()}
                                autoPlay
                                className="w-full max-h-[65vh] object-contain rounded-2xl select-none"
                            />
                        </div>
                        <div className="flex justify-between items-center pt-1 text-xs">
                            <span className="text-[11px] text-gray-400">
                                💡 재생창을 닫으려면 우측 상단 X 버튼 또는 닫기를 눌러주세요.
                            </span>
                            <button
                                onClick={() => setVideoPlayerModal({ isOpen: false, title: '', videoUrl: '' })}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Common Alert / Confirm Modal */}
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

export default AmbassadorManagePage;
