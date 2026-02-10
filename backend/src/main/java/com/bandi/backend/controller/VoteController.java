package com.bandi.backend.controller;

import com.bandi.backend.entity.clan.ClanVote;
import com.bandi.backend.entity.clan.ClanVoteQuestion;
import com.bandi.backend.entity.clan.ClanVoteItem;
import com.bandi.backend.entity.clan.ClanVoteJoin;
import com.bandi.backend.entity.clan.ClanVoteResult;
import com.bandi.backend.repository.vote.ClanVoteRepository;
import com.bandi.backend.repository.vote.ClanVoteQuestionRepository;
import com.bandi.backend.repository.vote.ClanVoteItemRepository;
import com.bandi.backend.repository.vote.ClanVoteJoinRepository;
import com.bandi.backend.repository.vote.ClanVoteResultRepository;
import com.bandi.backend.service.ChatService;
import org.springframework.transaction.annotation.Transactional;

import com.bandi.backend.dto.ChatMessageCreateDto;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vote")
public class VoteController {

    @Autowired
    private ClanVoteRepository clanVoteRepository;

    @Autowired
    private ClanVoteQuestionRepository clanVoteQuestionRepository;

    @Autowired
    private ClanVoteItemRepository clanVoteItemRepository;

    @Autowired
    private ClanVoteJoinRepository clanVoteJoinRepository;

    @Autowired
    private ClanVoteResultRepository clanVoteResultRepository;

    @Autowired
    private ChatService chatService;

    @Autowired
    private com.bandi.backend.repository.UserRepository userRepository;

    @Autowired
    private com.bandi.backend.repository.UserAccountRepository userAccountRepository;

