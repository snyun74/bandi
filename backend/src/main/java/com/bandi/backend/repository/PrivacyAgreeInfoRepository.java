package com.bandi.backend.repository;

import com.bandi.backend.entity.member.PrivacyAgreeInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrivacyAgreeInfoRepository extends JpaRepository<PrivacyAgreeInfo, String> {
    Optional<PrivacyAgreeInfo> findFirstByPrivacyStatCd(String privacyStatCd);
}
