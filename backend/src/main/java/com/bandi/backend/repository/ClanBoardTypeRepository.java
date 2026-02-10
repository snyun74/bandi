package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanBoardType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClanBoardTypeRepository extends JpaRepository<ClanBoardType, Long> {
    List<ClanBoardType> findByCnNoAndBoardTypeStatCd(Long cnNo, String boardTypeStatCd);
}
