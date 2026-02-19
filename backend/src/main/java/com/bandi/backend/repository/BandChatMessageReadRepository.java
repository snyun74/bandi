package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BandChatMessageRead;
import com.bandi.backend.entity.band.BandChatMessageReadId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BandChatMessageReadRepository extends JpaRepository<BandChatMessageRead, BandChatMessageReadId> {
}
