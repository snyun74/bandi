package com.bandi.backend.repository.vote;

import com.bandi.backend.entity.clan.ClanVoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClanVoteItemRepository extends JpaRepository<ClanVoteItem, Long> {
    List<ClanVoteItem> findByCnVoteQuestionNo(Long cnVoteQuestionNo);
}
