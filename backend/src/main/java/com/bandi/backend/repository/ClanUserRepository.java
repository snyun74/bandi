package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanUser;
import com.bandi.backend.entity.clan.ClanUserId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClanUserRepository extends JpaRepository<ClanUser, ClanUserId> {
    java.util.Optional<ClanUser> findByCnNoAndCnUserRoleCd(Long cnNo, String cnUserRoleCd);
}
