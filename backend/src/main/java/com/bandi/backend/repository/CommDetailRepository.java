package com.bandi.backend.repository;

import com.bandi.backend.entity.common.CommDetail;
import com.bandi.backend.entity.common.CommDetailId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommDetailRepository extends JpaRepository<CommDetail, CommDetailId> {

    @Query("SELECT d FROM CommDetail d " +
            "WHERE d.commCd = :commCd " +
            "ORDER BY d.commOrder")
    List<CommDetail> findActiveDetailsByCommCd(@Param("commCd") String commCd);
}
