package com.bandi.backend.repository;

import com.bandi.backend.entity.member.UserAccount;
import com.bandi.backend.entity.member.UserAccountId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, UserAccountId> {
    Optional<UserAccount> findByUserIdAndLoginTypeCd(String userId, String loginTypeCd);

    java.util.List<UserAccount> findByUserIdIn(java.util.List<String> userIds);
}
