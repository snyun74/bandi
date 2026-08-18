package com.bandi.backend.service;

import com.bandi.backend.dto.CommunityBoardListDto;
import com.bandi.backend.dto.CommunityBoardDetailDto;
import com.bandi.backend.dto.CommunityBoardCommentDto;
import com.bandi.backend.dto.CommunityBoardCreateDto;
import com.bandi.backend.entity.common.*;
import com.bandi.backend.repository.*;
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
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.io.File;
import java.io.IOException;
import java.util.UUID;

import com.bandi.backend.enums.FileCategory;
import com.bandi.backend.dto.UploadFileResultDto;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardDetailRepository boardDetailRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final BoardDetailLikeRepository boardDetailLikeRepository;
    private final BoardAttachmentRepository boardAttachmentRepository;
    private final CmAttachmentRepository cmAttachmentRepository;
    private final CmScrapRepository cmScrapRepository;
    private final CmReportRepository cmReportRepository;
    private final CmBlockRepository cmBlockRepository;
    private final com.bandi.backend.repository.UserRepository userRepository;
    private final FileStorageService fileStorageService;

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

    @Transactional(readOnly = true)
    public Page<CommunityBoardListDto> getRecentBoardList(int page, int size, String userId) {
        Pageable pageable = PageRequest.of(page, size);
        return boardRepository.findRecentBoardList(userId, pageable);
    }

    @Transactional(readOnly = true)
    public List<com.bandi.backend.dto.BandiTalkPostDto> getBandiTalkPosts() {
        List<Board> freePosts = boardRepository.findTopByBoardType("0", PageRequest.of(0, 1));
        List<Board> begPosts = boardRepository.findTopByBoardType("1", PageRequest.of(0, 1));

        java.util.Set<Long> addedIds = new java.util.HashSet<>();
        List<Board> selectedBoards = new ArrayList<>();

        if (freePosts != null && !freePosts.isEmpty()) {
            selectedBoards.add(freePosts.get(0));
            addedIds.add(freePosts.get(0).getBoardNo());
        }
        if (begPosts != null && !begPosts.isEmpty()) {
            if (!addedIds.contains(begPosts.get(0).getBoardNo())) {
                selectedBoards.add(begPosts.get(0));
                addedIds.add(begPosts.get(0).getBoardNo());
            }
        }

        // 2건 미만일 경우 최신 활성 글 중에서 채움
        if (selectedBoards.size() < 2) {
            List<Board> recent = boardRepository.findTopRecent(PageRequest.of(0, 5));
            if (recent != null) {
                for (Board b : recent) {
                    if (!addedIds.contains(b.getBoardNo())) {
                        selectedBoards.add(b);
                        addedIds.add(b.getBoardNo());
                        if (selectedBoards.size() >= 2) break;
                    }
                }
            }
        }

        List<com.bandi.backend.dto.BandiTalkPostDto> result = new ArrayList<>();
        for (Board b : selectedBoards) {
            long likeCnt = boardLikeRepository.countByBoardNo(b.getBoardNo());
            long commentCnt = boardDetailRepository.countByBoardNo(b.getBoardNo());

            String userNickNm = "익명";
            String profileImg = null;
            if (!"Y".equals(b.getMaskingYn()) && b.getWriterUserId() != null) {
                com.bandi.backend.entity.member.User user = userRepository.findById(b.getWriterUserId()).orElse(null);
                if (user != null) {
                    userNickNm = user.getUserNickNm() != null ? user.getUserNickNm() : "사용자";
                    if (user.getAttachNo() != null) {
                        com.bandi.backend.entity.common.CmAttachment att = cmAttachmentRepository.findById(user.getAttachNo()).orElse(null);
                        if (att != null) {
                            profileImg = att.getFilePath();
                        }
                    }
                }
            }

            result.add(com.bandi.backend.dto.BandiTalkPostDto.builder()
                    .boardNo(b.getBoardNo())
                    .boardTypeFg(b.getBoardTypeFg())
                    .title(b.getTitle())
                    .content(b.getContent())
                    .regDate(b.getInsDtime())
                    .writerUserId(b.getWriterUserId())
                    .userNickNm(userNickNm)
                    .profileImg(profileImg)
                    .maskingYn(b.getMaskingYn())
                    .likeCnt(likeCnt)
                    .commentCnt(commentCnt)
                    .build());
        }

        return result;
    }

    @Transactional
    public void createBoardPost(CommunityBoardCreateDto dto, MultipartFile file) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        Long attachNo = null;

        // 1. Save File & CmAttachment if file exists
        if (file != null && !file.isEmpty()) {
            UploadFileResultDto fileResult = fileStorageService.storeFile(file, FileCategory.BOARD, dto.getUserId());
            attachNo = fileResult.getAttachNo();
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
        board.setMaskingYn(dto.getMaskingYn() != null ? dto.getMaskingYn() : "N");
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

        long scrapCnt = cmScrapRepository.countByScrapTableNmAndScrapTablePkNo("CM_BOARD", boardNo);
        boolean isScrapped = !userId.isEmpty()
                && cmScrapRepository.existsByUserIdAndScrapTableNmAndScrapTablePkNo(userId, "CM_BOARD", boardNo);

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
        if ("Y".equals(board.getMaskingYn())) {
            userNickNm = "익명";
        } else {
            com.bandi.backend.entity.member.User user = userRepository.findById(board.getWriterUserId()).orElse(null);
            if (user != null && user.getUserNickNm() != null) {
                userNickNm = user.getUserNickNm();
            }
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
                .scrapCnt(scrapCnt)
                .isScrapped(isScrapped)
                .youtubeUrl(board.getYoutubeUrl())
                .attachFilePath(attachFilePath)
                .maskingYn(board.getMaskingYn())
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
            if ("Y".equals(c.getMaskingYn())) {
                nickNm = "익명";
            }

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
                    .maskingYn(c.getMaskingYn())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void createComment(Long boardNo, String userId, String content, Long parentReplyNo, String maskingYn) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        BoardDetail comment = new BoardDetail();
        comment.setBoardNo(boardNo);
        comment.setReplyUserId(userId);
        comment.setContent(content);
        comment.setReplyStatCd("A");
        comment.setMaskingYn(maskingYn != null ? maskingYn : "N");
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

    @Transactional
    public void toggleScrap(Long boardNo, String userId) {
        if (cmScrapRepository.existsByUserIdAndScrapTableNmAndScrapTablePkNo(userId, "CM_BOARD", boardNo)) {
            cmScrapRepository.deleteByUserIdAndScrapTableNmAndScrapTablePkNo(userId, "CM_BOARD", boardNo);
        } else {
            String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            com.bandi.backend.entity.member.CmScrap scrap = new com.bandi.backend.entity.member.CmScrap();
            scrap.setUserId(userId);
            scrap.setScrapTableNm("CM_BOARD");
            scrap.setScrapTablePkNo(boardNo);
            scrap.setScrapDate(currentDateTime.substring(0, 8));
            scrap.setInsDtime(currentDateTime);
            scrap.setInsId(userId);
            scrap.setUpdDtime(currentDateTime);
            scrap.setUpdId(userId);
            cmScrapRepository.save(scrap);
        }
    }

    @Transactional
    public void deleteBoard(Long boardNo, String userId) {
        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        if (!board.getWriterUserId().equals(userId)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        board.setBoardStatCd("D");
        board.setUpdDtime(currentDateTime);
        board.setUpdId(userId);
        boardRepository.save(board);
    }

    @Transactional
    public void updateBoardPost(Long boardNo, CommunityBoardCreateDto dto, MultipartFile file) {
        Board board = boardRepository.findById(boardNo)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        if (!board.getWriterUserId().equals(dto.getUserId())) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        board.setTitle(dto.getTitle());
        board.setContent(dto.getContent());
        board.setYoutubeUrl(dto.getYoutubeUrl());
        board.setUpdDtime(currentDateTime);
        board.setUpdId(dto.getUserId());

        // Handle file update
        if (file != null && !file.isEmpty()) {
            UploadFileResultDto uploadResult = fileStorageService.storeFile(file, FileCategory.BOARD, dto.getUserId());

            // Delete old attachments and create new BoardAttachment
            List<BoardAttachment> oldLinks = boardAttachmentRepository.findByBoardNo(boardNo);
            if (!oldLinks.isEmpty()) {
                boardAttachmentRepository.deleteAll(oldLinks);
            }

            BoardAttachment newLink = new BoardAttachment();
            newLink.setBoardNo(boardNo);
            newLink.setAttachNo(uploadResult.getAttachNo());
            newLink.setAttachStatCd("A");
            newLink.setInsDtime(currentDateTime);
            newLink.setInsId(dto.getUserId());
            newLink.setUpdDtime(currentDateTime);
            newLink.setUpdId(dto.getUserId());
            boardAttachmentRepository.save(newLink);
        } else if (Boolean.TRUE.equals(dto.getDeleteFile())) {
            List<BoardAttachment> oldLinks = boardAttachmentRepository.findByBoardNo(boardNo);
            if (!oldLinks.isEmpty()) {
                boardAttachmentRepository.deleteAll(oldLinks);
            }
        }

        boardRepository.save(board);
    }

    @Transactional
    public void reportPost(com.bandi.backend.dto.CmReportDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        CmReport report = new CmReport();
        report.setReportUserId(dto.getReportUserId());
        report.setTargetUserId(dto.getTargetUserId());
        report.setBoardUrl(dto.getBoardUrl());
        report.setContent(dto.getContent());
        report.setReportDtime(currentDateTime);
        report.setProcStatFg("N");
        report.setInsDtime(currentDateTime);
        report.setInsId(dto.getReportUserId());
        report.setUpdDtime(currentDateTime);
        report.setUpdId(dto.getReportUserId());
        cmReportRepository.save(report);
    }

    @Transactional
    public void blockUser(com.bandi.backend.dto.CmBlockDto dto) {
        if (cmBlockRepository.existsByUserIdAndBlockUserId(dto.getUserId(), dto.getBlockUserId())) {
            return;
        }
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        CmBlock block = new CmBlock();
        block.setUserId(dto.getUserId());
        block.setBlockUserId(dto.getBlockUserId());
        block.setBlockDtime(currentDateTime);
        block.setInsDtime(currentDateTime);
        block.setInsId(dto.getUserId());
        block.setUpdDtime(currentDateTime);
        block.setUpdId(dto.getUserId());
        cmBlockRepository.save(block);
    }
}
