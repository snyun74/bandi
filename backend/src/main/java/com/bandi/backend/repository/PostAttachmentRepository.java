package com.bandi.backend.repository;

import com.bandi.backend.entity.sns.PostAttachment;
import com.bandi.backend.entity.sns.PostAttachmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostAttachmentRepository extends JpaRepository<PostAttachment, PostAttachmentId> {
    List<PostAttachment> findByPostId(Long postId);
}
