package com.bandi.backend.service;

import com.bandi.backend.dto.*;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.entity.sns.*;
import com.bandi.backend.repository.*;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SnsService {

    private final PostRepository postRepository;
    private final PostAttachmentRepository postAttachmentRepository;
    private final CmAttachmentRepository cmAttachmentRepository;
    private final ShortsRepository shortsRepository;
    private final UserRepository userRepository;

    private final PostLikeRepository postLikeRepository;
    private final PostViewRepository postViewRepository;
    private final PostDetailRepository postDetailRepository;

    private final ShortsLikeRepository shortsLikeRepository;
    private final ShortsViewRepository shortsViewRepository;
    private final ShortsDetailRepository shortsDetailRepository;

    @Transactional
    public void createPost(PostCreateDto dto, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("게시물 생성 시 이미지는 최소 1장 이상 필수입니다.");
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        Post post = new Post();
        post.setUserId(dto.getUserId());
        post.setContent(dto.getContent());
        post.setPublicTypeCd(dto.getPublicTypeCd());
        post.setPostStatCd("A");
        post.setInsDtime(currentDateTime);
        post.setUpdDtime(currentDateTime);

        Post savedPost = postRepository.save(post);

        String uploadDir = FileStorageUtil.getUploadDir();
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
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

                PostAttachment postAttachment = new PostAttachment();
                postAttachment.setPostId(savedPost.getPostId());
                postAttachment.setAttachNo(savedAttachment.getAttachNo());
                postAttachment.setPostStatCd("A");
                postAttachment.setInsDtime(currentDateTime);
                postAttachment.setUpdDtime(currentDateTime);
                if (dto.getEditDataList() != null && i < dto.getEditDataList().size()) {
                    postAttachment.setEditData(dto.getEditDataList().get(i));
                }

                postAttachmentRepository.save(postAttachment);

            } catch (IOException e) {
                throw new RuntimeException("게시물 이미지 업로드 중 오류가 발생했습니다.", e);
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<PostListDto> getPostsByUser(String userId, String currentUserId, Pageable pageable) {
        Page<Post> postsPage = postRepository.findByUserIdAndPostStatCdOrderByInsDtimeDesc(userId, "A", pageable);
        User user = userRepository.findById(userId).orElse(null);
        String userNickNm = user != null ? user.getUserNickNm() : userId;

        return postsPage.map(post -> mapToPostListDto(post, userNickNm, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<ShortsListDto> getShortsByUser(String userId, String currentUserId, Pageable pageable) {
        User user = userRepository.findById(userId).orElse(null);
        String userNickNm = user != null ? user.getUserNickNm() : userId;

        return shortsRepository.findByUserIdAndShortsStatCdOrderByInsDtimeDesc(userId, "A", pageable)
                .map(shorts -> mapToShortsListDto(shorts, userNickNm, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<PostListDto> getPublicPosts(String currentUserId, Pageable pageable) {
        Page<Post> postsPage = postRepository.findByPublicTypeCdAndPostStatCdOrderByInsDtimeDesc("A", "A", pageable);

        return postsPage.map(post -> {
            User user = userRepository.findById(post.getUserId()).orElse(null);
            String userNickNm = user != null ? user.getUserNickNm() : post.getUserId();
            return mapToPostListDto(post, userNickNm, currentUserId);
        });
    }

    @Transactional(readOnly = true)
    public Page<ShortsListDto> getPublicShorts(String currentUserId, Pageable pageable) {
        return shortsRepository.findByPublicTypeCdAndShortsStatCdOrderByInsDtimeDesc("A", "A", pageable)
                .map(shorts -> {
                    User user = userRepository.findById(shorts.getUserId()).orElse(null);
                    String userNickNm = user != null ? user.getUserNickNm() : shorts.getUserId();
                    return mapToShortsListDto(shorts, userNickNm, currentUserId);
                });
    }

    private String getUserProfileImagePath(User user) {
        if (user != null && user.getAttachNo() != null) {
            CmAttachment attachment = cmAttachmentRepository.findById(user.getAttachNo()).orElse(null);
            if (attachment != null) {
                return attachment.getFilePath();
            }
        }
        return null;
    }

    private PostListDto mapToPostListDto(Post post, String userNickNm, String currentUserId) {
        User user = userRepository.findById(post.getUserId()).orElse(null);
        String userProfileImagePath = getUserProfileImagePath(user);

        List<PostAttachment> attaches = postAttachmentRepository.findByPostId(post.getPostId());
        List<String> imagePaths = attaches.stream()
                .map(attach -> cmAttachmentRepository.findById(attach.getAttachNo()).orElse(null))
                .filter(cm -> cm != null)
                .map(CmAttachment::getFilePath)
                .collect(Collectors.toList());

        List<String> editDataList = attaches.stream()
                .map(PostAttachment::getEditData)
                .collect(Collectors.toList());

        String thumbnailPath = imagePaths.isEmpty() ? null : imagePaths.get(0);

        long viewCount = postViewRepository.countByPostId(post.getPostId());
        long likeCount = postLikeRepository.countByPostIdAndActionTypeFg(post.getPostId(), "L");
        long dislikeCount = postLikeRepository.countByPostIdAndActionTypeFg(post.getPostId(), "D");
        long commentCount = postDetailRepository.countByPostIdAndReplyStatCd(post.getPostId(), "A");

        String userAction = null;
        if (currentUserId != null && !currentUserId.isEmpty()) {
            Optional<PostLike> likeOpt = postLikeRepository.findByPostIdAndUserId(post.getPostId(), currentUserId);
            if (likeOpt.isPresent()) {
                userAction = likeOpt.get().getActionTypeFg();
            }
        }

        return PostListDto.builder()
                .postId(post.getPostId())
                .userId(post.getUserId())
                .userNickNm(userNickNm)
                .userProfileImagePath(userProfileImagePath)
                .contentPreview(post.getContent() != null && post.getContent().length() > 50 
                                ? post.getContent().substring(0, 50) + "..." 
                                : post.getContent())
                .thumbnailPath(thumbnailPath)
                .imagePaths(imagePaths)
                .editDataList(editDataList)
                .publicTypeCd(post.getPublicTypeCd())
                .insDtime(post.getInsDtime())
                .viewCount(viewCount)
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .commentCount(commentCount)
                .userAction(userAction)
                .build();
    }

    private ShortsListDto mapToShortsListDto(Shorts shorts, String userNickNm, String currentUserId) {
        User user = userRepository.findById(shorts.getUserId()).orElse(null);
        String userProfileImagePath = getUserProfileImagePath(user);

        String videoPath = null;
        if (shorts.getVideoAttachNo() != null) {
            CmAttachment cmAttach = cmAttachmentRepository.findById(shorts.getVideoAttachNo()).orElse(null);
            if (cmAttach != null) {
                videoPath = cmAttach.getFilePath();
            }
        }

        long viewCount = shortsViewRepository.countByShortsNo(shorts.getShortsNo());
        long likeCount = shortsLikeRepository.countByShortsNoAndActionTypeFg(shorts.getShortsNo(), "L");
        long dislikeCount = shortsLikeRepository.countByShortsNoAndActionTypeFg(shorts.getShortsNo(), "D");
        long commentCount = shortsDetailRepository.countByShortsNoAndReplyStatCd(shorts.getShortsNo(), "A");

        String userAction = null;
        if (currentUserId != null && !currentUserId.isEmpty()) {
            Optional<ShortsLike> likeOpt = shortsLikeRepository.findByShortsNoAndUserId(shorts.getShortsNo(), currentUserId);
            if (likeOpt.isPresent()) {
                userAction = likeOpt.get().getActionTypeFg();
            }
        }

        return ShortsListDto.builder()
                .shortsNo(shorts.getShortsNo())
                .userId(shorts.getUserId())
                .userNickNm(userNickNm)
                .userProfileImagePath(userProfileImagePath)
                .title(shorts.getTitle())
                .videoPath(videoPath)
                .publicTypeCd(shorts.getPublicTypeCd())
                .overlayData(shorts.getOverlayData())
                .insDtime(shorts.getInsDtime())
                .viewCount(viewCount)
                .likeCount(likeCount)
                .dislikeCount(dislikeCount)
                .commentCount(commentCount)
                .userAction(userAction)
                .build();
    }

    @Transactional
    public void createShorts(ShortsCreateDto dto, MultipartFile videoFile, MultipartFile thumbnailFile) {
        if (videoFile == null || videoFile.isEmpty()) {
            throw new IllegalArgumentException("쇼츠 동영상 파일은 필수입니다.");
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        try {
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

            CmAttachment videoAttach = new CmAttachment();
            videoAttach.setFileName(videoOrigName);
            videoAttach.setFilePath("/api/shorts/" + videoSavedName);
            videoAttach.setFileSize(videoFile.getSize());
            videoAttach.setMimeType(videoFile.getContentType());
            videoAttach.setInsDtime(currentDateTime);
            videoAttach.setInsId(dto.getUserId());
            videoAttach.setUpdDtime(currentDateTime);
            videoAttach.setUpdId(dto.getUserId());

            CmAttachment savedVideoAttach = cmAttachmentRepository.save(videoAttach);

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

            Shorts shorts = new Shorts();
            shorts.setUserId(dto.getUserId());
            shorts.setTitle(dto.getTitle());
            shorts.setDuration(dto.getDuration() != null ? dto.getDuration() : 0);
            shorts.setVideoAttachNo(savedVideoAttach.getAttachNo());
            if (savedThumbAttach != null) {
                shorts.setThumbnailAttachNo(savedThumbAttach.getAttachNo());
            }
            shorts.setPublicTypeCd(dto.getPublicTypeCd());
            shorts.setOverlayData(dto.getOverlayData());
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

    // ==========================================
    // 1. 조회수 (View) 기능 구현
    // ==========================================
    @Transactional
    public long recordPostView(Long postId, String userId) {
        if (userId != null && !userId.trim().isEmpty()) {
            if (!postViewRepository.existsByPostIdAndUserId(postId, userId)) {
                String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                PostView view = new PostView();
                view.setPostId(postId);
                view.setUserId(userId);
                view.setInsDtime(now);
                view.setInsId(userId);
                view.setUpdDtime(now);
                view.setUpdId(userId);
                postViewRepository.save(view);
            }
        }
        return postViewRepository.countByPostId(postId);
    }

    @Transactional
    public long recordShortsView(Long shortsNo, String userId) {
        if (userId != null && !userId.trim().isEmpty()) {
            if (!shortsViewRepository.existsByShortsNoAndUserId(shortsNo, userId)) {
                String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                ShortsView view = new ShortsView();
                view.setShortsNo(shortsNo);
                view.setUserId(userId);
                view.setInsDtime(now);
                view.setInsId(userId);
                view.setUpdDtime(now);
                view.setUpdId(userId);
                shortsViewRepository.save(view);
            }
        }
        return shortsViewRepository.countByShortsNo(shortsNo);
    }

    // ==========================================
    // 2. 좋아요 / 별루예요 (Action / Like & Dislike) 기능 구현
    // ==========================================
    @Transactional
    public Map<String, Object> togglePostLike(Long postId, String userId, String actionTypeFg) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        if (!"L".equals(actionTypeFg) && !"D".equals(actionTypeFg)) {
            throw new IllegalArgumentException("올바르지 않은 액션 구분입니다.");
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        Optional<PostLike> existingOpt = postLikeRepository.findByPostIdAndUserId(postId, userId);

        String finalUserAction = actionTypeFg;
        if (existingOpt.isPresent()) {
            PostLike existing = existingOpt.get();
            if (existing.getActionTypeFg().equals(actionTypeFg)) {
                // 동일 액션 클릭 시 토글 삭제 (취소)
                postLikeRepository.delete(existing);
                finalUserAction = null;
            } else {
                // 다른 액션으로 변경 (L -> D 또는 D -> L)
                existing.setActionTypeFg(actionTypeFg);
                existing.setUpdDtime(now);
                existing.setUpdId(userId);
                postLikeRepository.save(existing);
            }
        } else {
            PostLike postLike = new PostLike();
            postLike.setPostId(postId);
            postLike.setUserId(userId);
            postLike.setActionTypeFg(actionTypeFg);
            postLike.setInsDtime(now);
            postLike.setInsId(userId);
            postLike.setUpdDtime(now);
            postLike.setUpdId(userId);
            postLikeRepository.save(postLike);
        }

        long likeCount = postLikeRepository.countByPostIdAndActionTypeFg(postId, "L");
        long dislikeCount = postLikeRepository.countByPostIdAndActionTypeFg(postId, "D");

        Map<String, Object> result = new HashMap<>();
        result.put("likeCount", likeCount);
        result.put("dislikeCount", dislikeCount);
        result.put("userAction", finalUserAction);
        return result;
    }

    @Transactional
    public Map<String, Object> toggleShortsLike(Long shortsNo, String userId, String actionTypeFg) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        if (!"L".equals(actionTypeFg) && !"D".equals(actionTypeFg)) {
            throw new IllegalArgumentException("올바르지 않은 액션 구분입니다.");
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        Optional<ShortsLike> existingOpt = shortsLikeRepository.findByShortsNoAndUserId(shortsNo, userId);

        String finalUserAction = actionTypeFg;
        if (existingOpt.isPresent()) {
            ShortsLike existing = existingOpt.get();
            if (existing.getActionTypeFg().equals(actionTypeFg)) {
                // 동일 액션 클릭 시 토글 삭제 (취소)
                shortsLikeRepository.delete(existing);
                finalUserAction = null;
            } else {
                // 다른 액션으로 변경
                existing.setActionTypeFg(actionTypeFg);
                existing.setUpdDtime(now);
                existing.setUpdId(userId);
                shortsLikeRepository.save(existing);
            }
        } else {
            ShortsLike shortsLike = new ShortsLike();
            shortsLike.setShortsNo(shortsNo);
            shortsLike.setUserId(userId);
            shortsLike.setActionTypeFg(actionTypeFg);
            shortsLike.setInsDtime(now);
            shortsLike.setInsId(userId);
            shortsLike.setUpdDtime(now);
            shortsLike.setUpdId(userId);
            shortsLikeRepository.save(shortsLike);
        }

        long likeCount = shortsLikeRepository.countByShortsNoAndActionTypeFg(shortsNo, "L");
        long dislikeCount = shortsLikeRepository.countByShortsNoAndActionTypeFg(shortsNo, "D");

        Map<String, Object> result = new HashMap<>();
        result.put("likeCount", likeCount);
        result.put("dislikeCount", dislikeCount);
        result.put("userAction", finalUserAction);
        return result;
    }

    // ==========================================
    // 3. 댓글 (Detail) 기능 구현
    // ==========================================
    @Transactional(readOnly = true)
    public List<SnsCommentDto> getPostComments(Long postId) {
        List<PostDetail> details = postDetailRepository.findByPostIdAndReplyStatCdOrderByPostsReplyNoAsc(postId, "A");
        return details.stream().map(detail -> {
            User user = userRepository.findById(detail.getReplyUserId()).orElse(null);
            String userNickNm = user != null ? user.getUserNickNm() : detail.getReplyUserId();
            String userProfileImagePath = getUserProfileImagePath(user);
            return SnsCommentDto.builder()
                    .replyNo(detail.getPostsReplyNo())
                    .targetId(detail.getPostId())
                    .replyUserId(detail.getReplyUserId())
                    .replyUserNickNm(userNickNm)
                    .replyUserProfileImagePath(userProfileImagePath)
                    .content(detail.getContent())
                    .insDtime(detail.getInsDtime())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public SnsCommentDto createPostComment(Long postId, SnsCommentCreateDto dto) {
        if (dto.getUserId() == null || dto.getUserId().trim().isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        if (dto.getContent() == null || dto.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("댓글 내용을 입력해주세요.");
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        PostDetail detail = new PostDetail();
        detail.setPostId(postId);
        detail.setReplyUserId(dto.getUserId());
        detail.setContent(dto.getContent());
        detail.setReplyStatCd("A");
        detail.setInsDtime(now);
        detail.setInsId(dto.getUserId());
        detail.setUpdDtime(now);
        detail.setUpdId(dto.getUserId());

        PostDetail saved = postDetailRepository.save(detail);

        User user = userRepository.findById(saved.getReplyUserId()).orElse(null);
        String userNickNm = user != null ? user.getUserNickNm() : saved.getReplyUserId();
        String userProfileImagePath = getUserProfileImagePath(user);

        return SnsCommentDto.builder()
                .replyNo(saved.getPostsReplyNo())
                .targetId(saved.getPostId())
                .replyUserId(saved.getReplyUserId())
                .replyUserNickNm(userNickNm)
                .replyUserProfileImagePath(userProfileImagePath)
                .content(saved.getContent())
                .insDtime(saved.getInsDtime())
                .build();
    }

    @Transactional
    public void deletePostComment(Long postsReplyNo, String userId) {
        PostDetail detail = postDetailRepository.findById(postsReplyNo)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        if (!detail.getReplyUserId().equals(userId)) {
            throw new RuntimeException("댓글 삭제 권한이 없습니다.");
        }
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        detail.setReplyStatCd("D");
        detail.setUpdDtime(now);
        detail.setUpdId(userId);
        postDetailRepository.save(detail);
    }

    @Transactional(readOnly = true)
    public List<SnsCommentDto> getShortsComments(Long shortsNo) {
        List<ShortsDetail> details = shortsDetailRepository.findByShortsNoAndReplyStatCdOrderByShortsReplyNoAsc(shortsNo, "A");
        return details.stream().map(detail -> {
            User user = userRepository.findById(detail.getReplyUserId()).orElse(null);
            String userNickNm = user != null ? user.getUserNickNm() : detail.getReplyUserId();
            String userProfileImagePath = getUserProfileImagePath(user);
            return SnsCommentDto.builder()
                    .replyNo(detail.getShortsReplyNo())
                    .targetId(detail.getShortsNo())
                    .replyUserId(detail.getReplyUserId())
                    .replyUserNickNm(userNickNm)
                    .replyUserProfileImagePath(userProfileImagePath)
                    .content(detail.getContent())
                    .insDtime(detail.getInsDtime())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public SnsCommentDto createShortsComment(Long shortsNo, SnsCommentCreateDto dto) {
        if (dto.getUserId() == null || dto.getUserId().trim().isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        if (dto.getContent() == null || dto.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("댓글 내용을 입력해주세요.");
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        ShortsDetail detail = new ShortsDetail();
        detail.setShortsNo(shortsNo);
        detail.setReplyUserId(dto.getUserId());
        detail.setContent(dto.getContent());
        detail.setReplyStatCd("A");
        detail.setInsDtime(now);
        detail.setInsId(dto.getUserId());
        detail.setUpdDtime(now);
        detail.setUpdId(dto.getUserId());

        ShortsDetail saved = shortsDetailRepository.save(detail);

        User user = userRepository.findById(saved.getReplyUserId()).orElse(null);
        String userNickNm = user != null ? user.getUserNickNm() : saved.getReplyUserId();
        String userProfileImagePath = getUserProfileImagePath(user);

        return SnsCommentDto.builder()
                .replyNo(saved.getShortsReplyNo())
                .targetId(saved.getShortsNo())
                .replyUserId(saved.getReplyUserId())
                .replyUserNickNm(userNickNm)
                .replyUserProfileImagePath(userProfileImagePath)
                .content(saved.getContent())
                .insDtime(saved.getInsDtime())
                .build();
    }

    @Transactional
    public void deleteShortsComment(Long shortsReplyNo, String userId) {
        ShortsDetail detail = shortsDetailRepository.findById(shortsReplyNo)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        if (!detail.getReplyUserId().equals(userId)) {
            throw new RuntimeException("댓글 삭제 권한이 없습니다.");
        }
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        detail.setReplyStatCd("D");
        detail.setUpdDtime(now);
        detail.setUpdId(userId);
        shortsDetailRepository.save(detail);
    }
}
