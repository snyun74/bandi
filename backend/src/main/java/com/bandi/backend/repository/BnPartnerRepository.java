package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnPartner;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface BnPartnerRepository extends JpaRepository<BnPartner, Long> {
    Optional<BnPartner> findFirstByUserIdOrderByInsDtimeDesc(String userId);
    List<BnPartner> findByPartnerStatCdOrderByInsDtimeDesc(String partnerStatCd);
    List<BnPartner> findByPartnerStatCdIn(List<String> partnerStatCds);
}
