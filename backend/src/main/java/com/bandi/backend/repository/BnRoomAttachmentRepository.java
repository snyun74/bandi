package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnRoomAttachment;
import com.bandi.backend.entity.band.BnRoomAttachmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BnRoomAttachmentRepository extends JpaRepository<BnRoomAttachment, BnRoomAttachmentId> {
    List<BnRoomAttachment> findByRoomNo(Long roomNo);
    void deleteByRoomNo(Long roomNo);
    void deleteByRoomNoAndAttachNo(Long roomNo, Long attachNo);
}
