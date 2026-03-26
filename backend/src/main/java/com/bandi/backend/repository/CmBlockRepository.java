package com.bandi.backend.repository;

import com.bandi.backend.entity.common.CmBlock;
import com.bandi.backend.entity.common.CmBlockId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CmBlockRepository extends JpaRepository<CmBlock, CmBlockId> {
    boolean existsByUserIdAndBlockUserId(String userId, String blockUserId);
}
