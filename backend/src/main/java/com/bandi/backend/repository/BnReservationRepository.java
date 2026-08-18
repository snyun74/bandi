package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BnReservationRepository extends JpaRepository<BnReservation, Long> {
    List<BnReservation> findByRoomNoInOrderByInsDtimeDesc(List<Long> roomNos);
    List<BnReservation> findByUserIdOrderByInsDtimeDesc(String userId);
    List<BnReservation> findByRoomNoAndUseDateOrderBySttTimeAsc(Long roomNo, String useDate);
    List<BnReservation> findByRoomNoAndUseDateStartingWithAndResvStatFgNotIn(Long roomNo, String yearMonthPrefix, List<String> excludeStats);
    List<BnReservation> findByRoomNoAndUseDateStartingWith(Long roomNo, String yearMonthPrefix);
    List<BnReservation> findByBnNoIn(List<Long> bnNos);
}
