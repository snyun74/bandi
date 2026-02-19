package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnVoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BnVoteItemRepository extends JpaRepository<BnVoteItem, Long> {
    List<BnVoteItem> findAllByBnVoteQuestionNoOrderByBnVoteItemOrderAsc(Long bnVoteQuestionNo);

    List<BnVoteItem> findAllByBnVoteQuestionNoIn(List<Long> bnVoteQuestionNos);
}
