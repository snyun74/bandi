package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnVoteResult;
import com.bandi.backend.entity.band.BnVoteResultId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BnVoteResultRepository extends JpaRepository<BnVoteResult, BnVoteResultId> {
    List<BnVoteResult> findAllByBnVoteNo(Long bnVoteNo);

    Long countByBnVoteItemNo(Long bnVoteItemNo);

    boolean existsByBnVoteNoAndBnVoteResultUserId(Long bnVoteNo, String userId);
}
