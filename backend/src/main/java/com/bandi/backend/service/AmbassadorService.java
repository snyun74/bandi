package com.bandi.backend.service;

import com.bandi.backend.entity.band.*;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.repository.*;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.repository.CmAttachmentRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AmbassadorService {

    private final BnAmbassadorRepository ambassadorRepository;
    private final BnEduCourseRepository courseRepository;
    private final BnEduLessonRepository lessonRepository;
    private final BnEduApplicationRepository applicationRepository;
    private final BnEduEvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final PushService pushService;
    private final CmAttachmentRepository cmAttachmentRepository;
    private final CommDetailRepository commDetailRepository;

    private static final DateTimeFormatter DTIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private String nowDtime() {
        return LocalDateTime.now().format(DTIME_FORMATTER);
    }

    // --- 1. 엠버서더 신청 / 조회 / 수정 ---

    @Transactional(readOnly = true)
    public BnAmbassador getAmbassador(String userId) {
        return ambassadorRepository.findByUserId(userId).orElse(null);
    }

    @Transactional
    public BnAmbassador applyOrReapply(String userId, AmbassadorApplyDto dto) {
        String now = nowDtime();
        BnAmbassador ambassador = ambassadorRepository.findByUserId(userId).orElse(null);

        if (ambassador == null) {
            // 최초 신청
            ambassador = BnAmbassador.builder()
                    .userId(userId)
                    .activityField(dto.getActivityField())
                    .introContent(dto.getIntroContent())
                    .portfolioUrl(dto.getPortfolioUrl())
                    .snsUrl(dto.getSnsUrl())
                    .attachNo(dto.getAttachNo())
                    .applyStatCd("R") // 심사대기
                    .insDtime(now)
                    .insId(userId)
                    .updDtime(now)
                    .updId(userId)
                    .build();
        } else {
            // 거절 후 재신청 or 수정
            ambassador.setActivityField(dto.getActivityField());
            ambassador.setIntroContent(dto.getIntroContent());
            ambassador.setPortfolioUrl(dto.getPortfolioUrl());
            ambassador.setSnsUrl(dto.getSnsUrl());
            if (dto.getAttachNo() != null) {
                ambassador.setAttachNo(dto.getAttachNo());
            }
            if ("J".equals(ambassador.getApplyStatCd())) {
                ambassador.setApplyStatCd("R"); // 거절 상태에서 재신청 시 심사대기로 전환
                ambassador.setRejectReason(null);
            }
            ambassador.setUpdDtime(now);
            ambassador.setUpdId(userId);
        }

        BnAmbassador saved = ambassadorRepository.save(ambassador);

        // 푸시 발송: 관리자(ADMIN_YN = 'Y') 전원에게 알림
        try {
            User applicant = userRepository.findByUserId(userId);
            String applicantNm = applicant != null ? (applicant.getUserNickNm() != null && !applicant.getUserNickNm().isEmpty() ? applicant.getUserNickNm() : applicant.getUserNm()) : userId;
            List<User> admins = userRepository.findByAdminYn("Y");
            for (User admin : admins) {
                pushService.sendPush(
                    admin.getUserId(),
                    "엠버서더 신청 알림",
                    applicantNm + "님이 엠버서더 신청을 등록했습니다. 승인 검토 부탁드립니다.",
                    "/main/admin/ambassadors",
                    "AMBASSADOR_REQ",
                    "AMBASSADOR"
                );
            }
        } catch (Exception e) {
            log.error("Failed to send ambassador registration push to admins", e);
        }

        return saved;
    }

    @Transactional
    public BnAmbassador updateAmbassadorInfo(String userId, AmbassadorApplyDto dto) {
        BnAmbassador ambassador = ambassadorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("등록된 엠버서더 정보를 찾을 수 없습니다."));

        ambassador.setActivityField(dto.getActivityField());
        ambassador.setIntroContent(dto.getIntroContent());
        ambassador.setPortfolioUrl(dto.getPortfolioUrl());
        ambassador.setSnsUrl(dto.getSnsUrl());
        if (dto.getAttachNo() != null) {
            ambassador.setAttachNo(dto.getAttachNo());
        }
        ambassador.setUpdDtime(nowDtime());
        ambassador.setUpdId(userId);

        return ambassadorRepository.save(ambassador);
    }

    // --- 2. 교육과정 관리 ---

    @Transactional(readOnly = true)
    public List<CourseResponseDto> getCoursesByAmbassador(String userId) {
        List<BnEduCourse> courses = courseRepository.findByUserIdOrderByInsDtimeDesc(userId);
        List<CourseResponseDto> result = new ArrayList<>();

        for (BnEduCourse c : courses) {
            long lessonCount = lessonRepository.countByCourseNo(c.getCourseNo());
            long approvedLessonCount = lessonRepository.countByCourseNoAndLessonStatCd(c.getCourseNo(), "A");
            List<BnEduEvaluation> evals = evaluationRepository.findByCourseNoOrderByInsDtimeDesc(c.getCourseNo());

            double avgRating = evals.isEmpty() ? 0.0 : evals.stream().mapToInt(BnEduEvaluation::getRatingScore).average().orElse(0.0);

            String imgUrl = null;
            if (c.getAttachNoImg() != null) {
                imgUrl = cmAttachmentRepository.findById(c.getAttachNoImg())
                        .map(CmAttachment::getFilePath).orElse(null);
            }

            String movUrl = null;
            if (c.getAttachNoMov() != null) {
                movUrl = cmAttachmentRepository.findById(c.getAttachNoMov())
                        .map(CmAttachment::getFilePath).orElse(null);
            }

            result.add(CourseResponseDto.builder()
                    .courseNo(c.getCourseNo())
                    .userId(c.getUserId())
                    .courseTitle(c.getCourseTitle())
                    .courseDesc(c.getCourseDesc())
                    .eduTypeFg(c.getEduTypeFg())
                    .courseAmt(c.getCourseAmt())
                    .attachNoImg(c.getAttachNoImg())
                    .imgUrl(imgUrl)
                    .attachNoMov(c.getAttachNoMov())
                    .movUrl(movUrl)
                    .courseStatCd(c.getCourseStatCd())
                    .insDtime(c.getInsDtime())
                    .lessonCount(lessonCount)
                    .approvedLessonCount(approvedLessonCount)
                    .evaluationCount((long) evals.size())
                    .avgRating(Math.round(avgRating * 10.0) / 10.0)
                    .build());
        }

        return result;
    }

    @Transactional
    public BnEduCourse createCourse(String userId, CourseRequestDto dto) {
        String now = nowDtime();
        BnEduCourse course = BnEduCourse.builder()
                .userId(userId)
                .courseTitle(dto.getCourseTitle())
                .courseDesc(dto.getCourseDesc())
                .eduTypeFg(dto.getEduTypeFg() != null ? dto.getEduTypeFg() : "F")
                .courseAmt("P".equals(dto.getEduTypeFg()) ? (dto.getCourseAmt() != null ? dto.getCourseAmt() : 0) : 0)
                .attachNoImg(dto.getAttachNoImg())
                .attachNoMov(dto.getAttachNoMov())
                .courseStatCd("R") // 등록(R) 상태로 생성
                .insDtime(now)
                .insId(userId)
                .updDtime(now)
                .updId(userId)
                .build();

        return courseRepository.save(course);
    }

    @Transactional
    public BnEduCourse updateCourseStatus(Long courseNo, String userId, String status) {
        BnEduCourse course = courseRepository.findById(courseNo)
                .orElseThrow(() -> new RuntimeException("교육과정을 찾을 수 없습니다: " + courseNo));

        if (!course.getUserId().equals(userId)) {
            throw new RuntimeException("해당 과정을 수정할 권한이 없습니다.");
        }

        // 승인(A) 처리 시: 승인된 강의자료(차시)가 최소 1건 이상 존재해야 함
        if ("A".equals(status)) {
            long approvedLessonCount = lessonRepository.countByCourseNoAndLessonStatCd(courseNo, "A");
            if (approvedLessonCount == 0) {
                throw new RuntimeException("승인된 강의 자료(차시)가 최소 1건 이상 존재해야 교육과정을 공개 승인할 수 있습니다. 강의자료 관리에서 먼저 강의자료를 승인해 주세요.");
            }
        }

        course.setCourseStatCd(status);
        course.setUpdDtime(nowDtime());
        course.setUpdId(userId);

        return courseRepository.save(course);
    }

    // --- 3. 강의자료(차시) 관리 ---

    @Transactional(readOnly = true)
    public List<LessonResponseDto> getLessons(Long courseNo) {
        List<BnEduLesson> lessons = lessonRepository.findByCourseNoOrderByLessonSeqAsc(courseNo);
        List<LessonResponseDto> result = new ArrayList<>();
        for (BnEduLesson l : lessons) {
            String videoUrl = null;
            if (l.getAttachNoMov() != null) {
                videoUrl = cmAttachmentRepository.findById(l.getAttachNoMov())
                        .map(CmAttachment::getFilePath).orElse(null);
            }
            String imgUrl = null;
            if (l.getAttachNoImg() != null) {
                imgUrl = cmAttachmentRepository.findById(l.getAttachNoImg())
                        .map(CmAttachment::getFilePath).orElse(null);
            }
            result.add(LessonResponseDto.builder()
                    .lessonNo(l.getLessonNo())
                    .courseNo(l.getCourseNo())
                    .lessonSeq(l.getLessonSeq())
                    .lessonTitle(l.getLessonTitle())
                    .lessonDesc(l.getLessonDesc())
                    .attachNoMov(l.getAttachNoMov())
                    .videoUrl(videoUrl)
                    .attachNoImg(l.getAttachNoImg())
                    .imgUrl(imgUrl)
                    .durationSec(l.getDurationSec())
                    .lessonStatCd(l.getLessonStatCd())
                    .insDtime(l.getInsDtime())
                    .build());
        }
        return result;
    }

    @Transactional
    public BnEduLesson createLesson(Long courseNo, String userId, LessonRequestDto dto) {
        BnEduCourse course = courseRepository.findById(courseNo)
                .orElseThrow(() -> new RuntimeException("교육과정을 찾을 수 없습니다: " + courseNo));

        if (!course.getUserId().equals(userId)) {
            throw new RuntimeException("해당 과정에 강의를 등록할 권한이 없습니다.");
        }

        if (dto.getAttachNoMov() == null) {
            throw new RuntimeException("본강의 동영상 파일(ATTACH_NO_MOV)은 필수 등록 항목입니다.");
        }

        List<BnEduLesson> existing = lessonRepository.findByCourseNoOrderByLessonSeqAsc(courseNo);
        int nextSeq = dto.getLessonSeq() != null ? dto.getLessonSeq() : (existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getLessonSeq() + 1);

        String now = nowDtime();
        BnEduLesson lesson = BnEduLesson.builder()
                .courseNo(courseNo)
                .lessonSeq(nextSeq)
                .lessonTitle(dto.getLessonTitle())
                .lessonDesc(dto.getLessonDesc())
                .attachNoMov(dto.getAttachNoMov())
                .attachNoImg(dto.getAttachNoImg())
                .durationSec(dto.getDurationSec() != null ? dto.getDurationSec() : 0)
                .lessonStatCd("R") // 등록(R) 상태
                .insDtime(now)
                .insId(userId)
                .updDtime(now)
                .updId(userId)
                .build();

        return lessonRepository.save(lesson);
    }

    @Transactional
    public BnEduLesson updateLessonStatus(Long lessonNo, String userId, String status) {
        BnEduLesson lesson = lessonRepository.findById(lessonNo)
                .orElseThrow(() -> new RuntimeException("강의자료를 찾을 수 없습니다: " + lessonNo));

        BnEduCourse course = courseRepository.findById(lesson.getCourseNo())
                .orElseThrow(() -> new RuntimeException("연관된 교육과정을 찾을 수 없습니다."));

        if (!course.getUserId().equals(userId)) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }

        lesson.setLessonStatCd(status);
        lesson.setUpdDtime(nowDtime());
        lesson.setUpdId(userId);

        return lessonRepository.save(lesson);
    }

    // --- 4. 수강 평가 내역 조회 ---

    @Transactional(readOnly = true)
    public List<EvaluationResponseDto> getEvaluations(Long courseNo) {
        List<BnEduEvaluation> evals = evaluationRepository.findByCourseNoOrderByInsDtimeDesc(courseNo);
        List<EvaluationResponseDto> list = new ArrayList<>();

        for (BnEduEvaluation e : evals) {
            User user = userRepository.findByUserId(e.getUserId());
            list.add(EvaluationResponseDto.builder()
                    .evalNo(e.getEvalNo())
                    .courseNo(e.getCourseNo())
                    .userId(e.getUserId())
                    .userNm(user != null ? user.getUserNm() : "")
                    .userNickNm(user != null ? user.getUserNickNm() : "익명")
                    .ratingScore(e.getRatingScore())
                    .reviewContent(e.getReviewContent())
                    .likeFg(e.getLikeFg())
                    .insDtime(e.getInsDtime())
                    .build());
        }

        return list;
    }

    // --- 5. 교육 신청 관리 ---

    @Transactional(readOnly = true)
    public List<ApplicationResponseDto> getApplicationsForAmbassador(String userId) {
        List<BnEduCourse> courses = courseRepository.findByUserIdOrderByInsDtimeDesc(userId);
        if (courses.isEmpty()) return new ArrayList<>();

        List<Long> courseNos = courses.stream().map(BnEduCourse::getCourseNo).collect(Collectors.toList());
        List<BnEduApplication> applications = applicationRepository.findByCourseNoInOrderByInsDtimeDesc(courseNos);
        Map<Long, BnEduCourse> courseMap = courses.stream().collect(Collectors.toMap(BnEduCourse::getCourseNo, c -> c));

        List<ApplicationResponseDto> result = new ArrayList<>();
        for (BnEduApplication app : applications) {
            BnEduCourse course = courseMap.get(app.getCourseNo());
            User applicant = userRepository.findByUserId(app.getUserId());

            result.add(ApplicationResponseDto.builder()
                    .appNo(app.getAppNo())
                    .courseNo(app.getCourseNo())
                    .courseTitle(course != null ? course.getCourseTitle() : "삭제된 과정")
                    .eduTypeFg(course != null ? course.getEduTypeFg() : "F")
                    .userId(app.getUserId())
                    .userNm(applicant != null ? applicant.getUserNm() : "")
                    .userNickNm(applicant != null ? applicant.getUserNickNm() : "")
                    .phoneNo(applicant != null ? applicant.getPhoneNo() : "")
                    .paymentAmt(app.getPaymentAmt())
                    .paymentPgKey(app.getPaymentPgKey())
                    .paymentStatFg(app.getPaymentStatFg())
                    .appStatCd(app.getAppStatCd())
                    .appRejectBigo(app.getAppRejectBigo())
                    .insDtime(app.getInsDtime())
                    .build());
        }

        // 신청대기(R) 우선 배치
        result.sort((a, b) -> {
            boolean aReq = "R".equals(a.getAppStatCd());
            boolean bReq = "R".equals(b.getAppStatCd());
            if (aReq && !bReq) return -1;
            if (!aReq && bReq) return 1;
            return b.getInsDtime().compareTo(a.getInsDtime());
        });

        return result;
    }

    @Transactional
    public BnEduApplication updatePaymentStatus(Long appNo, String status, String userId) {
        BnEduApplication app = applicationRepository.findById(appNo)
                .orElseThrow(() -> new RuntimeException("신청 내역을 찾을 수 없습니다: " + appNo));

        app.setPaymentStatFg(status);
        app.setUpdDtime(nowDtime());
        app.setUpdId(userId);

        return applicationRepository.save(app);
    }

    @Transactional
    public BnEduApplication updateApplicationStatus(Long appNo, String status, String rejectBigo, String userId) {
        BnEduApplication app = applicationRepository.findById(appNo)
                .orElseThrow(() -> new RuntimeException("신청 내역을 찾을 수 없습니다: " + appNo));

        BnEduCourse course = courseRepository.findById(app.getCourseNo()).orElse(null);

        // 유상 과정인 경우 결제완료(P) 확인 필수
        if ("A".equals(status) && course != null && "P".equals(course.getEduTypeFg())) {
            if (!"P".equals(app.getPaymentStatFg())) {
                throw new RuntimeException("유상 교육과정은 결제완료 처리 후에만 승인할 수 있습니다.");
            }
        }

        app.setAppStatCd(status);
        if ("J".equals(status) && rejectBigo != null) {
            app.setAppRejectBigo(rejectBigo);
        }
        app.setUpdDtime(nowDtime());
        app.setUpdId(userId);

        return applicationRepository.save(app);
    }

    // --- 6. 사용자용 공개 쇼케이스 및 교육과정 수강 신청 ---

    @Transactional(readOnly = true)
    public List<PublicAmbassadorDto> getPublicAmbassadors() {
        List<BnAmbassador> approvedAmbassadors = ambassadorRepository.findByApplyStatCd("A");
        if (approvedAmbassadors.isEmpty()) {
            return new ArrayList<>();
        }

        // BD900 공통코드 매핑
        Map<String, String> fieldNameMap = new HashMap<>();
        try {
            commDetailRepository.findActiveDetailsByCommCd("BD900").forEach(cd -> {
                fieldNameMap.put(cd.getCommDtlCd(), cd.getCommDtlNm());
            });
        } catch (Exception e) {
            log.warn("공통코드 BD900 조회 실패: {}", e.getMessage());
        }

        List<PublicAmbassadorDto> resultList = new ArrayList<>();

        for (BnAmbassador ambassador : approvedAmbassadors) {
            User user = userRepository.findByUserId(ambassador.getUserId());
            String userNm = user != null ? user.getUserNm() : "";
            String userNickNm = user != null ? (user.getUserNickNm() != null ? user.getUserNickNm() : user.getUserNm()) : ambassador.getUserId();
            String profileImg = null;
            if (user != null && user.getAttachNo() != null) {
                profileImg = cmAttachmentRepository.findById(user.getAttachNo())
                        .map(CmAttachment::getFilePath).orElse(null);
            }

            // 공개 승인(A)된 교육과정 목록 조회
            List<BnEduCourse> courses = courseRepository.findByUserIdAndCourseStatCdOrderByInsDtimeDesc(ambassador.getUserId(), "A");
            List<CourseResponseDto> courseDtos = new ArrayList<>();
            long totalLessons = 0;
            long totalEvaluations = 0;
            double ratingSum = 0;
            long ratedCourses = 0;

            for (BnEduCourse course : courses) {
                String imgUrl = null;
                if (course.getAttachNoImg() != null) {
                    imgUrl = cmAttachmentRepository.findById(course.getAttachNoImg())
                            .map(CmAttachment::getFilePath).orElse(null);
                }
                String movUrl = null;
                if (course.getAttachNoMov() != null) {
                    movUrl = cmAttachmentRepository.findById(course.getAttachNoMov())
                            .map(CmAttachment::getFilePath).orElse(null);
                }

                long lessonCount = lessonRepository.countByCourseNo(course.getCourseNo());
                long approvedLessonCount = lessonRepository.countByCourseNoAndLessonStatCd(course.getCourseNo(), "A");
                long evalCount = evaluationRepository.countByCourseNo(course.getCourseNo());
                Double avgRating = evaluationRepository.findAvgRatingByCourseNo(course.getCourseNo());
                if (avgRating == null) avgRating = 0.0;

                totalLessons += approvedLessonCount;
                totalEvaluations += evalCount;
                if (avgRating > 0) {
                    ratingSum += avgRating;
                    ratedCourses++;
                }

                courseDtos.add(CourseResponseDto.builder()
                        .courseNo(course.getCourseNo())
                        .userId(course.getUserId())
                        .courseTitle(course.getCourseTitle())
                        .courseDesc(course.getCourseDesc())
                        .eduTypeFg(course.getEduTypeFg())
                        .courseAmt(course.getCourseAmt())
                        .attachNoImg(course.getAttachNoImg())
                        .imgUrl(imgUrl)
                        .attachNoMov(course.getAttachNoMov())
                        .movUrl(movUrl)
                        .courseStatCd(course.getCourseStatCd())
                        .insDtime(course.getInsDtime())
                        .lessonCount(lessonCount)
                        .approvedLessonCount(approvedLessonCount)
                        .evaluationCount(evalCount)
                        .avgRating(avgRating)
                        .build());
            }

            double ambassadorAvgRating = ratedCourses > 0 ? (ratingSum / ratedCourses) : 0.0;
            String fieldName = fieldNameMap.getOrDefault(ambassador.getActivityField(), ambassador.getActivityField());

            resultList.add(PublicAmbassadorDto.builder()
                    .userId(ambassador.getUserId())
                    .userNm(userNm)
                    .userNickNm(userNickNm)
                    .profileImg(profileImg)
                    .activityField(ambassador.getActivityField())
                    .activityFieldNm(fieldName)
                    .introContent(ambassador.getIntroContent())
                    .portfolioUrl(ambassador.getPortfolioUrl())
                    .snsUrl(ambassador.getSnsUrl())
                    .courseCount(courseDtos.size())
                    .totalLessons(totalLessons)
                    .avgRating(Math.round(ambassadorAvgRating * 10.0) / 10.0)
                    .totalEvaluations(totalEvaluations)
                    .courses(courseDtos)
                    .build());
        }

        // 코스가 있는 엠버서더 우선 정렬
        resultList.sort((a, b) -> {
            if (a.getCourseCount() > 0 && b.getCourseCount() == 0) return -1;
            if (a.getCourseCount() == 0 && b.getCourseCount() > 0) return 1;
            return b.getCourseCount() - a.getCourseCount();
        });

        return resultList;
    }

    @Transactional(readOnly = true)
    public PublicCourseDetailDto getPublicCourseDetail(Long courseNo) {
        BnEduCourse course = courseRepository.findById(courseNo)
                .orElseThrow(() -> new RuntimeException("교육과정을 찾을 수 없습니다: " + courseNo));

        if (!"A".equals(course.getCourseStatCd())) {
            throw new RuntimeException("현재 공개 승인되지 않은 교육과정입니다.");
        }

        String imgUrl = null;
        if (course.getAttachNoImg() != null) {
            imgUrl = cmAttachmentRepository.findById(course.getAttachNoImg())
                    .map(CmAttachment::getFilePath).orElse(null);
        }
        String movUrl = null;
        if (course.getAttachNoMov() != null) {
            movUrl = cmAttachmentRepository.findById(course.getAttachNoMov())
                    .map(CmAttachment::getFilePath).orElse(null);
        }

        long lessonCount = lessonRepository.countByCourseNo(course.getCourseNo());
        long approvedLessonCount = lessonRepository.countByCourseNoAndLessonStatCd(course.getCourseNo(), "A");
        long evalCount = evaluationRepository.countByCourseNo(course.getCourseNo());
        Double avgRating = evaluationRepository.findAvgRatingByCourseNo(course.getCourseNo());
        if (avgRating == null) avgRating = 0.0;

        CourseResponseDto courseDto = CourseResponseDto.builder()
                .courseNo(course.getCourseNo())
                .userId(course.getUserId())
                .courseTitle(course.getCourseTitle())
                .courseDesc(course.getCourseDesc())
                .eduTypeFg(course.getEduTypeFg())
                .courseAmt(course.getCourseAmt())
                .attachNoImg(course.getAttachNoImg())
                .imgUrl(imgUrl)
                .attachNoMov(course.getAttachNoMov())
                .movUrl(movUrl)
                .courseStatCd(course.getCourseStatCd())
                .insDtime(course.getInsDtime())
                .lessonCount(lessonCount)
                .approvedLessonCount(approvedLessonCount)
                .evaluationCount(evalCount)
                .avgRating(avgRating)
                .build();

        // 엠버서더 정보
        BnAmbassador ambassador = ambassadorRepository.findByUserId(course.getUserId()).orElse(null);
        User user = userRepository.findByUserId(course.getUserId());
        String profileImg = null;
        if (user != null && user.getAttachNo() != null) {
            profileImg = cmAttachmentRepository.findById(user.getAttachNo())
                    .map(CmAttachment::getFilePath).orElse(null);
        }

        String fieldName = ambassador != null ? ambassador.getActivityField() : "";
        try {
            if (ambassador != null) {
                commDetailRepository.findActiveDetailsByCommCd("BD900").stream()
                        .filter(cd -> cd.getCommDtlCd().equals(ambassador.getActivityField()))
                        .findFirst()
                        .ifPresent(cd -> {});
            }
        } catch (Exception ignored) {}

        PublicAmbassadorDto ambassadorDto = PublicAmbassadorDto.builder()
                .userId(course.getUserId())
                .userNm(user != null ? user.getUserNm() : "")
                .userNickNm(user != null ? (user.getUserNickNm() != null ? user.getUserNickNm() : user.getUserNm()) : course.getUserId())
                .profileImg(profileImg)
                .activityField(ambassador != null ? ambassador.getActivityField() : "")
                .activityFieldNm(fieldName)
                .introContent(ambassador != null ? ambassador.getIntroContent() : "")
                .portfolioUrl(ambassador != null ? ambassador.getPortfolioUrl() : "")
                .snsUrl(ambassador != null ? ambassador.getSnsUrl() : "")
                .build();

        // 승인된 차시 목록만 전달
        List<BnEduLesson> approvedLessons = lessonRepository.findByCourseNoAndLessonStatCdOrderByLessonSeqAsc(courseNo, "A");
        List<LessonResponseDto> lessonDtos = new ArrayList<>();
        for (BnEduLesson l : approvedLessons) {
            String lVideoUrl = null;
            if (l.getAttachNoMov() != null) {
                lVideoUrl = cmAttachmentRepository.findById(l.getAttachNoMov())
                        .map(CmAttachment::getFilePath).orElse(null);
            }
            String lImgUrl = null;
            if (l.getAttachNoImg() != null) {
                lImgUrl = cmAttachmentRepository.findById(l.getAttachNoImg())
                        .map(CmAttachment::getFilePath).orElse(null);
            }
            lessonDtos.add(LessonResponseDto.builder()
                    .lessonNo(l.getLessonNo())
                    .courseNo(l.getCourseNo())
                    .lessonSeq(l.getLessonSeq())
                    .lessonTitle(l.getLessonTitle())
                    .lessonDesc(l.getLessonDesc())
                    .attachNoMov(l.getAttachNoMov())
                    .videoUrl(lVideoUrl)
                    .attachNoImg(l.getAttachNoImg())
                    .imgUrl(lImgUrl)
                    .durationSec(l.getDurationSec())
                    .lessonStatCd(l.getLessonStatCd())
                    .insDtime(l.getInsDtime())
                    .build());
        }

        List<EvaluationResponseDto> evaluations = getEvaluations(courseNo);

        return PublicCourseDetailDto.builder()
                .course(courseDto)
                .ambassador(ambassadorDto)
                .lessons(lessonDtos)
                .evaluations(evaluations)
                .build();
    }

    @Transactional
    public BnEduApplication applyCourse(Long courseNo, String userId, CourseApplyRequestDto dto) {
        BnEduCourse course = courseRepository.findById(courseNo)
                .orElseThrow(() -> new RuntimeException("교육과정을 찾을 수 없습니다: " + courseNo));

        if (!"A".equals(course.getCourseStatCd())) {
            throw new RuntimeException("현재 수강 신청이 불가능한 교육과정입니다.");
        }

        if (course.getUserId().equals(userId)) {
            // 본인이 개설한 강좌인 경우에도 'A'(승인완료) 상태로 등록/반환
            List<BnEduApplication> existing = applicationRepository.findByCourseNoAndUserId(courseNo, userId);
            if (!existing.isEmpty()) {
                BnEduApplication app = existing.get(0);
                if (!"A".equals(app.getAppStatCd())) {
                    app.setAppStatCd("A");
                    app.setUpdDtime(nowDtime());
                    app.setUpdId(userId);
                    return applicationRepository.save(app);
                }
                return app;
            }
            BnEduApplication ownerApp = BnEduApplication.builder()
                    .courseNo(courseNo)
                    .userId(userId)
                    .paymentAmt(0)
                    .paymentStatFg("F")
                    .appStatCd("A") // 즉시 승인
                    .insDtime(nowDtime())
                    .insId(userId)
                    .build();
            return applicationRepository.save(ownerApp);
        }

        // 이미 신청된 내역이 있는지 확인 (있으면 그대로 반환하여 멱등성 보장)
        List<BnEduApplication> existing = applicationRepository.findByCourseNoAndUserId(courseNo, userId);
        if (!existing.isEmpty()) {
            BnEduApplication app = existing.get(0);
            if (!"A".equals(app.getAppStatCd())) {
                app.setAppStatCd("A");
                app.setUpdDtime(nowDtime());
                app.setUpdId(userId);
                return applicationRepository.save(app);
            }
            return app;
        }

        String now = nowDtime();
        boolean isPaid = "P".equals(course.getEduTypeFg());

        // 무조건 결제완료/무상 및 승인완료('A') 처리 (무료: F/A, 유료: P/A)
        BnEduApplication app = BnEduApplication.builder()
                .courseNo(courseNo)
                .userId(userId)
                .paymentAmt(isPaid ? (course.getCourseAmt() != null ? course.getCourseAmt() : 0) : 0)
                .paymentPgKey(null)
                .paymentStatFg(isPaid ? "P" : "F") // P: 결제완료, F: 무상
                .appStatCd("A")                    // A: 승인완료 (즉시 자동 승인)
                .appRejectBigo(dto != null ? dto.getAppMemo() : null)
                .insDtime(now)
                .insId(userId)
                .updDtime(now)
                .updId(userId)
                .build();

        return applicationRepository.save(app);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponseDto> getMyApplications(String userId) {
        List<BnEduApplication> applications = applicationRepository.findByUserIdOrderByInsDtimeDesc(userId);
        List<ApplicationResponseDto> result = new ArrayList<>();

        for (BnEduApplication app : applications) {
            BnEduCourse course = courseRepository.findById(app.getCourseNo()).orElse(null);
            User user = userRepository.findByUserId(app.getUserId());

            result.add(ApplicationResponseDto.builder()
                    .appNo(app.getAppNo())
                    .courseNo(app.getCourseNo())
                    .courseTitle(course != null ? course.getCourseTitle() : "삭제된 과정")
                    .eduTypeFg(course != null ? course.getEduTypeFg() : "F")
                    .userId(app.getUserId())
                    .userNm(user != null ? user.getUserNm() : "")
                    .userNickNm(user != null ? user.getUserNickNm() : "")
                    .phoneNo(user != null ? user.getPhoneNo() : "")
                    .paymentAmt(app.getPaymentAmt())
                    .paymentPgKey(app.getPaymentPgKey())
                    .paymentStatFg(app.getPaymentStatFg())
                    .appStatCd(app.getAppStatCd())
                    .appRejectBigo(app.getAppRejectBigo())
                    .insDtime(app.getInsDtime())
                    .build());
        }

        return result;
    }

    // --- DTO Classes ---

    @Data
    public static class AmbassadorApplyDto {
        private String activityField;
        private String introContent;
        private String portfolioUrl;
        private String snsUrl;
        private Long attachNo;
    }

    @Data
    public static class CourseRequestDto {
        private String courseTitle;
        private String courseDesc;
        private String eduTypeFg;
        private Integer courseAmt;
        private Long attachNoImg;
        private Long attachNoMov;
    }

    @Data
    @Builder
    public static class CourseResponseDto {
        private Long courseNo;
        private String userId;
        private String courseTitle;
        private String courseDesc;
        private String eduTypeFg;
        private Integer courseAmt;
        private Long attachNoImg;
        private String imgUrl;
        private Long attachNoMov;
        private String movUrl;
        private String courseStatCd;
        private String insDtime;
        private Long lessonCount;
        private Long approvedLessonCount;
        private Long evaluationCount;
        private Double avgRating;
    }

    @Data
    public static class LessonRequestDto {
        private Integer lessonSeq;
        private String lessonTitle;
        private String lessonDesc;
        private Long attachNoMov; // 필수 (본강의 동영상)
        private Long attachNoImg; // 선택 (강의 대표 이미지)
        private Integer durationSec;
    }

    @Data
    @Builder
    public static class LessonResponseDto {
        private Long lessonNo;
        private Long courseNo;
        private Integer lessonSeq;
        private String lessonTitle;
        private String lessonDesc;
        private Long attachNoMov;
        private String videoUrl;
        private Long attachNoImg;
        private String imgUrl;
        private Integer durationSec;
        private String lessonStatCd;
        private String insDtime;
    }

    @Data
    @Builder
    public static class EvaluationResponseDto {
        private Long evalNo;
        private Long courseNo;
        private String userId;
        private String userNm;
        private String userNickNm;
        private Integer ratingScore;
        private String reviewContent;
        private String likeFg;
        private String insDtime;
    }

    @Data
    @Builder
    public static class ApplicationResponseDto {
        private Long appNo;
        private Long courseNo;
        private String courseTitle;
        private String eduTypeFg;
        private String userId;
        private String userNm;
        private String userNickNm;
        private String phoneNo;
        private Integer paymentAmt;
        private String paymentPgKey;
        private String paymentStatFg;
        private String appStatCd;
        private String appRejectBigo;
        private String insDtime;
    }

    @Data
    @Builder
    public static class PublicAmbassadorDto {
        private String userId;
        private String userNm;
        private String userNickNm;
        private String profileImg;
        private String activityField;
        private String activityFieldNm;
        private String introContent;
        private String portfolioUrl;
        private String snsUrl;
        private Integer courseCount;
        private Long totalLessons;
        private Double avgRating;
        private Long totalEvaluations;
        private List<CourseResponseDto> courses;
    }

    @Data
    @Builder
    public static class PublicCourseDetailDto {
        private CourseResponseDto course;
        private PublicAmbassadorDto ambassador;
        private List<LessonResponseDto> lessons;
        private List<EvaluationResponseDto> evaluations;
    }

    @Data
    public static class CourseApplyRequestDto {
        private String appMemo;
    }
}
