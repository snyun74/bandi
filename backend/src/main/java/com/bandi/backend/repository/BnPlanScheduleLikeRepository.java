package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnPlanScheduleLike;
import com.bandi.backend.entity.band.BnPlanScheduleLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BnPlanScheduleLikeRepository extends JpaRepository<BnPlanScheduleLike, BnPlanScheduleLikeId> {
}
