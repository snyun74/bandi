package com.bandi.backend.service;

import com.bandi.backend.dto.SignupRequestDto;
import com.bandi.backend.entity.common.CommDetail;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.entity.member.UserAccount;
import com.bandi.backend.repository.CommDetailRepository;
import com.bandi.backend.repository.UserAccountRepository;
import com.bandi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final CommDetailRepository commDetailRepository;

    @Transactional(readOnly = true)
    public boolean checkUserIdDuplicate(String userId) {
        return userRepository.existsById(userId);
    }

    @Transactional(readOnly = true)
    public boolean checkNicknameDuplicate(String nickname) {
        return userRepository.findAll().stream()
                .anyMatch(u -> u.getUserNickNm().equals(nickname));
    }

    @Transactional(readOnly = true)
    public List<CommDetail> getCommonCodes(String commCd) {
        return commDetailRepository.findActiveDetailsByCommCd(commCd);
    }

    @Transactional
    public void registerUser(SignupRequestDto dto) {
        String nowDtime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // 1. Save to MM_USER
        User user = new User();
        user.setUserId(dto.getUserId());
        user.setUserNm(dto.getUserNm());
        user.setUserNickNm(dto.getUserNickNm());
        user.setEmail(dto.getEmail());
        user.setPhoneNo(dto.getPhoneNo());
        user.setBirthDay(dto.getBirthDt());
        user.setGenderCd(dto.getGenderCd());
        user.setUserStatCd("A"); // Active
        user.setJoinDay(today);

        // Audit
        user.setInsDtime(nowDtime);
        user.setInsId(dto.getUserId());
        user.setUpdDtime(nowDtime);
        user.setUpdId(dto.getUserId());

        userRepository.save(user);

        // 2. Save to MM_USER_ACCOUNT
        UserAccount account = new UserAccount();
        account.setUserId(dto.getUserId());
        account.setAccountId(dto.getUserId()); // For NORL, AccountID = UserID
        account.setLoginTypeCd("NORL");
        account.setEmail(dto.getEmail());

        // Encrypt Password (SHA-256)
        account.setPasswd(encryptPassword(dto.getPassword()));

        // Audit
        account.setInsDtime(nowDtime);
        account.setInsId(dto.getUserId());
        account.setUpdDtime(nowDtime);
        account.setUpdId(dto.getUserId());

        userAccountRepository.save(account);

        log.info("User registered successfully: {}", dto.getUserId());
    }

    @Transactional
    public UserAccount login(String userId, String password) {
        // Debugging Log - Start
        log.info("Login Attempt - UserId: '{}', RawPassword: '{}'", userId, password);

        UserAccount account = userAccountRepository.findByUserIdAndLoginTypeCd(userId, "NORL")
                .orElse(null);

        if (account == null) {
            log.warn("Login Failed - User Not Found (UserId: {}, LoginType: NORL)", userId);
            throw new RuntimeException("존재하지 않는 사용자입니다.");
        }

        String encryptedPassword = encryptPassword(password);

        log.info("Login Debug - Encrypted Password: '{}'", encryptedPassword);
        log.info("Login Debug - DB Password: '{}'", account.getPasswd());

        if (!account.getPasswd().equals(encryptedPassword)) {
            log.warn("Login Failed - Password Mismatch");
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }

        // Update Audit Fields (Last Login Time)
        String nowDtime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // 1. Update UserAccount
        account.setUpdDtime(nowDtime);
        account.setUpdId(userId);

        // 2. Update User (Optional but recommended for consistency)
        userRepository.findById(userId).ifPresent(user -> {
            user.setUpdDtime(nowDtime);
            user.setUpdId(userId);
        });

        return account;
    }

    @Transactional(readOnly = true)
    public String getUserName(String userId) {
        log.info("Fetching name for userId: {}", userId);
        return userRepository.findById(userId)
                .map(user -> {
                    String name;
                    if (user.getUserNickNm() != null && !user.getUserNickNm().isEmpty()) {
                        name = user.getUserNickNm();
                    } else {
                        name = user.getUserNm();
                    }
                    log.info("Found user: {}, Name to return: {}", userId, name);
                    return name;
                })
                .orElseGet(() -> {
                    log.warn("User not found in MM_USER: {}", userId);
                    return "회원";
                });
    }

    private String encryptPassword(String password) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Password encryption failed", e);
        }
    }
}
