package com.bandi.backend.repository;

import com.bandi.backend.entity.common.BoardAttachment;
import com.bandi.backend.entity.common.BoardAttachmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardAttachmentRepository extends JpaRepository<BoardAttachment, BoardAttachmentId> {
    List<BoardAttachment> findByBoardNo(Long boardNo);
}
