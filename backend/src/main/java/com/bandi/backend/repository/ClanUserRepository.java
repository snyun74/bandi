package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanUser;
import com.bandi.backend.entity.clan.ClanUserId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClanUserRepository extends JpaRepository<ClanUser, ClanUserId> {
    java.util.Optional<ClanUser> findByCnNoAndCnUserRoleCd(Long cnNo, String cnUserRoleCd);

    java.util.List<ClanUser> findAllByCnNoAndCnUserRoleCdIn(Long cnNo, java.util.Collection<String> roleCodes);

    @org.springframework.data.jpa.repository.Query("SELECT cu.cnNo FROM ClanUser cu WHERE cu.cnUserId = :userId AND cu.cnUserApprStatCd = 'CN' AND cu.cnUserStatCd = 'A'")
    java.util.List<Long> findCnNosByUserId(@org.springframework.data.repository.query.Param("userId") String userId);
}
