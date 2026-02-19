package com.bandi.backend.repository;

import com.bandi.backend.entity.common.BoardLike;
import com.bandi.backend.entity.common.BoardLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BoardLikeRepository extends JpaRepository<BoardLike, BoardLikeId> {

    Long countByBoardNo(Long boardNo);

    boolean existsByBoardNoAndUserId(Long boardNo, String userId);

    void deleteByBoardNoAndUserId(Long boardNo, String userId);
}
