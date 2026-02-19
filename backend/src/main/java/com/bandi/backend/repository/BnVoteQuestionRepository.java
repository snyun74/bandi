package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnVoteQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BnVoteQuestionRepository extends JpaRepository<BnVoteQuestion, Long> {
    List<BnVoteQuestion> findAllByBnVoteNoOrderByBnVoteQuestionOrderAsc(Long bnVoteNo);
}
