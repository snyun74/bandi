package com.bandi.backend.repository;

import com.bandi.backend.entity.member.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, String> {
    User findByUserId(String userId);

    java.util.List<User> findByUserIdIn(java.util.List<String> userIds);

    java.util.List<User> findByUserNmContainingOrUserNickNmContaining(String userNm, String userNickNm);

    java.util.List<User> findByUserNmContainingOrUserNickNmContainingAndUserIdNot(String userNm, String userNickNm,
            String userId);

    java.util.List<User> findByPhoneNo(String phoneNo);

    long countByUserStatCdNot(String userStatCd);

    long countByGenderCdAndUserStatCdNot(String genderCd, String userStatCd);

    @Query("SELECT u.genderCd, count(u) FROM User u WHERE u.userStatCd != 'D' GROUP BY u.genderCd")
    java.util.List<Object[]> countByGenderGroup();

    @Query("SELECT u FROM User u WHERE (u.userNm LIKE %:keyword% OR u.userNickNm LIKE %:keyword%) AND u.userId != :userId")
    java.util.List<User> searchUsersExcludeSelf(@Param("keyword") String keyword, @Param("userId") String userId);

    @Query("SELECT new com.bandi.backend.dto.AdminUserDto(u.userId, u.userNm, u.userNickNm, u.joinDay, u.userStatCd, a.filePath, u.insDtime) " +
           "FROM User u " +
           "LEFT JOIN CmAttachment a ON u.attachNo = a.attachNo " +
           "ORDER BY u.insDtime DESC")
    java.util.List<com.bandi.backend.dto.AdminUserDto> findAllAdminUsers();

    java.util.List<User> findByAdminYn(String adminYn);
}
