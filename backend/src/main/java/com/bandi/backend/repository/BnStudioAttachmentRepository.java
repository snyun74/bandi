package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnStudioAttachment;
import com.bandi.backend.entity.band.BnStudioAttachmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BnStudioAttachmentRepository extends JpaRepository<BnStudioAttachment, BnStudioAttachmentId> {
    List<BnStudioAttachment> findByStudioNo(Long studioNo);
    void deleteByStudioNo(Long studioNo);
    void deleteByStudioNoAndAttachNo(Long studioNo, Long attachNo);
}
