package com.bandi.backend.controller;

import com.bandi.backend.entity.clan.ClanGatherApply;
import com.bandi.backend.entity.clan.ClanGatherSession;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.repository.ClanGatherApplyRepository;
import com.bandi.backend.repository.ClanGatherSessionRepository;
import com.bandi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestDummyController {

    private final UserRepository userRepository;
    private final ClanGatherApplyRepository clanGatherApplyRepository;
    private final ClanGatherSessionRepository clanGatherSessionRepository;

    @GetMapping("/dummy-applicants/{gatherNo}")
    @Transactional
    public ResponseEntity<String> generateDummyApplicants(
            @PathVariable Long gatherNo,
            @RequestParam(name = "count", defaultValue = "30") int count) {
        log.info("Generating {} dummy applicants for gatherNo: {}", count, gatherNo);

        // 1. Clean up previous dummy data to prevent infinite growth
        List<ClanGatherApply> existingDummies = clanGatherApplyRepository.findAll().stream()
                .filter(a -> a.getUserId().startsWith("dummy_test_"))
                .toList();
        clanGatherApplyRepository.deleteAll(existingDummies);

        List<User> existingDummyUsers = userRepository.findAll().stream()
                .filter(u -> u.getUserId().startsWith("dummy_test_"))
                .toList();
        userRepository.deleteAll(existingDummyUsers);

        // 2. Fetch required sessions for the gathering
        List<String> availableSessions = clanGatherSessionRepository.findByGatherNo(gatherNo).stream()
                .map(ClanGatherSession::getSessionTypeCd)
                .toList();

        if (availableSessions.isEmpty()) {
            return ResponseEntity.badRequest().body("No sessions defined for gatherNo: " + gatherNo);
        }

        // 3. Generate dummy users and apply records
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String todayDate = currentDateTime.substring(0, 8);
        Random random = new Random();

        String[] genders = { "M", "F" };
        String[] mbtis = { "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ",
                "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP" };

        for (int i = 1; i <= count; i++) {
            String dummyUserId = "dummy_test_" + i;
            String dummyNickName = "테스트유저" + i;

            // Generate User
            User user = new User();
            user.setUserId(dummyUserId);
            user.setUserNm(dummyNickName);
            user.setUserNickNm(dummyNickName);
            user.setEmail(dummyUserId + "@test.com");
            user.setPhoneNo("010-0000-" + String.format("%04d", i));
            user.setBirthDay("19900101");
            user.setGenderCd(genders[random.nextInt(genders.length)]);
            user.setMbti(mbtis[random.nextInt(mbtis.length)]);
            user.setUserStatCd("A");
            user.setJoinDay(todayDate);
            user.setAdminYn("N");
            user.setInsDtime(currentDateTime);
            user.setInsId("system");
            user.setUpdDtime(currentDateTime);
            user.setUpdId("system");
            userRepository.save(user);

            // Generate Application
            ClanGatherApply apply = new ClanGatherApply();
            apply.setGatherNo(gatherNo);
            apply.setUserId(dummyUserId);

            // Round-robin session assignment for even distribution
            String sessionCd = availableSessions.get(i % availableSessions.size());
            apply.setSessionTypeCd1st(sessionCd);
            apply.setSession1stScore(random.nextInt(5) + 1); // Random score 1-5

            // Ensure 2nd session is never null if required
            apply.setSessionTypeCd2nd("");
            apply.setSession2ndScore(0);

            // Randomly assign a 2nd session (30% chance)
            if (random.nextInt(100) < 30 && availableSessions.size() > 1) {
                String secondSessionCd = availableSessions.get(random.nextInt(availableSessions.size()));
                if (!secondSessionCd.equals(sessionCd)) {
                    apply.setSessionTypeCd2nd(secondSessionCd);
                    apply.setSession2ndScore(random.nextInt(5) + 1);
                }
            }

            apply.setUserMbti(user.getMbti());
            apply.setUserGenderCd(user.getGenderCd());
            apply.setInsDtime(currentDateTime);
            apply.setInsId("system");
            apply.setUpdDtime(currentDateTime);
            apply.setUpdId("system");

            clanGatherApplyRepository.save(apply);
        }

        return ResponseEntity.ok("Successfully created " + count + " dummy applicants for gathering " + gatherNo);
    }
}
