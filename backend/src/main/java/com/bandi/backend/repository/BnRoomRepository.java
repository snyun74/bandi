package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BnRoomRepository extends JpaRepository<BnRoom, Long> {
    List<BnRoom> findByStudioNoOrderByInsDtimeDesc(Long studioNo);
}
