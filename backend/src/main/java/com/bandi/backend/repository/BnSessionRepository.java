package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BnSessionRepository extends JpaRepository<BnSession, Long> {
    List<BnSession> findByBnNo(Long bnNo);
}
