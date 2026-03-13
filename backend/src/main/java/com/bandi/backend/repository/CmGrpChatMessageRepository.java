package com.bandi.backend.repository;

import com.bandi.backend.entity.cm.CmGrpChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CmGrpChatMessageRepository extends JpaRepository<CmGrpChatMessage, Long> {
}
