package com.bandi.backend.repository;

import com.bandi.backend.entity.member.UserSessionSkill;
import com.bandi.backend.entity.member.UserSessionSkillId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSessionSkillRepository extends JpaRepository<UserSessionSkill, UserSessionSkillId> {
    List<UserSessionSkill> findByUserId(String userId);

    void deleteByUserId(String userId);
}
