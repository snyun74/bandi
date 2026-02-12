package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnUser;
import com.bandi.backend.entity.band.BnUserId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BnUserRepository extends JpaRepository<BnUser, BnUserId> {
    java.util.List<BnUser> findByBnNo(Long bnNo);
}
