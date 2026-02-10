package com.bandi.backend.repository.vote;

import com.bandi.backend.entity.clan.ClanVoteJoin;
import com.bandi.backend.entity.clan.ClanVoteJoinId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClanVoteJoinRepository extends JpaRepository<ClanVoteJoin, ClanVoteJoinId> {
    boolean existsByCnVoteNoAndCnVoteUserId(Long cnVoteNo, String cnVoteUserId);

    void deleteByCnVoteNoAndCnVoteUserId(Long cnVoteNo, String cnVoteUserId);

    int countByCnVoteNo(Long cnVoteNo);
}
