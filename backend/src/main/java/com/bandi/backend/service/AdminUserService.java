package com.bandi.backend.service;

import com.bandi.backend.dto.AdminUserDto;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAllAdminUsers();
    }

    @Transactional
    public void withdrawUser(String userId, String updId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setUserStatCd("D");
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        user.setUpdDtime(currentDateTime);
        user.setUpdId(updId);

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getUserGenderStats() {
        Map<String, Long> stats = new HashMap<>();
        long total = userRepository.countByUserStatCdNot("D");
        long male = userRepository.countByGenderCdAndUserStatCdNot("M", "D");
        long female = userRepository.countByGenderCdAndUserStatCdNot("F", "D");
        long other = total - male - female;

        stats.put("total", total);
        stats.put("male", male);
        stats.put("female", female);
        stats.put("other", other);
        return stats;
    }
}
