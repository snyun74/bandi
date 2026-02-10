package com.bandi.backend.repository.vote;

import com.bandi.backend.entity.clan.ClanVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClanVoteRepository extends JpaRepository<ClanVote, Long> {
    List<ClanVote> findAllByCnNoOrderByInsDtimeDesc(Long cnNo);
    // You might want to find by roomId, which is mapped to cnNo
}
