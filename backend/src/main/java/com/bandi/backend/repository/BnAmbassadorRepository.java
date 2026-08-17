package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnAmbassador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BnAmbassadorRepository extends JpaRepository<BnAmbassador, String> {
    Optional<BnAmbassador> findByUserId(String userId);
    java.util.List<BnAmbassador> findByApplyStatCd(String applyStatCd);
}
