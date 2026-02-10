package com.bandi.backend.repository;

import com.bandi.backend.entity.common.BoardDetailLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BoardDetailLikeRepository extends JpaRepository<BoardDetailLike, Long> {

    Long countByReplyNo(Long replyNo);

    boolean existsByReplyNoAndUserId(Long replyNo, String userId);

    void deleteByReplyNoAndUserId(Long replyNo, String userId);
}
