package com.bandi.backend.controller;

import com.bandi.backend.service.KakaoAuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final KakaoAuthService kakaoAuthService;
    private final com.bandi.backend.service.AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody com.bandi.backend.dto.SignupRequestDto dto) {
        try {
            authService.registerUser(dto);
            return ResponseEntity.ok().body(new AuthResponse("User Registered Successfully", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new AuthResponse("Registration Failed: " + e.getMessage(), null));
        }
    }

    @GetMapping("/check-id")
    public ResponseEntity<?> checkId(@RequestParam String userId) {
        boolean exists = authService.checkUserIdDuplicate(userId);
        return ResponseEntity.ok().body(java.util.Collections.singletonMap("exists", exists));
    }

    @GetMapping("/check-nickname")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
        boolean exists = authService.checkNicknameDuplicate(nickname);
        return ResponseEntity.ok().body(java.util.Collections.singletonMap("exists", exists));
    }

    @GetMapping("/check-phone")
    public ResponseEntity<?> checkPhone(@RequestParam String phoneNumber) {
        boolean exists = authService.checkPhoneDuplicate(phoneNumber);
        return ResponseEntity.ok().body(java.util.Collections.singletonMap("exists", exists));
    }

    @GetMapping("/common/codes/{commCd}")
    public ResponseEntity<?> getCommonCodes(@PathVariable String commCd) {
        return ResponseEntity.ok().body(authService.getCommonCodes(commCd));
    }

    @GetMapping("/user/name")
    public ResponseEntity<?> getUserName(@RequestParam String userId) {
        String name = authService.getUserName(userId);
        return ResponseEntity.ok().body(java.util.Collections.singletonMap("name", name));
    }

    @GetMapping("/find-id")
    public ResponseEntity<?> findId(@RequestParam String phoneNumber) {
        try {
            String userId = authService.findIdByPhone(phoneNumber);
            return ResponseEntity.ok().body(java.util.Collections.singletonMap("userId", userId));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/check-user")
    public ResponseEntity<?> checkUser(@RequestBody java.util.Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String phoneNumber = request.get("phoneNumber");
            authService.validateUserForReset(userId, phoneNumber);
            return ResponseEntity.ok().body(java.util.Collections.singletonMap("message", "User Validated"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String phoneNumber = request.get("phoneNumber");
            String newPassword = request.get("newPassword");

            authService.resetPassword(userId, phoneNumber, newPassword);
            return ResponseEntity.ok().body(java.util.Collections.singletonMap("message", "Password Reset Success"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/kakao")
    public ResponseEntity<?> kakaoLogin(@RequestBody KakaoLoginRequest request) {
        try {
            java.util.Map<String, String> result = kakaoAuthService.kakaoLogin(request.getCode());
            return ResponseEntity.ok().body(new AuthResponse("Kakao Login Success", result.get("token"),
                    result.get("userId"), result.get("userName")));
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            e.printStackTrace();
            // This will return the actual error JSON from Kakao (e.g.,
            // {"error":"invalid_grant",...})
            return ResponseEntity.status(e.getStatusCode())
                    .body(new AuthResponse("Kakao Error: " + e.getResponseBodyAsString(), null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new AuthResponse("Login Failed: " + e.getMessage(), null));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Check credentials
            authService.login(request.getUserId(), request.getPassword());
            // Return success with dummy token
            String name = authService.getUserName(request.getUserId());
            return ResponseEntity.ok()
                    .body(new AuthResponse("Login Success", "dummy-token-" + System.currentTimeMillis(),
                            request.getUserId(), name));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(new AuthResponse(e.getMessage(), null));
        }
    }

    @Data
    public static class LoginRequest {
        private String userId;
        private String password;
    }

    @Data
    public static class KakaoLoginRequest {
        private String code;
    }

    @Data
    public static class AuthResponse {
        private String message;
        private String token;
        private String userId;
        private String userName;

        public AuthResponse(String message, String token) {
            this.message = message;
            this.token = token;
        }

        public AuthResponse(String message, String token, String userId, String userName) {
            this.message = message;
            this.token = token;
            this.userId = userId;
            this.userName = userName;
        }
    }
}
