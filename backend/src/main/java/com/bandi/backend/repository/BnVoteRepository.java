package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BnVoteRepository extends JpaRepository<BnVote, Long> {
    List<BnVote> findAllByBnNoOrderByInsDtimeDesc(Long bnNo);

    List<BnVote> findAllByBnNoAndVoteStatCdOrderByInsDtimeDesc(Long bnNo, String voteStatCd);
}
