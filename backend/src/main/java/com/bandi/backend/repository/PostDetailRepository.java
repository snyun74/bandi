package com.bandi.backend.repository;

import com.bandi.backend.entity.sns.PostDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostDetailRepository extends JpaRepository<PostDetail, Long> {
    List<PostDetail> findByPostIdAndReplyStatCdOrderByPostsReplyNoAsc(Long postId, String replyStatCd);
    long countByPostIdAndReplyStatCd(Long postId, String replyStatCd);
}
