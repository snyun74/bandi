package com.bandi.backend.repository;

import com.bandi.backend.entity.member.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, String> {
    java.util.List<User> findByUserIdIn(java.util.List<String> userIds);

    java.util.List<User> findByUserNmContainingOrUserNickNmContaining(String userNm, String userNickNm);

    java.util.List<User> findByUserNmContainingOrUserNickNmContainingAndUserIdNot(String userNm, String userNickNm,
            String userId);

    @Query("SELECT u FROM User u WHERE (u.userNm LIKE %:keyword% OR u.userNickNm LIKE %:keyword%) AND u.userId != :userId")
    java.util.List<User> searchUsersExcludeSelf(@Param("keyword") String keyword, @Param("userId") String userId);
}
