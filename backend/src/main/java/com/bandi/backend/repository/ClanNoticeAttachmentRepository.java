package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanNoticeAttachment;
import com.bandi.backend.entity.clan.ClanNoticeAttachmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClanNoticeAttachmentRepository extends JpaRepository<ClanNoticeAttachment, ClanNoticeAttachmentId> {
    java.util.List<ClanNoticeAttachment> findByCnNoticeNo(Long cnNoticeNo);
}
