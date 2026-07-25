package com.bandi.backend.repository;

import com.bandi.backend.entity.sns.PostLike;
import com.bandi.backend.entity.sns.PostLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {
    long countByPostIdAndActionTypeFg(Long postId, String actionTypeFg);
    Optional<PostLike> findByPostIdAndUserId(Long postId, String userId);
}
