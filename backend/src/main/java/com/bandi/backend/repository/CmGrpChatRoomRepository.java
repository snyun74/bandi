package com.bandi.backend.repository;

import com.bandi.backend.entity.cm.CmGrpChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CmGrpChatRoomRepository extends JpaRepository<CmGrpChatRoom, Long> {
}
