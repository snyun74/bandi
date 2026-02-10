package com.bandi.backend.repository;

import com.bandi.backend.entity.common.BoardDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardDetailRepository extends JpaRepository<BoardDetail, Long> {

    List<BoardDetail> findByBoardNoOrderByInsDtimeAsc(Long boardNo);
}
