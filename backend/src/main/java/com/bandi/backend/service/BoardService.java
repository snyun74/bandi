package com.bandi.backend.service;

import com.bandi.backend.dto.CommunityBoardListDto;
import com.bandi.backend.dto.CommunityBoardDetailDto;
import com.bandi.backend.dto.CommunityBoardCommentDto;
import com.bandi.backend.dto.CommunityBoardCreateDto;
import com.bandi.backend.entity.common.Board;
import com.bandi.backend.entity.common.BoardDetail;
import com.bandi.backend.entity.common.BoardLike;
import com.bandi.backend.entity.common.BoardDetailLike;
import com.bandi.backend.entity.common.BoardAttachment;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.repository.BoardRepository;
import com.bandi.backend.repository.BoardDetailRepository;
import com.bandi.backend.repository.BoardLikeRepository;
import com.bandi.backend.repository.BoardDetailLikeRepository;
import com.bandi.backend.repository.BoardAttachmentRepository;
import com.bandi.backend.repository.CmAttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardDetailRepository boardDetailRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final BoardDetailLikeRepository boardDetailLikeRepository;
    private final BoardAttachmentRepository boardAttachmentRepository;
    private final CmAttachmentRepository cmAttachmentRepository;
    private final com.bandi.backend.repository.UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<CommunityBoardListDto> getBoardList(String boardTypeFg, int page, int size, String userId) {
        Pageable pageable = PageRequest.of(page, size);
        return boardRepository.findBoardList(boardTypeFg, userId, pageable);
    }

    @Transactional(readOnly = true)
    public List<CommunityBoardListDto> getHotBoardList(String userId) {
        Pageable pageable = PageRequest.of(0, 5); // Limit to 5
        return boardRepository.findHotBoardList(userId, pageable);
    }

    @Transactional
    public void createBoardPost(CommunityBoardCreateDto dto, MultipartFile file) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        Long attachNo = null;

        // 1. Save File & CmAttachment if file exists
        if (file != null && !file.isEmpty()) {
            try {
                // Use the same upload directory as ClanService
                String uploadDir = "d:/Project/bandi/frontend-web/public/common_images";
                File dir = new File(uploadDir);
                if (!dir.exists()) {
                    dir.mkdirs();
                }

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
                attachNo = savedAttachment.getAttachNo();

            } catch (IOException e) {
                throw new RuntimeException("Failed to store file", e);
            }
        }

        Board board = new Board();
        board.setBoardTypeFg(dto.getBoardTypeFg());
        board.setWriterUserId(dto.getUserId());
        board.setTitle(dto.getTitle());
        board.setContent(dto.getContent());
        // Note: Youtube URL is not in Board entity based on current knowledge. Skipped.

        board.setYoutubeUrl(dto.getYoutubeUrl());
        board.setBoardStatCd("A");
        board.setPinYn("N");
        board.setInsDtime(currentDateTime);
        board.setInsId(dto.getUserId());
        board.setUpdDtime(currentDateTime);
        board.setUpdId(dto.getUserId());

        Board savedBoard = boardRepository.save(board);

        // 3. Save BoardAttachment
        if (attachNo != null) {
            BoardAttachment boardAttachment = new BoardAttachment();
            boardAttachment.setBoardNo(savedBoard.getBoardNo());
            boardAttachment.setAttachNo(attachNo);
            boardAttachment.setAttachStatCd("A");
            boardAttachment.setInsDtime(currentDateTime);
            boardAttachment.setInsId(dto.getUserId());
            boardAttachment.setUpdDtime(currentDateTime);
            boardAttachment.setUpdId(dto.getUserId());

            boardAttachmentRepository.save(boardAttachment);
        }
    }

    @Transactional(readOnly = true)
    public CommunityBoardDetailDto getBoardPostDetail(Long boardNo, String userId) {
        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new RuntimeException("Board not found"));

        long likeCnt = boardLikeRepository.countByBoardNo(boardNo);
        boolean isLiked = !userId.isEmpty() && boardLikeRepository.existsByBoardNoAndUserId(boardNo, userId);

        // Fetch attachment if exists
        String attachFilePath = null;
        // Assuming one attachment per board for now as per logic
        List<BoardAttachment> attachments = boardAttachmentRepository.findByBoardNo(boardNo);
        if (!attachments.isEmpty()) {
            Long attachNo = attachments.get(0).getAttachNo();
            CmAttachment cmAttachment = cmAttachmentRepository.findById(attachNo).orElse(null);
            if (cmAttachment != null) {
                attachFilePath = cmAttachment.getFilePath();
            }
        }

        // Fetch user nickname
        String userNickNm = board.getWriterUserId();
        com.bandi.backend.entity.member.User user = userRepository.findById(board.getWriterUserId()).orElse(null);
        if (user != null && user.getUserNickNm() != null) {
            userNickNm = user.getUserNickNm();
        }

        return CommunityBoardDetailDto.builder()
                .boardNo(board.getBoardNo())
                .boardTypeFg(board.getBoardTypeFg())
                .title(board.getTitle())
                .content(board.getContent())
                .writerUserId(board.getWriterUserId())
                .userNickNm(userNickNm)
                .regDate(board.getInsDtime())
                .likeCnt(likeCnt)
                .isLiked(isLiked)
                .youtubeUrl(board.getYoutubeUrl())
                .attachFilePath(attachFilePath)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CommunityBoardCommentDto> getBoardComments(Long boardNo, String userId) {
        List<BoardDetail> comments = boardDetailRepository.findByBoardNoOrderByInsDtimeAsc(boardNo);

        // Batch fetch user nicknames
        List<String> userIds = comments.stream()
                .map(BoardDetail::getReplyUserId)
                .distinct()
                .collect(Collectors.toList());

        java.util.Map<String, String> userNickNmMap = new java.util.HashMap<>();
        if (!userIds.isEmpty()) {
            List<com.bandi.backend.entity.member.User> users = userRepository.findByUserIdIn(userIds);
            for (com.bandi.backend.entity.member.User u : users) {
                userNickNmMap.put(u.getUserId(), u.getUserNickNm());
            }
        }

        return comments.stream().map(c -> {
            long likeCnt = boardDetailLikeRepository.countByReplyNo(c.getReplyNo());
            boolean isLiked = !userId.isEmpty()
                    && boardDetailLikeRepository.existsByReplyNoAndUserId(c.getReplyNo(), userId);

            String nickNm = userNickNmMap.getOrDefault(c.getReplyUserId(), c.getReplyUserId());

            return CommunityBoardCommentDto.builder()
                    .replyNo(c.getReplyNo())
                    .boardNo(c.getBoardNo())
                    .content(c.getContent())
                    .replyUserId(c.getReplyUserId())
                    .userNickNm(nickNm)
                    .regDate(c.getInsDtime())
                    .likeCnt(likeCnt)
                    .isLiked(isLiked)
                    .parentReplyNo(c.getParentReplyNo())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void createComment(Long boardNo, String userId, String content, Long parentReplyNo) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        BoardDetail comment = new BoardDetail();
        comment.setBoardNo(boardNo);
        comment.setReplyUserId(userId);
        comment.setContent(content);
        comment.setReplyStatCd("A");
        comment.setInsDtime(currentDateTime);
        comment.setInsId(userId);
        comment.setUpdDtime(currentDateTime);
        comment.setUpdId(userId);

        if (parentReplyNo != null) {
            boardDetailRepository.findById(parentReplyNo)
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParentReplyNo(parentReplyNo);
        }

        boardDetailRepository.save(comment);
    }

    @Transactional
    public void addBoardLike(Long boardNo, String userId) {
        if (boardLikeRepository.existsByBoardNoAndUserId(boardNo, userId)) {
            boardLikeRepository.deleteByBoardNoAndUserId(boardNo, userId);
            return;
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        BoardLike like = new BoardLike();
        like.setBoardNo(boardNo);
        like.setUserId(userId);
        like.setInsDtime(currentDateTime);
        like.setInsId(userId);
        like.setUpdDtime(currentDateTime);
        like.setUpdId(userId);

        boardLikeRepository.save(like);
    }

    @Transactional
    public void addCommentLike(Long replyNo, String userId) {
        if (boardDetailLikeRepository.existsByReplyNoAndUserId(replyNo, userId)) {
            boardDetailLikeRepository.deleteByReplyNoAndUserId(replyNo, userId);
            return;
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        BoardDetail comment = boardDetailRepository.findById(replyNo)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        BoardDetailLike like = new BoardDetailLike();
        like.setReplyNo(replyNo);
        like.setBoardNo(comment.getBoardNo());
        like.setUserId(userId);
        like.setInsDtime(currentDateTime);
        like.setInsId(userId);
        like.setUpdDtime(currentDateTime);
        like.setUpdId(userId);

        boardDetailLikeRepository.save(like);
    }
}
