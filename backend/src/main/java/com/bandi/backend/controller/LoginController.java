package com.bandi.backend.controller;

import com.bandi.backend.service.LoginService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 개발 편의를 위해 일단 모든 Origin 허용
public class LoginController {

    private final LoginService loginService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        boolean isAuthenticated = loginService.login(request.getUserId(), request.getPassword());

        if (isAuthenticated) {
            return ResponseEntity.ok().body(new LoginResponse("Login Success", "token-placeholder"));
        } else {
            return ResponseEntity.status(401).body(new LoginResponse("Login Failed", null));
        }
    }

    @Data
    public static class LoginRequest {
        private String userId;
        private String password;
    }

    @Data
    public static class LoginResponse {
        private String message;
        private String token;

        public LoginResponse(String message, String token) {
            this.message = message;
            this.token = token;
        }
    }
}
