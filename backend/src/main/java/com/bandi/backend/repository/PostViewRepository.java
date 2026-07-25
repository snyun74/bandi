package com.bandi.backend.repository;

import com.bandi.backend.entity.sns.PostView;
import com.bandi.backend.entity.sns.PostViewId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PostViewRepository extends JpaRepository<PostView, PostViewId> {
    long countByPostId(Long postId);
    boolean existsByPostIdAndUserId(Long postId, String userId);
    Optional<PostView> findByPostIdAndUserId(Long postId, String userId);
}
