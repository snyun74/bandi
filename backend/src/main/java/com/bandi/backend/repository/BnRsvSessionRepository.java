package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnRsvSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BnRsvSessionRepository extends JpaRepository<BnRsvSession, Long> {

    // 특정 합주방 + 세션의 예약 목록 (순번 오름차순)
    List<BnRsvSession> findByBnNoAndBnSessionTypeCdOrderByBnRsvSessionNoAsc(Long bnNo, String bnSessionTypeCd);

    // 특정 합주방의 모든 예약 목록
    List<BnRsvSession> findByBnNoOrderByBnRsvSessionNoAsc(Long bnNo);

    // 특정 유저의 특정 세션 예약 여부 확인
    Optional<BnRsvSession> findByBnNoAndBnSessionTypeCdAndBnSessionRsvUserId(Long bnNo, String bnSessionTypeCd,
            String userId);

    // 특정 합주방의 세션별 예약 건수
    long countByBnNoAndBnSessionTypeCd(Long bnNo, String bnSessionTypeCd);
}
