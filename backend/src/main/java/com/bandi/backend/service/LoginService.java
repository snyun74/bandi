package com.bandi.backend.service;

import com.bandi.backend.entity.member.UserAccount;
import com.bandi.backend.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final UserAccountRepository userAccountRepository;

    @Transactional(readOnly = true)
    public boolean login(String userId, String password) {
        // "NORL" 타입의 계정 조회
        Optional<UserAccount> userAccountOpt = userAccountRepository.findByUserIdAndLoginTypeCd(userId, "NORL");

        if (userAccountOpt.isEmpty()) {
            return false;
        }

        UserAccount userAccount = userAccountOpt.get();
        // TODO: 추후 암호화된 패스워드 비교로 변경 필요 (현재는 평문 비교)
        return userAccount.getPasswd().equals(password);
    }
}
