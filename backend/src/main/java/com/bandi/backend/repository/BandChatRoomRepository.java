package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BandChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BandChatRoomRepository extends JpaRepository<BandChatRoom, Long> {
}
