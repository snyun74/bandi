package com.bandi.backend.service;

import com.bandi.backend.dto.*;
import com.bandi.backend.entity.band.*;
import com.bandi.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class BnVoteService {

    private final BnVoteRepository bnVoteRepository;
    private final BnVoteQuestionRepository bnVoteQuestionRepository;
    private final BnVoteItemRepository bnVoteItemRepository;
    private final BnVoteJoinRepository bnVoteJoinRepository;
    private final BnVoteResultRepository bnVoteResultRepository;
    private final JamChatService jamChatService;
    private final UserRepository userRepository;

    @Transactional
    public Long createVote(Long roomId, String userId, String title, Boolean allowMultiple, String endTime,
            List<String> options) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String formattedEndTime = endTime.replace("T", "").replace("-", "").replace(":", "") + "00";
        if (formattedEndTime.length() > 14)
            formattedEndTime = formattedEndTime.substring(0, 14);

        // 1. Save BN_VOTE
        BnVote vote = new BnVote();
        vote.setBnNo(roomId);
        vote.setVoteTitle(title);
        vote.setVoteDesc(title);
        vote.setVoteStatCd("A");
        vote.setVoteStdDtime(currentDateTime);
        vote.setVoteEndDtime(formattedEndTime);
        vote.setInsDtime(currentDateTime);
        vote.setInsId(userId);
        vote.setUpdDtime(currentDateTime);
        vote.setUpdId(userId);

        BnVote savedVote = bnVoteRepository.save(vote);

        // 2. Save BN_VOTE_QUESTION
        BnVoteQuestion question = new BnVoteQuestion();
        question.setBnVoteNo(savedVote.getBnVoteNo());
        question.setBnVoteQuestionOrder(1);
        question.setBnVoteQuestionType(allowMultiple ? "MULT" : "SING");
        question.setBnVoteQuestionText(title);
        question.setInsDtime(currentDateTime);
        question.setInsId(userId);
        question.setUpdDtime(currentDateTime);
        question.setUpdId(userId);

        BnVoteQuestion savedQuestion = bnVoteQuestionRepository.save(question);

        // 3. Save BN_VOTE_ITEMs
        int order = 1;
        for (String optContent : options) {
            if (optContent == null || optContent.trim().isEmpty())
                continue;
            BnVoteItem item = new BnVoteItem();
            item.setBnVoteQuestionNo(savedQuestion.getBnVoteQuestionNo());
            item.setBnVoteItemOrder(order++);
            item.setBnVoteItemText(optContent);
            item.setInsDtime(currentDateTime);
            item.setInsId(userId);
            item.setUpdDtime(currentDateTime);
            item.setUpdId(userId);

            bnVoteItemRepository.save(item);
        }

        // Send Chat Message
        // We reuse attachNo for voteNo when msgTypeCd is VOTE
        ChatMessageCreateDto chatMessage = new ChatMessageCreateDto();
        chatMessage.setCnNo(roomId); // DTO uses cnNo for roomNo
        chatMessage.setSndUserId(userId);
        chatMessage.setMsg("투표가 생성되었습니다: " + title);
        chatMessage.setMsgTypeCd("VOTE");
        chatMessage.setAttachNo(savedVote.getBnVoteNo()); // HACK: reusing attachNo

        try {
            jamChatService.saveMessage(chatMessage);
        } catch (Exception e) {
            log.error("Failed to send vote creation message", e);
        }

        return savedVote.getBnVoteNo();
    }

    @Transactional
    public void submitVote(Long voteId, String userId, List<Integer> itemIds) {
        if (bnVoteJoinRepository.existsByBnVoteNoAndBnVoteUserId(voteId, userId)) {
            throw new RuntimeException("이미 투표에 참여하셨습니다.");
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // Join
        BnVoteJoin join = new BnVoteJoin();
        join.setBnVoteNo(voteId);
        join.setBnVoteUserId(userId);
        join.setInsDtime(currentDateTime);
        join.setInsId(userId);
        join.setUpdDtime(currentDateTime);
        join.setUpdId(userId);
        bnVoteJoinRepository.save(join);

        // Result
        for (Integer itemIdInt : itemIds) {
            Long itemId = Long.valueOf(itemIdInt);
            BnVoteItem item = bnVoteItemRepository.findById(itemId)
                    .orElseThrow(() -> new RuntimeException("투표 항목을 찾을 수 없습니다: " + itemId));

            BnVoteResult result = new BnVoteResult();
            result.setBnVoteNo(voteId);
            result.setBnVoteQuestionNo(item.getBnVoteQuestionNo());
            result.setBnVoteItemNo(itemId);
            result.setBnVoteResultUserId(userId);
            bnVoteResultRepository.save(result);
        }
    }

    @Transactional
    public void cancelVote(Long voteId, String userId) {
        // Delete Join (Manual delete in repository or standard delete)
        // Since we have composite ID, we can construct entity or use custom query
        // Custom query was not created in repo, so let's use standard delete if
        // possible or custom query
        // Wait, I didn't add deleteBy... in Repository interface.
        // I should check Repository interface again or assume standard JPA methods.
        // I added `existsBy` and `countBy`. I need to add `deleteBy` if I want to use
        // it easily.
        // But I can find and delete.

        BnVoteJoinId joinId = new BnVoteJoinId(voteId, userId);
        if (bnVoteJoinRepository.existsById(joinId)) {
            bnVoteJoinRepository.deleteById(joinId);
        }

        // Delete Results - this one has composite ID too, but we want to delete ALL
        // results for user/vote
        // I need a delete method in Repository: `deleteByBnVoteNoAndBnVoteResultUserId`
        // I didn't add it. I should assume I need to add it or fetch and delete.
        // Fetch is safer without modifying Repo file again (tool call cost).
        List<BnVoteResult> userResults = bnVoteResultRepository.findAllByBnVoteNo(voteId).stream()
                .filter(r -> r.getBnVoteResultUserId().equals(userId))
                .toList();
        bnVoteResultRepository.deleteAll(userResults);
    }

    public BnVoteDetailDto getVoteDetail(Long voteId, String userId) {
        BnVote vote = bnVoteRepository.findById(voteId)
                .orElseThrow(() -> new RuntimeException("투표 정보를 찾을 수 없습니다."));

        List<BnVoteQuestion> questions = bnVoteQuestionRepository
                .findAllByBnVoteNoOrderByBnVoteQuestionOrderAsc(voteId);

        List<BnVoteDetailDto.QuestionDto> questionDtos = questions.stream().map(q -> {
            List<BnVoteItem> items = bnVoteItemRepository
                    .findAllByBnVoteQuestionNoOrderByBnVoteItemOrderAsc(q.getBnVoteQuestionNo());
            List<BnVoteDetailDto.ItemDto> itemDtos = items.stream()
                    .map(i -> BnVoteDetailDto.ItemDto.builder()
                            .bnVoteItemNo(i.getBnVoteItemNo())
                            .itemText(i.getBnVoteItemText())
                            .itemOrder(i.getBnVoteItemOrder())
                            .build())
                    .toList();

            return BnVoteDetailDto.QuestionDto.builder()
                    .bnVoteQuestionNo(q.getBnVoteQuestionNo())
                    .questionText(q.getBnVoteQuestionText())
                    .questionType(q.getBnVoteQuestionType())
                    .items(itemDtos)
                    .build();
        }).toList();

        boolean isMultiple = !questionDtos.isEmpty() && "MULT".equals(questionDtos.get(0).getQuestionType());

        boolean hasVoted = false;
        List<Long> myVoteItemIds = new java.util.ArrayList<>();
        if (userId != null && !userId.isEmpty()) {
            hasVoted = bnVoteJoinRepository.existsByBnVoteNoAndBnVoteUserId(voteId, userId);
            if (hasVoted) {
                // Inefficient but works
                List<BnVoteResult> results = bnVoteResultRepository.findAllByBnVoteNo(voteId);
                myVoteItemIds = results.stream()
                        .filter(r -> r.getBnVoteResultUserId().equals(userId))
                        .map(BnVoteResult::getBnVoteItemNo)
                        .toList();
            }
        }

        return BnVoteDetailDto.builder()
                .bnVoteNo(vote.getBnVoteNo())
                .title(vote.getVoteTitle())
                .description(vote.getVoteDesc())
                .endTime(vote.getVoteEndDtime())
                .allowMultiple(isMultiple)
                .isAnonymous(false)
                .questions(questionDtos)
                .insId(vote.getInsId())
                .hasVoted(hasVoted)
                .myVoteItemIds(myVoteItemIds)
                .build();
    }

    public BnVoteStatusDto getVoteStatus(Long voteId) {
        BnVote vote = bnVoteRepository.findById(voteId)
                .orElseThrow(() -> new RuntimeException("투표 정보를 찾을 수 없습니다."));

        List<BnVoteQuestion> questions = bnVoteQuestionRepository
                .findAllByBnVoteNoOrderByBnVoteQuestionOrderAsc(voteId);
        if (questions.isEmpty())
            throw new RuntimeException("투표 문항을 찾을 수 없습니다.");
        BnVoteQuestion question = questions.get(0);

        List<BnVoteItem> items = bnVoteItemRepository
                .findAllByBnVoteQuestionNoOrderByBnVoteItemOrderAsc(question.getBnVoteQuestionNo());
        List<BnVoteResult> results = bnVoteResultRepository.findAllByBnVoteNo(voteId);

        List<String> userIds = results.stream().map(BnVoteResult::getBnVoteResultUserId).distinct().toList();
        Map<String, String> userNicknameMap = new java.util.HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findByUserIdIn(userIds).forEach(u -> userNicknameMap.put(u.getUserId(),
                    u.getUserNickNm() != null ? u.getUserNickNm() : u.getUserNm()));
        }

        Map<Long, List<BnVoteStatusDto.VoterDto>> votersByItem = new java.util.HashMap<>();
        for (BnVoteItem item : items)
            votersByItem.put(item.getBnVoteItemNo(), new java.util.ArrayList<>());

        for (BnVoteResult result : results) {
            if (!votersByItem.containsKey(result.getBnVoteItemNo()))
                continue;
            String uid = result.getBnVoteResultUserId();
            votersByItem.get(result.getBnVoteItemNo()).add(
                    BnVoteStatusDto.VoterDto.builder()
                            .userId(uid)
                            .userName(userNicknameMap.getOrDefault(uid, uid))
                            .build());
        }

        List<BnVoteStatusDto.VoteOptionStatusDto> optionDtos = items.stream()
                .map(item -> {
                    List<BnVoteStatusDto.VoterDto> itemVoters = votersByItem.get(item.getBnVoteItemNo());
                    return BnVoteStatusDto.VoteOptionStatusDto.builder()
                            .bnVoteItemNo(item.getBnVoteItemNo())
                            .itemText(item.getBnVoteItemText())
                            .count(itemVoters.size())
                            .voters(itemVoters)
                            .build();
                })
                .toList();

        int totalPeople = (int) userIds.size();

        return BnVoteStatusDto.builder()
                .bnVoteNo(vote.getBnVoteNo())
                .title(vote.getVoteTitle())
                .totalVotes(totalPeople)
                .options(optionDtos)
                .build();
    }

    public List<BnVoteListDto> getVoteList(Long roomId, String userId) {
        List<BnVote> votes = bnVoteRepository.findAllByBnNoOrderByInsDtimeDesc(roomId);
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        return votes.stream().map(vote -> {
            boolean hasVoted = false;
            if (userId != null && !userId.isEmpty()) {
                hasVoted = bnVoteJoinRepository.existsByBnVoteNoAndBnVoteUserId(vote.getBnVoteNo(), userId);
            }

            Long participantCount = bnVoteJoinRepository.countByBnVoteNo(vote.getBnVoteNo());
            boolean isExpired = vote.getVoteEndDtime() != null && vote.getVoteEndDtime().compareTo(currentDateTime) < 0;
            String status = isExpired ? "C" : vote.getVoteStatCd();

            return BnVoteListDto.builder()
                    .bnVoteNo(vote.getBnVoteNo())
                    .title(vote.getVoteTitle())
                    .voteStatCd(status)
                    .endTime(vote.getVoteEndDtime())
                    .hasVoted(hasVoted)
                    .isExpired(isExpired)
                    .participantCount(participantCount.intValue())
                    .build();
        }).collect(Collectors.toList());
    }
}
