package com.bandi.backend.service;

import com.bandi.backend.entity.member.User;
import com.bandi.backend.entity.member.UserAccount;
import com.bandi.backend.repository.UserAccountRepository;
import com.bandi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KakaoAuthService {

    @Value("${kakao.client-id}")
    private String clientId;

    @Value("${kakao.redirect-uri}")
    private String redirectUri;

    private final UserAccountRepository userAccountRepository;
    private final UserRepository userRepository;

    @Transactional
    public Map<String, String> kakaoLogin(String code) {
        log.info("Starting Kakao Login with code: {}", code);

        // 1. Get Access Token
        String accessToken = getAccessToken(code);

        // 2. Get User Info
        Map<String, Object> userInfo = getUserInfo(accessToken);
        String socialId = String.valueOf(userInfo.get("id"));

        // Extract Nickname only (Available scope)
        String nickname = "Unknown";

        if (userInfo.containsKey("kakao_account")) {
            Map<String, Object> account = (Map<String, Object>) userInfo.get("kakao_account");
            if (account.containsKey("profile")) {
                Map<String, Object> profile = (Map<String, Object>) account.get("profile");
                if (profile.containsKey("nickname")) {
                    nickname = (String) profile.get("nickname");
                }
            }
        }

        // Fallback to properties
        if ("Unknown".equals(nickname) && userInfo.containsKey("properties")) {
            Map<String, Object> properties = (Map<String, Object>) userInfo.get("properties");
            if (properties.containsKey("nickname")) {
                nickname = (String) properties.get("nickname");
            }
        }

        // Forced Defaults as per User Request (Due to permission restrictions)
        String name = nickname; // Name = Nickname
        String gender = "F"; // Default Gender = F
        String phoneNumber = "010-0000-0000"; // Default Phone
        String email = ""; // Default Email

        log.info("Kakao User Info - ID: {}, Name: {}, Nickname: {}, Phone: {}, Gender: {}", socialId, name, nickname,
                phoneNumber, gender);

        // 3. User Sync (Login or Join)
        // Rule: LOGIN_TYPE_CD = "KKAO", USER_ID = KakaoID

        String targetUserId = socialId; // Rule: USER_ID = KakaoID

        Optional<UserAccount> accountOpt = userAccountRepository.findById(
                new com.bandi.backend.entity.member.UserAccountId(targetUserId, socialId));

        if (accountOpt.isEmpty()) {
            log.info("New Kakao User! Registering...");

            String nowDtime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

            // 3-1. Check and Create MM_USER if not exists
            if (!userRepository.existsById(targetUserId)) {
                User newUser = new User();
                newUser.setUserId(targetUserId); // Rule: KakaoID
                newUser.setUserNm(name); // Rule: Kakao Name (Real Name)
                newUser.setUserNickNm(nickname); // Rule: Kakao Nickname
                newUser.setUserStatCd("A"); // Rule: "A"
                newUser.setJoinDay(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))); // Rule:
                                                                                                         // YYYYMMDD
                newUser.setPhoneNo(phoneNumber); // Set extracted phone number
                newUser.setEmail(email); // Set extracted email
                newUser.setGenderCd(gender); // Set extracted gender

                // Audit fields (Rule: YYYYMMDDHHmmss, ID = Login ID)
                newUser.setInsDtime(nowDtime);
                newUser.setInsId(socialId); // Rule: Login ID
                newUser.setUpdDtime(nowDtime);
                newUser.setUpdId(socialId); // Rule: Login ID

                userRepository.save(newUser);
            }

            // 3-2. Create MM_USER_ACCOUNT
            UserAccount newAccount = new UserAccount();
            newAccount.setUserId(targetUserId); // Rule: Same as MM_USER.USER_ID
            newAccount.setAccountId(socialId); // Rule: Kakao Unique ID
            newAccount.setLoginTypeCd("KKAO"); // Rule: "KKAO"
            newAccount.setPasswd(null); // Rule: NULL
            newAccount.setEmail(""); // Optional

            // Audit fields (Rule: YYYYMMDDHHmmss, ID = Login ID)
            newAccount.setInsDtime(nowDtime);
            newAccount.setInsId(socialId); // Rule: Login ID
            newAccount.setUpdDtime(nowDtime);
            newAccount.setUpdId(socialId); // Rule: Login ID

            userAccountRepository.save(newAccount);
        } else {
            // Login Success - Update Audit (Last Login Time)
            String nowDtime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

            // 1. Update UserAccount
            UserAccount account = accountOpt.get();
            account.setUpdDtime(nowDtime);
            account.setUpdId(targetUserId);

            // 2. Update User
            userRepository.findById(targetUserId).ifPresent(user -> {
                user.setUpdDtime(nowDtime);
                user.setUpdId(targetUserId);
            });
        }

        // Return token and user details
        Map<String, String> result = new java.util.HashMap<>();
        result.put("token", "kakao-jwt-token-" + UUID.randomUUID().toString());
        result.put("userId", targetUserId);
        result.put("userName", name);
        return result;
    }

    private String getAccessToken(String code) {
        RestTemplate rt = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);

        // Debug Log
        log.info("Requesting Kakao Token with ClientID: {}, RedirectURI: {}", clientId, redirectUri);

        HttpEntity<MultiValueMap<String, String>> kakaoTokenRequest = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> response = rt.exchange(
                    "https://kauth.kakao.com/oauth/token",
                    HttpMethod.POST,
                    kakaoTokenRequest,
                    Map.class);
            String accessToken = (String) response.getBody().get("access_token");
            log.info("Kakao Token Obtained: {}... (Length: {})",
                    accessToken != null ? accessToken.substring(0, Math.min(accessToken.length(), 10)) : "NULL",
                    accessToken != null ? accessToken.length() : 0);
            return accessToken;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Kakao Token Exchange Failed via RestTemplate: {}", e.getResponseBodyAsString());
            throw e; // Re-throw to be caught by Controller
        }
    }

    private Map<String, Object> getUserInfo(String accessToken) {
        if (accessToken == null) {
            throw new RuntimeException("Access Token is null");
        }

        RestTemplate rt = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);
        headers.add("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

        HttpEntity<MultiValueMap<String, String>> kakaoProfileRequest = new HttpEntity<>(headers);

        try {
            // Changed to GET as it is more standard for fetching info
            ResponseEntity<Map> response = rt.exchange(
                    "https://kapi.kakao.com/v2/user/me",
                    HttpMethod.GET,
                    kakaoProfileRequest,
                    Map.class);
            return response.getBody();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Kakao User Info Failed (401/403): Header={}, Body={}", e.getResponseHeaders(),
                    e.getResponseBodyAsString());
            throw e;
        }
    }
}
