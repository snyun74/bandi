package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnVoteJoin;
import com.bandi.backend.entity.band.BnVoteJoinId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BnVoteJoinRepository extends JpaRepository<BnVoteJoin, BnVoteJoinId> {
    boolean existsByBnVoteNoAndBnVoteUserId(Long bnVoteNo, String bnVoteUserId);

    Long countByBnVoteNo(Long bnVoteNo);
}
