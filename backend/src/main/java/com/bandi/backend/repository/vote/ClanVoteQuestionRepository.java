package com.bandi.backend.repository.vote;

import com.bandi.backend.entity.clan.ClanVoteQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClanVoteQuestionRepository extends JpaRepository<ClanVoteQuestion, Long> {
    List<ClanVoteQuestion> findByCnVoteNo(Long cnVoteNo);
}
