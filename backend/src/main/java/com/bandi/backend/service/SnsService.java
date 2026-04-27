package com.bandi.backend.service;

import com.bandi.backend.dto.PostCreateDto;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.entity.sns.Post;
import com.bandi.backend.entity.sns.PostAttachment;
import com.bandi.backend.repository.CmAttachmentRepository;
import com.bandi.backend.repository.PostAttachmentRepository;
import com.bandi.backend.repository.PostRepository;
import com.bandi.backend.repository.UserRepository;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.utils.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.bandi.backend.dto.PostListDto;
import com.bandi.backend.dto.ShortsListDto;
import com.bandi.backend.dto.ShortsCreateDto;
import com.bandi.backend.entity.sns.Shorts;
import com.bandi.backend.repository.ShortsRepository;

@Service
@RequiredArgsConstructor
public class SnsService {

    private final PostRepository postRepository;
    private final PostAttachmentRepository postAttachmentRepository;
    private final CmAttachmentRepository cmAttachmentRepository;
    private final ShortsRepository shortsRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createPost(PostCreateDto dto, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("게시물 생성 시 이미지는 최소 1장 이상 필수입니다.");
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // 1. Post 엔티티 저장
        Post post = new Post();
        post.setUserId(dto.getUserId());
        post.setContent(dto.getContent());
        post.setPublicTypeCd(dto.getPublicTypeCd());
        post.setPostStatCd("A"); // A: 정상 (가정)
        post.setInsDtime(currentDateTime);
        post.setUpdDtime(currentDateTime);

        Post savedPost = postRepository.save(post);

        // 2. 다중 이미지 등록 및 연관 정보 저장
        String uploadDir = FileStorageUtil.getUploadDir();
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            try {
                String originalFileName = file.getOriginalFilename();
                String extension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    extension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String savedFileName = UUID.randomUUID().toString() + extension;
                File dest = new File(dir, savedFileName);
                file.transferTo(dest);

                // CM_ATTACHMENT 에 저장
                CmAttachment attachment = new CmAttachment();
                attachment.setFileName(originalFileName);
                attachment.setFilePath("/api/common_images/" + savedFileName);
                attachment.setFileSize(file.getSize());
                attachment.setMimeType(file.getContentType());
                attachment.setInsDtime(currentDateTime);
                attachment.setInsId(dto.getUserId());
                attachment.setUpdDtime(currentDateTime);
                attachment.setUpdId(dto.getUserId());

                CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);

                // MM_POSTS_ATTACHMENT 에 매핑 정보 저장
                PostAttachment postAttachment = new PostAttachment();
                postAttachment.setPostId(savedPost.getPostId());
                postAttachment.setAttachNo(savedAttachment.getAttachNo());
                postAttachment.setPostStatCd("A");
                postAttachment.setInsDtime(currentDateTime);
                postAttachment.setUpdDtime(currentDateTime);

                postAttachmentRepository.save(postAttachment);

            } catch (IOException e) {
                throw new RuntimeException("게시물 이미지 업로드 중 오류가 발생했습니다.", e);
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<PostListDto> getPostsByUser(String userId, Pageable pageable) {
        Page<Post> postsPage = postRepository.findByUserIdAndPostStatCdOrderByInsDtimeDesc(userId, "A", pageable);
        User user = userRepository.findById(userId).orElse(null);
        String userNickNm = user != null ? user.getUserNickNm() : userId;

        return postsPage.map(post -> {
            List<PostAttachment> attaches = postAttachmentRepository.findByPostId(post.getPostId());
            List<String> imagePaths = attaches.stream()
                    .map(attach -> cmAttachmentRepository.findById(attach.getAttachNo()).orElse(null))
                    .filter(cm -> cm != null)
                    .map(cm -> cm.getFilePath())
                    .collect(Collectors.toList());

            String thumbnailPath = imagePaths.isEmpty() ? null : imagePaths.get(0);

            return PostListDto.builder()
                    .postId(post.getPostId())
                    .userId(post.getUserId())
                    .userNickNm(userNickNm)
                    .contentPreview(post.getContent() != null && post.getContent().length() > 50 
                                    ? post.getContent().substring(0, 50) + "..." 
                                    : post.getContent())
                    .thumbnailPath(thumbnailPath)
                    .imagePaths(imagePaths)
                    .publicTypeCd(post.getPublicTypeCd())
                    .insDtime(post.getInsDtime())
                    .build();
        });
    }

    @Transactional(readOnly = true)
    public Page<ShortsListDto> getShortsByUser(String userId, Pageable pageable) {
        User user = userRepository.findById(userId).orElse(null);
        String userNickNm = user != null ? user.getUserNickNm() : userId;

        return shortsRepository.findByUserIdAndShortsStatCdOrderByInsDtimeDesc(userId, "A", pageable).map(shorts -> {
            String videoPath = null;
            if (shorts.getVideoAttachNo() != null) {
                 CmAttachment cmAttach = cmAttachmentRepository.findById(shorts.getVideoAttachNo()).orElse(null);
                 if (cmAttach != null) {
                     videoPath = cmAttach.getFilePath();
                 }
            }
            
            return ShortsListDto.builder()
                    .shortsNo(shorts.getShortsNo())
                    .userId(shorts.getUserId())
                    .userNickNm(userNickNm)
                    .title(shorts.getTitle())
                    .videoPath(videoPath)
                    .publicTypeCd(shorts.getPublicTypeCd())
                    .insDtime(shorts.getInsDtime())
                    .build();
        });
    }

    @Transactional(readOnly = true)
    public Page<PostListDto> getPublicPosts(Pageable pageable) {
        Page<Post> postsPage = postRepository.findByPublicTypeCdAndPostStatCdOrderByInsDtimeDesc("A", "A", pageable);

        return postsPage.map(post -> {
            User user = userRepository.findById(post.getUserId()).orElse(null);
            String userNickNm = user != null ? user.getUserNickNm() : post.getUserId();

            List<PostAttachment> attaches = postAttachmentRepository.findByPostId(post.getPostId());
            List<String> imagePaths = attaches.stream()
                    .map(attach -> cmAttachmentRepository.findById(attach.getAttachNo()).orElse(null))
                    .filter(cm -> cm != null)
                    .map(cm -> cm.getFilePath())
                    .collect(Collectors.toList());

            String thumbnailPath = imagePaths.isEmpty() ? null : imagePaths.get(0);

            return PostListDto.builder()
                    .postId(post.getPostId())
                    .userId(post.getUserId())
                    .userNickNm(userNickNm)
                    .contentPreview(post.getContent() != null && post.getContent().length() > 50 
                                    ? post.getContent().substring(0, 50) + "..." 
                                    : post.getContent())
                    .thumbnailPath(thumbnailPath)
                    .imagePaths(imagePaths)
                    .publicTypeCd(post.getPublicTypeCd())
                    .insDtime(post.getInsDtime())
                    .build();
        });
    }

    @Transactional(readOnly = true)
    public Page<ShortsListDto> getPublicShorts(Pageable pageable) {
        return shortsRepository.findByPublicTypeCdAndShortsStatCdOrderByInsDtimeDesc("A", "A", pageable).map(shorts -> {
            User user = userRepository.findById(shorts.getUserId()).orElse(null);
            String userNickNm = user != null ? user.getUserNickNm() : shorts.getUserId();

            String videoPath = null;
            if (shorts.getVideoAttachNo() != null) {
                 CmAttachment cmAttach = cmAttachmentRepository.findById(shorts.getVideoAttachNo()).orElse(null);
                 if (cmAttach != null) {
                     videoPath = cmAttach.getFilePath();
                 }
            }
            
            return ShortsListDto.builder()
                    .shortsNo(shorts.getShortsNo())
                    .userId(shorts.getUserId())
                    .userNickNm(userNickNm)
                    .title(shorts.getTitle())
                    .videoPath(videoPath)
                    .publicTypeCd(shorts.getPublicTypeCd())
                    .insDtime(shorts.getInsDtime())
                    .build();
        });
    }

    @Transactional
    public void createShorts(ShortsCreateDto dto, MultipartFile videoFile, MultipartFile thumbnailFile) {
        if (videoFile == null || videoFile.isEmpty()) {
            throw new IllegalArgumentException("쇼츠 동영상 파일은 필수입니다.");
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        try {
            // 1. 비디오 파일 저장 (OS별 유동적 경로)
            String shortsDirStr = FileStorageUtil.getShortsDir();
            File shortsDir = new File(shortsDirStr);
            if (!shortsDir.exists()) {
                shortsDir.mkdirs();
            }

            String videoExt = "";
            String videoOrigName = videoFile.getOriginalFilename();
            if (videoOrigName != null && videoOrigName.contains(".")) {
                videoExt = videoOrigName.substring(videoOrigName.lastIndexOf("."));
            }
            String videoSavedName = UUID.randomUUID().toString() + videoExt;
            File videoDest = new File(shortsDir, videoSavedName);
            videoFile.transferTo(videoDest);

            // 비디오 CmAttachment 생성
            CmAttachment videoAttach = new CmAttachment();
            videoAttach.setFileName(videoOrigName);
            // 프론트엔드 접근 경로 (API Prefix 추가)
            videoAttach.setFilePath("/api/shorts/" + videoSavedName);
            videoAttach.setFileSize(videoFile.getSize());
            videoAttach.setMimeType(videoFile.getContentType());
            videoAttach.setInsDtime(currentDateTime);
            videoAttach.setInsId(dto.getUserId());
            videoAttach.setUpdDtime(currentDateTime);
            videoAttach.setUpdId(dto.getUserId());

            CmAttachment savedVideoAttach = cmAttachmentRepository.save(videoAttach);

            // 2. 썸네일 파일 저장 (선택), 기존 공통 경로 사용
            CmAttachment savedThumbAttach = null;
            if (thumbnailFile != null && !thumbnailFile.isEmpty()) {
                String uploadDir = FileStorageUtil.getUploadDir();
                File thumbDir = new File(uploadDir);
                if (!thumbDir.exists()) thumbDir.mkdirs();

                String thumbExt = "";
                String thumbOrigName = thumbnailFile.getOriginalFilename();
                if (thumbOrigName != null && thumbOrigName.contains(".")) {
                    thumbExt = thumbOrigName.substring(thumbOrigName.lastIndexOf("."));
                }
                String thumbSavedName = UUID.randomUUID().toString() + thumbExt;
                File thumbDest = new File(thumbDir, thumbSavedName);
                thumbnailFile.transferTo(thumbDest);

                CmAttachment thumbAttach = new CmAttachment();
                thumbAttach.setFileName(thumbOrigName);
                thumbAttach.setFilePath("/api/common_images/" + thumbSavedName);
                thumbAttach.setFileSize(thumbnailFile.getSize());
                thumbAttach.setMimeType(thumbnailFile.getContentType());
                thumbAttach.setInsDtime(currentDateTime);
                thumbAttach.setInsId(dto.getUserId());
                thumbAttach.setUpdDtime(currentDateTime);
                thumbAttach.setUpdId(dto.getUserId());

                savedThumbAttach = cmAttachmentRepository.save(thumbAttach);
            }

            // 3. Shorts 엔티티 생성
            Shorts shorts = new Shorts();
            shorts.setUserId(dto.getUserId());
            shorts.setTitle(dto.getTitle());
            shorts.setDuration(dto.getDuration() != null ? dto.getDuration() : 0);
            shorts.setVideoAttachNo(savedVideoAttach.getAttachNo());
            if (savedThumbAttach != null) {
                shorts.setThumbnailAttachNo(savedThumbAttach.getAttachNo());
            }
            shorts.setPublicTypeCd(dto.getPublicTypeCd());
            shorts.setShortsStatCd("A");
            shorts.setInsDtime(currentDateTime);
            shorts.setUpdDtime(currentDateTime);

            shortsRepository.save(shorts);

        } catch (IOException e) {
            throw new RuntimeException("쇼츠 파일 업로드 중 오류가 발생했습니다.", e);
        }
    }

    @Transactional
    public void deletePost(Long postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시물을 찾을 수 없습니다."));
        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        post.setPostStatCd("D");
        post.setUpdDtime(currentDateTime);
        postRepository.save(post);
    }

    @Transactional
    public void deleteShorts(Long shortsNo, String userId) {
        Shorts shorts = shortsRepository.findById(shortsNo)
                .orElseThrow(() -> new RuntimeException("쇼츠를 찾을 수 없습니다."));
        if (!shorts.getUserId().equals(userId)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        shorts.setShortsStatCd("D");
        shorts.setUpdDtime(currentDateTime);
        shortsRepository.save(shorts);
    }

    @Transactional
    public void updatePostPublicType(Long postId, String userId, String publicTypeCd) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시물을 찾을 수 없습니다."));
        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        post.setPublicTypeCd(publicTypeCd);
        post.setUpdDtime(currentDateTime);
        postRepository.save(post);
    }

    @Transactional
    public void updateShortsPublicType(Long shortsNo, String userId, String publicTypeCd) {
        Shorts shorts = shortsRepository.findById(shortsNo)
                .orElseThrow(() -> new RuntimeException("쇼츠를 찾을 수 없습니다."));
        if (!shorts.getUserId().equals(userId)) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        shorts.setPublicTypeCd(publicTypeCd);
        shorts.setUpdDtime(currentDateTime);
        shortsRepository.save(shorts);
    }
}
