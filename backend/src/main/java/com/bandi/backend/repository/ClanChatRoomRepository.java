package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClanChatRoomRepository extends JpaRepository<ClanChatRoom, Long> {
}
