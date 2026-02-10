package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanBoardAttachment;
import com.bandi.backend.entity.clan.ClanBoardAttachmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClanBoardAttachmentRepository extends JpaRepository<ClanBoardAttachment, ClanBoardAttachmentId> {
    java.util.List<ClanBoardAttachment> findByCnBoardNoAndAttachStatCd(Long cnBoardNo, String attachStatCd);
}
