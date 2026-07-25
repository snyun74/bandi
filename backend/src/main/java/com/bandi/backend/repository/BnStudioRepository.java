package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnStudio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BnStudioRepository extends JpaRepository<BnStudio, Long> {
    List<BnStudio> findByPartnerNoOrderByInsDtimeDesc(Long partnerNo);
    List<BnStudio> findByStudioStatCdOrderByInsDtimeDesc(String studioStatCd);
}
