import React, { useState, useEffect } from 'react';
import {
    FaChevronLeft, FaPlus, FaBook, FaStar, FaVideo,
    FaCheck, FaTimes, FaTrash, FaEye, FaPlay, FaExclamationTriangle,
    FaFilm, FaSpinner, FaImage, FaTimesCircle, FaUserCheck
} from 'react-icons/fa';
import CommonModal from '../common/CommonModal';
import { uploadFileApi } from '../../utils/fileUtils';

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

interface AdminAmbassadorCourseDelegateModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetAmbassador: {
        userId: string;
        userNm?: string;
        userNickNm?: string;
        activityFieldNm?: string;
    } | null;
}

export const AdminAmbassadorCourseDelegateModal: React.FC<AdminAmbassadorCourseDelegateModalProps> = ({
    isOpen,
    onClose,
    targetAmbassador
}) => {
    const targetUserId = targetAmbassador?.userId || '';
    const targetDisplayName = targetAmbassador?.userNm || targetAmbassador?.userNickNm || targetUserId;

    const [loading, setLoading] = useState<boolean>(true);
    const [courses, setCourses] = useState<CourseItem[]>([]);

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

    // Video Player Modal
    const [videoPlayerModal, setVideoPlayerModal] = useState<{
        isOpen: boolean;
        title: string;
        videoUrl: string;
    }>({
        isOpen: false,
        title: '',
        videoUrl: ''
    });

    // Alert / Confirm Modal
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
        if (isOpen && targetUserId) {
            loadCourses();
        }
    }, [isOpen, targetUserId]);

    const loadCourses = async () => {
        if (!targetUserId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/ambassador/courses?userId=${targetUserId}`);
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (err) {
            console.error('Failed to load courses for delegate', err);
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
        if (!file || !targetUserId) return;
        setIsImgUploading(true);
        try {
            const res = await uploadFileApi(file, 'ambassador', targetUserId);
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
        if (!file || !targetUserId) return;
        setIsMovUploading(true);
        try {
            const res = await uploadFileApi(file, 'ambassador', targetUserId);
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
                courseTitle: courseForm.courseTitle.trim(),
                courseDesc: courseForm.courseDesc.trim(),
                eduTypeFg: courseForm.eduTypeFg,
                courseAmt: courseForm.courseAmt,
                attachNoImg: courseForm.attachNoImg,
                attachNoMov: courseForm.attachNoMov
            };

            const res = await fetch(`/api/ambassador/courses?userId=${targetUserId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsCreateCourseOpen(false);
                showAlert(`'${targetDisplayName}' 엠버서더 명의로 교육과정이 등록(대기)되었습니다.\n강의자료를 1개 이상 등록 후 공개 승인해 주세요.`);
                loadCourses();
            } else {
                const errData = await res.json().catch(() => null);
                showAlert(errData?.message || '교육과정 대리 등록 실패');
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
            ? `'${targetDisplayName}' 엠버서더의 해당 교육과정을 승인 및 공개하시겠습니까?`
            : `'${targetDisplayName}' 엠버서더의 해당 교육과정을 비공개 처리하시겠습니까?`;

        showConfirm(confirmMsg, async () => {
            try {
                const res = await fetch(`/api/ambassador/courses/${courseNo}/status?userId=${targetUserId}&status=${status}`, {
                    method: 'PUT'
                });

                if (res.ok) {
                    showAlert(status === 'A' ? '교육과정이 성공적으로 공개 승인되었습니다.' : '교육과정이 비공개 처리되었습니다.');
                    loadCourses();
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
        if (!file || !targetUserId) return;
        setIsLessonMovUploading(true);
        try {
            const res = await uploadFileApi(file, 'ambassador', targetUserId);
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
        if (!file || !targetUserId) return;
        setIsLessonImgUploading(true);
        try {
            const res = await uploadFileApi(file, 'ambassador', targetUserId);
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
        if (!selectedCourseForLessons || !targetUserId) return;

        if (!lessonForm.lessonTitle.trim()) {
            showAlert('강의 제목을 입력해 주세요.');
            return;
        }
        if (!lessonForm.attachNoMov) {
            showAlert('본강의 동영상 파일은 필수 등록 항목입니다. 동영상 파일을 첨부해 주세요.');
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

            const res = await fetch(`/api/ambassador/courses/${selectedCourseForLessons.courseNo}/lessons?userId=${targetUserId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsCreateLessonOpen(false);
                showAlert(`'${targetDisplayName}' 엠버서더 명의로 강의 자료가 정상 등록되었습니다.`);
                loadLessons(selectedCourseForLessons.courseNo);
                loadCourses();
            } else {
                const errData = await res.json().catch(() => null);
                showAlert(errData?.message || '강의 자료 등록 실패');
            }
        } catch (err) {
            showAlert('통신 오류가 발생했습니다.');
        }
    };

    const handleUpdateLessonStatus = async (lessonNo: number, status: 'A' | 'D') => {
        if (!targetUserId) return;
        try {
            const res = await fetch(`/api/ambassador/lessons/${lessonNo}/status?userId=${targetUserId}&status=${status}`, {
                method: 'PUT'
            });
            if (res.ok) {
                if (selectedCourseForLessons) {
                    loadLessons(selectedCourseForLessons.courseNo);
                    loadCourses();
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

    if (!isOpen || !targetAmbassador) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div className="bg-[#F8F9FA] rounded-3xl w-full max-w-lg h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
                
                {/* Modal Header */}
                <div className="shrink-0 bg-white px-4 py-3.5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={onClose}
                            className="p-1.5 -ml-1 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                        >
                            <FaChevronLeft size={16} />
                        </button>
                        <div className="min-w-0">
                            <h2 className="text-[15px] font-extrabold text-[#003C48] truncate flex items-center gap-1.5">
                                <FaBook className="text-[#00BDF8] shrink-0" size={15} />
                                교육자료 대리 등록 및 관리
                            </h2>
                            <p className="text-[11px] text-gray-500 truncate">
                                대상: <strong className="text-[#003C48]">{targetDisplayName}</strong> (ID: {targetUserId})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Info Notice Banner */}
                <div className="shrink-0 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-2.5 border-b border-cyan-100 flex items-start gap-2 text-[11px] text-[#006075]">
                    <FaUserCheck className="text-[#00BDF8] shrink-0 mt-0.5" size={13} />
                    <div className="leading-snug">
                        관리자가 자료를 등록하더라도 시스템상 <strong>'{targetDisplayName}'</strong> 엠버서더 계정으로 귀속되어 자동 등록 및 승인/정산 처리됩니다.
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {/* Header Row with Add Button */}
                    <div className="flex justify-between items-center px-0.5 pt-1">
                        <span className="text-xs font-bold text-gray-700">
                            등록된 교육과정 ({courses.length}개)
                        </span>
                        <button
                            onClick={handleOpenCreateCourse}
                            className="px-3 py-1.5 bg-[#00BDF8] text-white rounded-xl text-xs font-bold hover:bg-[#009fd4] active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                        >
                            <FaPlus size={9} /> 신규 과정 대리 등록
                        </button>
                    </div>

                    {/* Course List */}
                    {loading ? (
                        <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
                            <p className="text-xs text-gray-400">교육과정을 불러오는 중입니다...</p>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xs text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#00BDF8] flex items-center justify-center mx-auto">
                                <FaBook size={20} />
                            </div>
                            <p className="text-xs font-bold text-gray-600">등록된 교육과정이 없습니다.</p>
                            <p className="text-[11px] text-gray-400">
                                우측 상단의 <strong>[신규 과정 대리 등록]</strong> 버튼을 눌러 과정을 신설해 보세요!
                            </p>
                        </div>
                    ) : (
                        courses.map((course) => {
                            const isReq = course.courseStatCd === 'R';
                            const isAppr = course.courseStatCd === 'A';

                            return (
                                <div
                                    key={course.courseNo}
                                    className={`bg-white rounded-3xl p-4 border transition-all shadow-xs flex flex-col gap-3 ${
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
                                                className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-gray-100 shadow-2xs cursor-pointer"
                                            />
                                        ) : (
                                            <div
                                                onClick={() => handleOpenLessons(course)}
                                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-100 border border-cyan-100 flex flex-col items-center justify-center text-[#003C48] shrink-0 cursor-pointer shadow-2xs"
                                            >
                                                <FaBook className="text-[#00BDF8]" size={18} />
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
                                            <h3 className="text-xs font-bold text-[#003C48] truncate hover:text-[#00BDF8] transition-colors">
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
                                            <FaBook className="text-[#00BDF8]" size={11} />
                                            <span>강의 차시 <strong>{course.lessonCount}개</strong> (승인 {course.approvedLessonCount})</span>
                                        </button>

                                        <button
                                            onClick={() => handleOpenEvaluations(course.courseNo, course.courseTitle)}
                                            className="flex items-center gap-1 text-gray-600 hover:text-amber-500 font-medium"
                                        >
                                            <FaStar className="text-amber-400" size={11} />
                                            <span>{course.avgRating > 0 ? course.avgRating.toFixed(1) : '-'}</span>
                                            <span className="text-gray-400 text-[10px]">({course.evaluationCount}건)</span>
                                        </button>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                                        {course.movUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setVideoPlayerModal({
                                                    isOpen: true,
                                                    title: `[샘플영상] ${course.courseTitle}`,
                                                    videoUrl: course.movUrl!
                                                })}
                                                className="px-2.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
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
                                                className="px-3 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all shrink-0"
                                            >
                                                비공개
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateCourseStatus(course.courseNo, 'A')}
                                                className="px-3 py-2 bg-[#003C48] text-white rounded-xl text-xs font-bold hover:bg-[#002830] transition-all shadow-xs shrink-0"
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

                {/* Modal Footer */}
                <div className="shrink-0 bg-white px-4 py-3 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                1. 신규 교육과정 대리 등록 모달
            ───────────────────────────────────────────────────────────── */}
            {isCreateCourseOpen && (
                <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-5 w-full max-w-md space-y-3.5 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                            <div>
                                <h3 className="text-sm font-bold text-[#003C48] flex items-center gap-1.5">
                                    <FaPlus className="text-[#00BDF8]" size={12} /> 신규 교육과정 대리 등록
                                </h3>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    등록자: {targetDisplayName} ({targetUserId})
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateCourseOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateCourseSubmit} className="space-y-3">
                            {/* 과정명 */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700">과정명 *</label>
                                <input
                                    type="text"
                                    value={courseForm.courseTitle}
                                    onChange={(e) => setCourseForm({ ...courseForm, courseTitle: e.target.value })}
                                    placeholder="예: 실전 보컬 발성 마스터 클래스"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all"
                                    required
                                />
                            </div>

                            {/* 과정 소개 */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700">과정 소개 및 커리큘럼</label>
                                <textarea
                                    value={courseForm.courseDesc}
                                    onChange={(e) => setCourseForm({ ...courseForm, courseDesc: e.target.value })}
                                    placeholder="교육과정에 대한 상세 소개글을 입력해 주세요."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs resize-none focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all"
                                />
                            </div>

                            {/* 유상 / 무상 구분 */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700">교육 형태 *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCourseForm({ ...courseForm, eduTypeFg: 'F', courseAmt: 0 })}
                                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                            courseForm.eduTypeFg === 'F'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        무상 교육 (Free)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCourseForm({ ...courseForm, eduTypeFg: 'P' })}
                                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                            courseForm.eduTypeFg === 'P'
                                                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        유상 교육 (Paid)
                                    </button>
                                </div>
                            </div>

                            {/* 유상 수강료 */}
                            {courseForm.eduTypeFg === 'P' && (
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-700">수강료 (원) *</label>
                                    <input
                                        type="number"
                                        value={courseForm.courseAmt || ''}
                                        onChange={(e) => setCourseForm({ ...courseForm, courseAmt: parseInt(e.target.value, 10) || 0 })}
                                        placeholder="예: 50000"
                                        step={1000}
                                        min={1000}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all font-mono"
                                        required
                                    />
                                </div>
                            )}

                            {/* 대표 썸네일 이미지 */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700">대표 썸네일 이미지</label>
                                {courseForm.imgPreviewUrl ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
                                        <img src={courseForm.imgPreviewUrl} alt="Thumbnail preview" className="w-full h-32 object-cover" />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-all text-xs"
                                        >
                                            <FaTrash size={10} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#00BDF8] hover:bg-cyan-50/20 transition-all">
                                        {isImgUploading ? (
                                            <div className="flex items-center gap-1.5 text-xs text-[#00BDF8]">
                                                <FaSpinner className="animate-spin" size={14} /> 업로드 중...
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400 text-xs">
                                                <FaImage size={18} className="mb-1 text-gray-300" />
                                                <span>이미지 파일 선택 (권장: 16:9 비율)</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" disabled={isImgUploading} />
                                    </label>
                                )}
                            </div>

                            {/* 소개 샘플 동영상 */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700">소개 / 맛보기 샘플 동영상</label>
                                {courseForm.movPreviewUrl ? (
                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-purple-700 truncate">
                                            <FaFilm size={13} className="shrink-0" />
                                            <span className="truncate">{courseForm.movFileName || '샘플 동영상 등록 완료'}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveVideo}
                                            className="text-red-400 hover:text-red-600 p-1 text-xs"
                                        >
                                            <FaTrash size={11} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-purple-200 rounded-2xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all">
                                        {isMovUploading ? (
                                            <div className="flex items-center gap-1.5 text-xs text-purple-600">
                                                <FaSpinner className="animate-spin" size={14} /> 동영상 업로드 중...
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-purple-500 text-xs">
                                                <FaFilm size={16} className="mb-1 text-purple-400" />
                                                <span>맛보기 동영상 파일 선택 (mp4, webm 등)</span>
                                            </div>
                                        )}
                                        <input type="file" accept="video/*" onChange={handleVideoFileChange} className="hidden" disabled={isMovUploading} />
                                    </label>
                                )}
                            </div>

                            {/* Submit & Cancel */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={isImgUploading || isMovUploading}
                                    className="flex-1 py-2.5 bg-[#00BDF8] text-white rounded-xl text-xs font-bold hover:bg-[#009fd4] active:scale-95 transition-all shadow-sm disabled:opacity-50"
                                >
                                    등록 완료
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateCourseOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                2. 강의 차시(자료) 대리 관리 모달
            ───────────────────────────────────────────────────────────── */}
            {isLessonModalOpen && selectedCourseForLessons && (
                <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-hidden">
                    <div className="bg-[#F8F9FA] rounded-3xl w-full max-w-md h-[88vh] max-h-[780px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
                        {/* Header */}
                        <div className="shrink-0 bg-white px-4 py-3.5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-xs">
                            <div className="min-w-0 pr-2">
                                <h3 className="text-xs font-extrabold text-[#003C48] truncate flex items-center gap-1">
                                    <FaVideo className="text-[#00BDF8]" size={13} />
                                    강의 차시 관리: {selectedCourseForLessons.courseTitle}
                                </h3>
                                <p className="text-[10px] text-gray-400 truncate">
                                    엠버서더: {targetDisplayName}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsLessonModalOpen(false)}
                                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            <div className="flex justify-between items-center px-0.5">
                                <span className="text-xs font-bold text-gray-700">
                                    차시 목록 ({lessons.length}개)
                                </span>
                                <button
                                    onClick={handleOpenCreateLesson}
                                    className="px-3 py-1.5 bg-[#00BDF8] text-white rounded-xl text-xs font-bold hover:bg-[#009fd4] active:scale-95 transition-all shadow-xs flex items-center gap-1"
                                >
                                    <FaPlus size={9} /> 신규 차시 대리 등록
                                </button>
                            </div>

                            {lessons.length === 0 ? (
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xs text-center space-y-2">
                                    <p className="text-xs text-gray-400">등록된 강의 차시(자료)가 없습니다.</p>
                                    <p className="text-[11px] text-gray-400">
                                        [신규 차시 대리 등록] 버튼을 눌러 본강의 영상을 등록해 주세요.
                                    </p>
                                </div>
                            ) : (
                                lessons.map((lesson) => {
                                    const isAppr = lesson.lessonStatCd === 'A';
                                    return (
                                        <div
                                            key={lesson.lessonNo}
                                            className="bg-white rounded-3xl p-3.5 border border-gray-100 shadow-xs flex flex-col gap-2.5"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="px-2 py-0.5 bg-[#003C48] text-white rounded-md font-mono text-[10px] font-bold shrink-0">
                                                        {lesson.lessonSeq}강
                                                    </span>
                                                    <h4 className="text-xs font-bold text-[#003C48] truncate">
                                                        {lesson.lessonTitle}
                                                    </h4>
                                                </div>
                                                <span
                                                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                                        isAppr
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {isAppr ? '승인됨' : '대기'}
                                                </span>
                                            </div>

                                            {lesson.lessonDesc && (
                                                <p className="text-[11px] text-gray-500 line-clamp-2">
                                                    {lesson.lessonDesc}
                                                </p>
                                            )}

                                            <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-[11px]">
                                                <span className="text-gray-400 font-mono text-[10px]">
                                                    시간: {Math.round(lesson.durationSec / 60)}분
                                                </span>

                                                <div className="flex gap-1.5">
                                                    {lesson.videoUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setVideoPlayerModal({
                                                                isOpen: true,
                                                                title: `[${lesson.lessonSeq}강] ${lesson.lessonTitle}`,
                                                                videoUrl: lesson.videoUrl!
                                                            })}
                                                            className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-[#007A99] rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                                                        >
                                                            <FaPlay size={9} /> 영상 확인
                                                        </button>
                                                    )}

                                                    {isAppr ? (
                                                        <button
                                                            onClick={() => handleUpdateLessonStatus(lesson.lessonNo, 'D')}
                                                            className="px-2.5 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-all"
                                                        >
                                                            비공개
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateLessonStatus(lesson.lessonNo, 'A')}
                                                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-all"
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

                        {/* Footer */}
                        <div className="shrink-0 bg-white px-4 py-3 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsLessonModalOpen(false)}
                                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                3. 신규 강의 차시(동영상) 대리 등록 폼 모달
            ───────────────────────────────────────────────────────────── */}
            {isCreateLessonOpen && (
                <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-5 w-full max-w-md space-y-3.5 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                            <div>
                                <h3 className="text-sm font-bold text-[#003C48] flex items-center gap-1.5">
                                    <FaPlus className="text-[#00BDF8]" size={12} /> 신규 강의 차시 대리 등록
                                </h3>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    엠버서더: {targetDisplayName}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateLessonOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateLessonSubmit} className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-700">차시 번호 *</label>
                                    <input
                                        type="number"
                                        value={lessonForm.lessonSeq}
                                        onChange={(e) => setLessonForm({ ...lessonForm, lessonSeq: parseInt(e.target.value, 10) || 1 })}
                                        min={1}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-center font-mono focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[11px] font-bold text-gray-700">강의 제목 *</label>
                                    <input
                                        type="text"
                                        value={lessonForm.lessonTitle}
                                        onChange={(e) => setLessonForm({ ...lessonForm, lessonTitle: e.target.value })}
                                        placeholder="예: 1강. 복식호흡의 기본 원리"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700">강의 설명</label>
                                <textarea
                                    value={lessonForm.lessonDesc}
                                    onChange={(e) => setLessonForm({ ...lessonForm, lessonDesc: e.target.value })}
                                    placeholder="해당 차시에서 다루는 내용 요약을 입력해 주세요."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs resize-none focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700">예상 소요시간 (분)</label>
                                <input
                                    type="number"
                                    value={lessonForm.durationMinutes}
                                    onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: parseInt(e.target.value, 10) || 0 })}
                                    min={1}
                                    placeholder="예: 15"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all"
                                />
                            </div>

                            {/* 본강의 동영상 파일 (필수) */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700">본강의 동영상 파일 *</label>
                                {lessonForm.movPreviewUrl ? (
                                    <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-[#007A99] truncate">
                                            <FaVideo size={13} className="shrink-0 text-[#00BDF8]" />
                                            <span className="truncate">{lessonForm.movFileName || '동영상 등록 완료'}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveLessonMov}
                                            className="text-red-400 hover:text-red-600 p-1 text-xs"
                                        >
                                            <FaTrash size={11} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#00BDF8]/40 rounded-2xl cursor-pointer hover:border-[#00BDF8] hover:bg-cyan-50/20 transition-all">
                                        {isLessonMovUploading ? (
                                            <div className="flex items-center gap-1.5 text-xs text-[#00BDF8]">
                                                <FaSpinner className="animate-spin" size={14} /> 동영상 업로드 중...
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-cyan-700 text-xs">
                                                <FaVideo size={18} className="mb-1 text-[#00BDF8]" />
                                                <span className="font-bold">본강의 동영상 파일 선택</span>
                                                <span className="text-[10px] text-gray-400 mt-0.5">mp4, webm, mov (최대 100MB)</span>
                                            </div>
                                        )}
                                        <input type="file" accept="video/*" onChange={handleLessonMovChange} className="hidden" disabled={isLessonMovUploading} />
                                    </label>
                                )}
                            </div>

                            {/* 강의 보조 이미지 (선택) */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-700">차시 썸네일 / 교재 이미지 (선택)</label>
                                {lessonForm.imgPreviewUrl ? (
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-700 truncate">
                                            <FaImage size={13} className="shrink-0 text-gray-400" />
                                            <span className="truncate">{lessonForm.imgFileName || '이미지 등록 완료'}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveLessonImg}
                                            className="text-red-400 hover:text-red-600 p-1 text-xs"
                                        >
                                            <FaTrash size={11} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all">
                                        {isLessonImgUploading ? (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <FaSpinner className="animate-spin" size={14} /> 이미지 업로드 중...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                                <FaImage size={14} />
                                                <span>보조 이미지 파일 선택 (선택사항)</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleLessonImgChange} className="hidden" disabled={isLessonImgUploading} />
                                    </label>
                                )}
                            </div>

                            {/* Submit & Cancel */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={isLessonMovUploading || isLessonImgUploading}
                                    className="flex-1 py-2.5 bg-[#00BDF8] text-white rounded-xl text-xs font-bold hover:bg-[#009fd4] active:scale-95 transition-all shadow-sm disabled:opacity-50"
                                >
                                    차시 등록
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateLessonOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                4. 수강 평가 내역 조회 모달
            ───────────────────────────────────────────────────────────── */}
            {isEvalModalOpen && (
                <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-3.5 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                            <h3 className="text-xs font-bold text-[#003C48] truncate">
                                수강평 ({evalList.length}건): {evalCourseTitle}
                            </h3>
                            <button
                                onClick={() => setIsEvalModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2.5">
                            {evalList.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">등록된 수강평이 없습니다.</p>
                            ) : (
                                evalList.map((ev) => (
                                    <div key={ev.evalNo} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-[#003C48]">{ev.userNickNm || ev.userNm || ev.userId}</span>
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <FaStar size={11} />
                                                <span className="font-bold">{ev.ratingScore}점</span>
                                            </div>
                                        </div>
                                        {ev.reviewContent && <p className="text-gray-600 leading-relaxed">{ev.reviewContent}</p>}
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setIsEvalModalOpen(false)}
                            className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                5. 동영상 재생 플레이어 모달
            ───────────────────────────────────────────────────────────── */}
            {videoPlayerModal.isOpen && (
                <div className="fixed inset-0 z-80 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
                    <div className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl space-y-2">
                        <div className="px-4 py-3 bg-[#003C48] text-white flex justify-between items-center">
                            <h4 className="text-xs font-bold truncate pr-2">{videoPlayerModal.title}</h4>
                            <button
                                onClick={() => setVideoPlayerModal({ isOpen: false, title: '', videoUrl: '' })}
                                className="text-white hover:text-gray-300 font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-3 bg-black flex items-center justify-center">
                            <video
                                src={videoPlayerModal.videoUrl}
                                controls
                                autoPlay
                                className="max-h-[60vh] w-full rounded-xl"
                            />
                        </div>
                        <div className="px-4 py-2.5 flex justify-end bg-gray-50">
                            <button
                                onClick={() => setVideoPlayerModal({ isOpen: false, title: '', videoUrl: '' })}
                                className="px-4 py-1.5 bg-[#00BDF8] text-white text-xs font-bold rounded-xl"
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
            />
        </div>
    );
};
