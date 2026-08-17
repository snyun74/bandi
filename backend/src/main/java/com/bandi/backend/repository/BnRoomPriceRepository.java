package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnRoomPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BnRoomPriceRepository extends JpaRepository<BnRoomPrice, Long> {
    List<BnRoomPrice> findByRoomNoOrderByDayOfWeekAscSttTimeAsc(Long roomNo);
    void deleteByRoomNo(Long roomNo);
    long countByRoomNo(Long roomNo);
}
