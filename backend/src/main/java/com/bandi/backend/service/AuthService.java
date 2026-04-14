package com.bandi.backend.service;

import com.bandi.backend.dto.SignupRequestDto;
import com.bandi.backend.entity.common.CommDetail;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.entity.member.UserAccount;
import com.bandi.backend.repository.CommDetailRepository;
import com.bandi.backend.repository.PrivacyAgreeInfoRepository;
import com.bandi.backend.repository.UserAccountRepository;
import com.bandi.backend.repository.UserRepository;
import com.bandi.backend.entity.member.PrivacyAgreeInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final CommDetailRepository commDetailRepository;
    private final PrivacyAgreeInfoRepository privacyAgreeInfoRepository;
    private final SmsService smsService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

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

    @Transactional(readOnly = true)
    public boolean checkPhoneDuplicate(String phoneNo) {
        return !userRepository.findByPhoneNo(phoneNo).isEmpty();
    }

    @Transactional
    public void registerUser(SignupRequestDto dto) {
        // 0. SMS 인증 여부 확인
        String cleanPhoneNo = dto.getPhoneNo().replace("-", "");
        if (!smsService.isVerified(cleanPhoneNo)) {
            throw new RuntimeException("휴대폰 번호 인증이 완료되지 않았습니다.");
        }

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
        user.setPrivacyAgreeYn(dto.getPrivacyAgreeYn());
        user.setPrivacyAgreeVerId(dto.getPrivacyAgreeVerId());

        // Validate Privacy Agreement
        if (!"Y".equals(dto.getPrivacyAgreeYn())) {
            throw new RuntimeException("개인정보 동의가 필요합니다.");
        }
        if (dto.getPrivacyAgreeVerId() == null || dto.getPrivacyAgreeVerId().isEmpty()) {
            throw new RuntimeException("개인정보 동의 버전 정보가 없습니다.");
        }

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

        // Encrypt Password (BCrypt)
        account.setPasswd(passwordEncoder.encode(dto.getPassword()));

        // Audit
        account.setInsDtime(nowDtime);
        account.setInsId(dto.getUserId());
        account.setUpdDtime(nowDtime);
        account.setUpdId(dto.getUserId());

        userAccountRepository.save(account);

        // 3. 인증 정보 삭제
        smsService.clearVerification(cleanPhoneNo);

        log.info("User registered successfully: {}", dto.getUserId());
    }

    @Transactional(readOnly = true)
    public String findIdByPhone(String phoneNo) {
        String cleanPhoneNo = phoneNo.replace("-", "");

        // 1. SMS 인증 여부 확인
        if (!smsService.isVerified(cleanPhoneNo)) {
            throw new RuntimeException("휴대폰 번호 인증이 완료되지 않았습니다.");
        }

        // 2. 사용자 조회
        java.util.List<User> users = userRepository.findByPhoneNo(phoneNo);
        if (users.isEmpty()) {
            throw new RuntimeException("해당 휴대폰 번호로 등록된 아이디가 없습니다.");
        }

        // 여러 개의 아이디가 있을 경우 콤마로 구분하여 반환
        return users.stream()
                .map(User::getUserId)
                .collect(java.util.stream.Collectors.joining(", "));
    }

    @Transactional(readOnly = true)
    public void validateUserForReset(String userId, String phoneNo) {
        String cleanPhoneNo = phoneNo.replace("-", "");

        // 1. 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 아이디입니다."));

        // 2. 전화번호 일치 확인
        if (!user.getPhoneNo().replace("-", "").equals(cleanPhoneNo)) {
            throw new RuntimeException("아이디와 등록된 휴대폰 번호가 일치하지 않습니다.");
        }
    }

    @Transactional
    public void resetPassword(String userId, String phoneNo, String newPassword) {
        String cleanPhoneNo = phoneNo.replace("-", "");

        // 1. SMS 인증 여부 확인
        if (!smsService.isVerified(cleanPhoneNo)) {
            throw new RuntimeException("휴대폰 번호 인증이 완료되지 않았습니다.");
        }

        // 2. 사용자 조회 (ID와 전화번호 일치 여부)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 아이디입니다."));

        if (!user.getPhoneNo().replace("-", "").equals(cleanPhoneNo)) {
            throw new RuntimeException("아이디와 등록된 휴대폰 번호가 일치하지 않습니다.");
        }

        // 3. 비밀번호 업데이트 (MM_USER_ACCOUNT)
        UserAccount account = userAccountRepository.findByUserIdAndLoginTypeCd(userId, "NORL")
                .orElseThrow(() -> new RuntimeException("계정 정보를 찾을 수 없습니다."));

        account.setPasswd(passwordEncoder.encode(newPassword));
        account.setUpdDtime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        account.setUpdId("SYSTEM");

        userAccountRepository.save(account);
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

        log.info("Login Debug - DB Password: '{}'", account.getPasswd());

        if (!passwordEncoder.matches(password, account.getPasswd())) {
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
        return passwordEncoder.encode(password);
    }

    public PrivacyAgreeInfo getActivePrivacyPolicy() {
        return privacyAgreeInfoRepository.findFirstByPrivacyStatCd("A")
                .orElseThrow(() -> new RuntimeException("활성화된 개인정보 동의항목이 없습니다."));
    }
}
