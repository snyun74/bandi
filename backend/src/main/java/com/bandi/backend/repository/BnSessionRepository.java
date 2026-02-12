package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BnSessionRepository extends JpaRepository<BnSession, Long> {
}
