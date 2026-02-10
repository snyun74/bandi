package com.bandi.backend.repository.vote;

import com.bandi.backend.entity.clan.ClanVoteResult;
import com.bandi.backend.entity.clan.ClanVoteResultId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClanVoteResultRepository extends JpaRepository<ClanVoteResult, ClanVoteResultId> {
    void deleteByCnVoteNoAndCnVoteResultUserId(Long cnVoteNo, String cnVoteResultUserId);

    java.util.List<ClanVoteResult> findByCnVoteNoAndCnVoteResultUserId(Long cnVoteNo, String cnVoteResultUserId);

    java.util.List<ClanVoteResult> findAllByCnVoteNo(Long cnVoteNo);
}
