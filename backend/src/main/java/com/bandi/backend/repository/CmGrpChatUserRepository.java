package com.bandi.backend.repository;

import com.bandi.backend.entity.cm.CmGrpChatUser;
import com.bandi.backend.entity.cm.CmGrpChatUserId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CmGrpChatUserRepository extends JpaRepository<CmGrpChatUser, CmGrpChatUserId> {
}
