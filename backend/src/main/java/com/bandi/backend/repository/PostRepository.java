package com.bandi.backend.repository;

import com.bandi.backend.entity.sns.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByUserIdOrderByInsDtimeDesc(String userId, Pageable pageable);
    Page<Post> findByUserIdAndPostStatCdOrderByInsDtimeDesc(String userId, String postStatCd, Pageable pageable);
    Page<Post> findByPublicTypeCdAndPostStatCdOrderByInsDtimeDesc(String publicTypeCd, String postStatCd, Pageable pageable);
}
