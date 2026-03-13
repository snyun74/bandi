package com.bandi.backend.repository;

import com.bandi.backend.entity.cm.CmGrpChatMessageRead;
import com.bandi.backend.entity.cm.CmGrpChatMessageReadId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CmGrpChatMessageReadRepository extends JpaRepository<CmGrpChatMessageRead, CmGrpChatMessageReadId> {
}
