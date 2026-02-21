package com.bandi.backend.service;

import com.bandi.backend.dto.UserProfileDto;
import com.bandi.backend.dto.UserProfileUpdateDto;
import com.bandi.backend.dto.UserSkillDto;
import com.bandi.backend.dto.MyScrapDto;
import com.bandi.backend.dto.MyPostDto;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.entity.common.CommDetail;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.entity.member.UserSessionSkill;
import com.bandi.backend.repository.CmAttachmentRepository;
import com.bandi.backend.repository.CommDetailRepository;
import com.bandi.backend.repository.UserRepository;
import com.bandi.backend.repository.UserSessionSkillRepository;
import com.bandi.backend.repository.BnEvaluationResultRepository;
import com.bandi.backend.repository.CmScrapRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserSessionSkillRepository userSessionSkillRepository;
    private final CmAttachmentRepository cmAttachmentRepository;
    private final CommDetailRepository commDetailRepository;
    private final BnEvaluationResultRepository bnEvaluationResultRepository;
    private final CmScrapRepository cmScrapRepository;

    public UserProfileDto getUserProfile(String userId) {
        User user = userRepository.findByUserId(userId);
        if (user == null) {
            throw new RuntimeException("User not found: " + userId);
        }

        // 1. Get Profile Image
        String profileImageUrl = null;
        if (user.getAttachNo() != null) {
            CmAttachment attachment = cmAttachmentRepository.findById(user.getAttachNo()).orElse(null);
            if (attachment != null) {
                profileImageUrl = attachment.getFilePath();
            }
        }

        // 2. Get Skills
        List<UserSessionSkill> userSkills = userSessionSkillRepository.findByUserId(userId);
        Map<String, Long> userSkillMap = userSkills.stream()
                .collect(Collectors.toMap(UserSessionSkill::getSessionTypeCd, UserSessionSkill::getSessionSkillScore));

        // 3. Get All Session Types (BD100)
        List<CommDetail> sessionTypes = commDetailRepository.findActiveDetailsByCommCd("BD100");

        // 4. Construct Skill DTOs
        List<UserSkillDto> skillDtos = sessionTypes.stream()
                .map(st -> UserSkillDto.builder()
                        .sessionTypeCd(st.getCommDtlCd())
                        .sessionTypeNm(st.getCommDtlNm())
                        .score(userSkillMap.getOrDefault(st.getCommDtlCd(), 1L)) // Default 1
                        .build())
                .collect(Collectors.toList());

        // 5. Get User Evaluation Stats
        Double mannerScore = 0.0;
        Integer moodMakerCount = 0;
        Object[][] stats = bnEvaluationResultRepository.getUserEvalStats(userId);
        if (stats != null && stats.length > 0 && stats[0] != null) {
            Object[] row = stats[0];
            if (row[0] != null)
                mannerScore = ((BigDecimal) row[0]).doubleValue();
            if (row[1] != null)
                moodMakerCount = ((Number) row[1]).intValue();
        }

        return UserProfileDto.builder()
                .userId(user.getUserId())
                .userNm(user.getUserNm())
                .userNickNm(user.getUserNickNm())
                .email(user.getEmail())
                .genderCd(user.getGenderCd())
                .mbti(user.getMbti())
                .adminYn(user.getAdminYn())
                .skillsConfigured(!userSkills.isEmpty())
                .profileImageUrl(profileImageUrl)
                .mannerScore(mannerScore)
                .moodMakerCount(moodMakerCount)
                .skills(skillDtos)
                .build();
    }

    @Transactional
    public void updateUserProfile(UserProfileUpdateDto dto, MultipartFile file) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        User user = userRepository.findByUserId(dto.getUserId());
        if (user == null) {
            throw new RuntimeException("User not found: " + dto.getUserId());
        }

        // 1. Update Basic Info
        if (dto.getUserNickNm() != null)
            user.setUserNickNm(dto.getUserNickNm());
        if (dto.getEmail() != null)
            user.setEmail(dto.getEmail());
        if (dto.getGenderCd() != null)
            user.setGenderCd(dto.getGenderCd());
        if (dto.getMbti() != null)
            user.setMbti(dto.getMbti());
        user.setUpdDtime(currentDateTime);
        user.setUpdId(dto.getUserId());

        // 2. Handle File Upload
        if (file != null && !file.isEmpty()) {
            try {
                String uploadDir = "d:/Project/bandi/frontend-web/public/common_images";
                File dir = new File(uploadDir);
                if (!dir.exists())
                    dir.mkdirs();

                String originalFileName = file.getOriginalFilename();
                String extension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    extension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String savedFileName = UUID.randomUUID().toString() + extension;
                File dest = new File(dir, savedFileName);
                file.transferTo(dest);

                CmAttachment attachment = new CmAttachment();
                attachment.setFileName(originalFileName);
                attachment.setFilePath("/common_images/" + savedFileName);
                attachment.setFileSize(file.getSize());
                attachment.setMimeType(file.getContentType());
                attachment.setInsDtime(currentDateTime);
                attachment.setInsId(dto.getUserId());
                attachment.setUpdDtime(currentDateTime);
                attachment.setUpdId(dto.getUserId());

                CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);
                user.setAttachNo(savedAttachment.getAttachNo());

            } catch (IOException e) {
                log.error("Failed to upload file", e);
                throw new RuntimeException("File upload failed", e);
            }
        }

        // 3. Handle Skills
        if (dto.getSkills() != null) {
            // Delete existing skills
            userSessionSkillRepository.deleteByUserId(dto.getUserId());

            // Save new skills
            for (UserSkillDto skillDto : dto.getSkills()) {
                UserSessionSkill skill = new UserSessionSkill();
                skill.setUserId(dto.getUserId());
                skill.setSessionTypeCd(skillDto.getSessionTypeCd());
                skill.setSessionSkillScore(skillDto.getScore());
                skill.setInsDtime(currentDateTime);
                skill.setInsId(dto.getUserId());
                skill.setUpdDtime(currentDateTime);
                skill.setUpdId(dto.getUserId());
                userSessionSkillRepository.save(skill);
            }
        }

        userRepository.save(user);
    }

    public List<MyScrapDto> getMyScrapList(String userId) {
        List<Map<String, Object>> result = cmScrapRepository.findMyScraps(userId);
        return result.stream().map(row -> {
            MyScrapDto dto = new MyScrapDto();
            dto.setScrapNo(row.get("scrapNo") != null ? ((Number) row.get("scrapNo")).longValue() : null);
            dto.setScrapTableNm((String) row.get("scrapTableNm"));
            dto.setScrapTablePkNo(
                    row.get("scrapTablePkNo") != null ? ((Number) row.get("scrapTablePkNo")).longValue() : null);
            dto.setParam1((String) row.get("param1"));
            dto.setParam2((String) row.get("param2"));
            dto.setTitle((String) row.get("title"));
            dto.setWriterName((String) row.get("writerName"));
            dto.setLikeCnt(row.get("likeCnt") != null ? ((Number) row.get("likeCnt")).longValue() : 0L);
            dto.setReplyCnt(row.get("replyCnt") != null ? ((Number) row.get("replyCnt")).longValue() : 0L);
            dto.setScrapDate((String) row.get("scrapDate"));
            dto.setOriginalRegDate((String) row.get("originalRegDate"));
            return dto;
        }).collect(Collectors.toList());
    }

    private MyPostDto mapToMyPostDto(Map<String, Object> row) {
        MyPostDto dto = new MyPostDto();
        dto.setPostType((String) row.get("post_type"));
        dto.setPkNo(row.get("pk_no") != null ? ((Number) row.get("pk_no")).longValue() : null);
        dto.setParam1((String) row.get("param1"));
        dto.setParam2((String) row.get("param2"));
        dto.setTitle((String) row.get("title"));
        dto.setLikeCnt(row.get("like_cnt") != null ? ((Number) row.get("like_cnt")).longValue() : 0L);
        dto.setReplyCnt(row.get("reply_cnt") != null ? ((Number) row.get("reply_cnt")).longValue() : 0L);
        dto.setRegDate((String) row.get("reg_date"));
        return dto;
    }

    public List<MyPostDto> getMyPosts(String userId, int page, int size) {
        return cmScrapRepository.findMyPosts(userId, size, page * size)
                .stream().map(this::mapToMyPostDto).collect(Collectors.toList());
    }

    public List<MyPostDto> getMyCommentedPosts(String userId, int page, int size) {
        return cmScrapRepository.findMyCommentedPosts(userId, size, page * size)
                .stream().map(this::mapToMyPostDto).collect(Collectors.toList());
    }
}