    @PostMapping("/create")
    public ClanVote createVote(@RequestBody Map<String, Object> payload) {
        String title = (String) payload.get("title");
        Long roomId = Long.valueOf(String.valueOf(payload.get("roomId")));
        String userId = (String) payload.get("userId");
        Boolean allowMultiple = (Boolean) payload.get("allowMultiple");
        String endTime = (String) payload.get("endTime"); // ISO format
        List<String> options = (List<String>) payload.get("options");

        // Format Dates
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String formattedEndTime = endTime.replace("T", "").replace("-", "").replace(":", "") + "00";
        if (formattedEndTime.length() > 14)
            formattedEndTime = formattedEndTime.substring(0, 14);

        // 1. Save CN_VOTE
        ClanVote vote = new ClanVote();
        vote.setCnNo(roomId);
        vote.setVoteTitle(title);
        vote.setVoteDesc(title); // Description same as title for now
        vote.setVoteStatCd("A"); // Default Active
        vote.setVoteStdDtime(currentDateTime);
        vote.setVoteEndDtime(formattedEndTime);
        vote.setInsDtime(currentDateTime);
        vote.setInsId(userId);
        vote.setUpdDtime(currentDateTime);
        vote.setUpdId(userId);

        ClanVote savedVote = clanVoteRepository.save(vote);

        // 2. Save CN_VOTE_QUESTION
        ClanVoteQuestion question = new ClanVoteQuestion();
        question.setCnVoteNo(savedVote.getCnVoteNo());
        question.setCnVoteQuestionOrder(1); // Default 1
        question.setCnVoteQuestionType(allowMultiple ? "MULT" : "SING");
        question.setCnVoteQuestionText(title); // Question text matches title
        question.setInsDtime(currentDateTime);
        question.setInsId(userId);
        question.setUpdDtime(currentDateTime);
        question.setUpdId(userId);

        ClanVoteQuestion savedQuestion = clanVoteQuestionRepository.save(question);

        // 3. Save CN_VOTE_ITEMs
        int order = 1;
        for (String optContent : options) {
            if (optContent == null || optContent.trim().isEmpty())
                continue;
            ClanVoteItem item = new ClanVoteItem();
            item.setCnVoteQuestionNo(savedQuestion.getCnVoteQuestionNo());
            item.setCnVoteItemOrder(order++);
            item.setCnVoteItemText(optContent);
            item.setInsDtime(currentDateTime);
            item.setInsId(userId);
            item.setUpdDtime(currentDateTime);
            item.setUpdId(userId);

            clanVoteItemRepository.save(item);
        }

        // Send Chat Message
        ChatMessageCreateDto chatMessage = new ChatMessageCreateDto();
        chatMessage.setCnNo(roomId);
        chatMessage.setSndUserId(userId);
        chatMessage.setMsg("투표가 생성되었습니다: " + title);
        chatMessage.setMsgTypeCd("VOTE");
        chatMessage.setVoteNo(savedVote.getCnVoteNo());

        try {
            chatService.saveMessage(chatMessage);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return savedVote;
    }

    @PostMapping("/submit")
    @Transactional
    @SuppressWarnings("unchecked")
    public org.springframework.http.ResponseEntity<?> submitVote(@RequestBody Map<String, Object> payload) {
        Long voteId = Long.valueOf(String.valueOf(payload.get("voteId")));
        String userId = (String) payload.get("userId");
        List<Integer> itemIds = (List<Integer>) payload.get("itemIds"); // Using Integer as JSON numbers likely come as
                                                                        // int

        // 1. Check if already voted
        if (clanVoteJoinRepository.existsByCnVoteNoAndCnVoteUserId(voteId, userId)) {
            return org.springframework.http.ResponseEntity.badRequest().body("이미 투표에 참여하셨습니다.");
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // 2. Save CN_VOTE_JOIN
        ClanVoteJoin join = new ClanVoteJoin();
        join.setCnVoteNo(voteId);
        join.setCnVoteUserId(userId);
        join.setInsDtime(currentDateTime);
        join.setInsId(userId);
        join.setUpdDtime(currentDateTime);
        join.setUpdId(userId);
        clanVoteJoinRepository.save(join);

        // 3. Save CN_VOTE_RESULT
        // Need to find Question No. Assuming single question for now or derived from
        // item.
        // Logic: Find item to get question No.
        for (Integer itemIdInt : itemIds) {
            Long itemId = Long.valueOf(itemIdInt);
            ClanVoteItem item = clanVoteItemRepository.findById(itemId)
                    .orElseThrow(() -> new RuntimeException("Item not found: " + itemId));

            ClanVoteResult result = new ClanVoteResult();
            result.setCnVoteNo(voteId);
            result.setCnVoteQuestionNo(item.getCnVoteQuestionNo());
            result.setCnVoteItemNo(itemId);
            result.setCnVoteResultUserId(userId);

            clanVoteResultRepository.save(result);
        }

        return org.springframework.http.ResponseEntity.ok().body("투표가 완료되었습니다.");
    }

    @PostMapping("/cancel")
    @Transactional
    public org.springframework.http.ResponseEntity<?> cancelVote(@RequestBody Map<String, Object> payload) {
        Long voteId = Long.valueOf(String.valueOf(payload.get("voteId")));
        String userId = (String) payload.get("userId");

        // Delete from Join
        clanVoteJoinRepository.deleteByCnVoteNoAndCnVoteUserId(voteId, userId);

        // Delete from Result
        clanVoteResultRepository.deleteByCnVoteNoAndCnVoteResultUserId(voteId, userId);

        return org.springframework.http.ResponseEntity.ok().body("투표가 취소되었습니다.");
    }

    @GetMapping("/{voteId}")
    public com.bandi.backend.dto.VoteDetailDto getVoteDetail(@PathVariable Long voteId,
            @RequestParam(required = false) String userId) {
        System.out.println("DEBUG: getVoteDetail called with voteId: " + voteId + ", userId: " + userId);
        // 1. Fetch Vote
        ClanVote vote = clanVoteRepository.findById(voteId)
                .orElseThrow(() -> {
                    System.out.println("DEBUG: Vote not found for id: " + voteId);
                    return new RuntimeException("Vote not found");
                });
        System.out.println("DEBUG: Vote found: " + vote.getVoteTitle() + ", VoteNo: " + vote.getCnVoteNo());

        // 2. Fetch Questions (Assuming 1 question for now as per logic)

        List<ClanVoteQuestion> questions = clanVoteQuestionRepository.findAll();
        System.out.println("DEBUG: Total questions found in DB: " + questions.size());

        List<ClanVoteQuestion> targetQuestions = questions.stream()
                .filter(q -> q.getCnVoteNo().equals(voteId))
                .toList();
        System.out.println("DEBUG: Target questions for vote " + voteId + ": " + targetQuestions.size());

        List<com.bandi.backend.dto.VoteDetailDto.QuestionDto> questionDtos = targetQuestions.stream().map(q -> {
            // Fetch Items for this Question
            List<ClanVoteItem> items = clanVoteItemRepository.findAll(); // Inefficient, optimizing to stream filter
                                                                         // again
            List<ClanVoteItem> targetItems = items.stream()
                    .filter(i -> i.getCnVoteQuestionNo().equals(q.getCnVoteQuestionNo()))
                    .sorted((a, b) -> a.getCnVoteItemOrder() - b.getCnVoteItemOrder())
                    .toList();

            List<com.bandi.backend.dto.VoteDetailDto.ItemDto> itemDtos = targetItems.stream()
                    .map(i -> com.bandi.backend.dto.VoteDetailDto.ItemDto.builder()
                            .cnVoteItemNo(i.getCnVoteItemNo())
                            .itemText(i.getCnVoteItemText())
                            .itemOrder(i.getCnVoteItemOrder())
                            .build())
                    .toList();

            return com.bandi.backend.dto.VoteDetailDto.QuestionDto.builder()
                    .cnVoteQuestionNo(q.getCnVoteQuestionNo())
                    .questionText(q.getCnVoteQuestionText())
                    .questionType(q.getCnVoteQuestionType())
                    .items(itemDtos)
                    .build();
        }).toList();

        boolean isMultiple = !questionDtos.isEmpty() && "MULT".equals(questionDtos.get(0).getQuestionType());

        // Check if user has voted and fetch my voted items
        boolean hasVoted = false;
        List<Long> myVoteItemIds = new java.util.ArrayList<>();
        if (userId != null && !userId.isEmpty()) {
            hasVoted = clanVoteJoinRepository.existsByCnVoteNoAndCnVoteUserId(voteId, userId);
            if (hasVoted) {
                List<ClanVoteResult> myResults = clanVoteResultRepository.findByCnVoteNoAndCnVoteResultUserId(voteId,
                        userId);
                myVoteItemIds = myResults.stream()
                        .map(ClanVoteResult::getCnVoteItemNo)
                        .toList();
            }
        }

        return com.bandi.backend.dto.VoteDetailDto.builder()
                .cnVoteNo(vote.getCnVoteNo())
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

    @GetMapping("/{voteId}/status")
    public com.bandi.backend.dto.VoteStatusDto getVoteStatus(@PathVariable Long voteId) {
        // 1. Fetch Vote
        ClanVote vote = clanVoteRepository.findById(voteId)
                .orElseThrow(() -> new RuntimeException("Vote not found"));

        // 2. Fetch Questions (Assuming single question for now)
        List<ClanVoteQuestion> questions = clanVoteQuestionRepository.findAll();
        ClanVoteQuestion question = questions.stream()
                .filter(q -> q.getCnVoteNo().equals(voteId)) // Inefficient but consistent with existing code pattern
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // 3. Fetch Items
        List<ClanVoteItem> items = clanVoteItemRepository.findByCnVoteQuestionNo(question.getCnVoteQuestionNo());

        // 4. Fetch All Results
        List<ClanVoteResult> results = clanVoteResultRepository.findAllByCnVoteNo(voteId);

        // 5. Fetch User Names using UserRepository (for nicknames)
        List<String> userIds = results.stream().map(ClanVoteResult::getCnVoteResultUserId).distinct().toList();
        List<com.bandi.backend.entity.member.User> users = new java.util.ArrayList<>();

        if (!userIds.isEmpty()) {
            users = userRepository.findByUserIdIn(userIds);
        }

        // Map UserId to Nickname
        Map<String, String> userNicknameMap = users.stream()
                .collect(java.util.stream.Collectors.toMap(
                        com.bandi.backend.entity.member.User::getUserId,
                        user -> user.getUserNickNm() != null ? user.getUserNickNm() : user.getUserNm(),
                        (existing, replacement) -> existing // Keep existing if duplicate
                ));

        Map<Long, List<com.bandi.backend.dto.VoteStatusDto.VoterDto>> votersByItem = new java.util.HashMap<>();

        // Initialize map
        for (ClanVoteItem item : items) {
            votersByItem.put(item.getCnVoteItemNo(), new java.util.ArrayList<>());
        }

        // Group results
        for (ClanVoteResult result : results) {
            if (!votersByItem.containsKey(result.getCnVoteItemNo()))
                continue;

            String userId = result.getCnVoteResultUserId();
            // Use Nickname if available, else fallback to userId
            String displayName = userNicknameMap.getOrDefault(userId, userId);

            votersByItem.get(result.getCnVoteItemNo()).add(
                    com.bandi.backend.dto.VoteStatusDto.VoterDto.builder()
                            .userId(userId)
                            .userName(displayName)
                            .build());
        }

        // Build Option DTOs
        List<com.bandi.backend.dto.VoteStatusDto.VoteOptionStatusDto> optionDtos = items.stream()
                .sorted((a, b) -> a.getCnVoteItemOrder() - b.getCnVoteItemOrder())
                .map(item -> {
                    List<com.bandi.backend.dto.VoteStatusDto.VoterDto> itemVoters = votersByItem
                            .get(item.getCnVoteItemNo());
                    return com.bandi.backend.dto.VoteStatusDto.VoteOptionStatusDto.builder()
                            .cnVoteItemNo(item.getCnVoteItemNo())
                            .itemText(item.getCnVoteItemText())
                            .count(itemVoters.size())
                            .voters(itemVoters)
                            .build();
                })
                .toList();

        // Calculate total votes (people count)
        // Since a person can vote multiple items, distinct user count from results
        int totalPeople = (int) results.stream().map(ClanVoteResult::getCnVoteResultUserId).distinct().count();

        return com.bandi.backend.dto.VoteStatusDto.builder()
                .cnVoteNo(vote.getCnVoteNo())
                .title(vote.getVoteTitle())
                .totalVotes(totalPeople)
                .options(optionDtos)
                .build();
    }

    @GetMapping("/list/{roomId}")
    public List<com.bandi.backend.dto.VoteListDto> getVoteList(@PathVariable Long roomId,
            @RequestParam(required = false) String userId) {
        // 1. Fetch All Votes for Room
        List<ClanVote> votes = clanVoteRepository.findAllByCnNoOrderByInsDtimeDesc(roomId);

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // 2. Map to DTO
        return votes.stream().map(vote -> {
            boolean hasVoted = false;
            if (userId != null && !userId.isEmpty()) {
                hasVoted = clanVoteJoinRepository.existsByCnVoteNoAndCnVoteUserId(vote.getCnVoteNo(), userId);
            }

            int participantCount = clanVoteJoinRepository.countByCnVoteNo(vote.getCnVoteNo());
            boolean isExpired = vote.getVoteEndDtime() != null && vote.getVoteEndDtime().compareTo(currentDateTime) < 0;

            String status = vote.getVoteStatCd();
            if (isExpired) {
                status = "C"; // Closed
            }

            return com.bandi.backend.dto.VoteListDto.builder()
                    .cnVoteNo(vote.getCnVoteNo())
                    .title(vote.getVoteTitle())
                    .voteStatCd(status)
                    .endTime(vote.getVoteEndDtime())
                    .hasVoted(hasVoted)
                    .isExpired(isExpired)
                    .participantCount(participantCount)
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }
}
