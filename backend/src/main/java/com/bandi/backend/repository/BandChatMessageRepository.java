package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BandChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BandChatMessageRepository extends JpaRepository<BandChatMessage, Long> {
}
