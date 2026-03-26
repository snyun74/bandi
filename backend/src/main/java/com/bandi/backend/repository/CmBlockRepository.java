package com.bandi.backend.repository;

import com.bandi.backend.entity.common.CmBlock;
import com.bandi.backend.entity.common.CmBlockId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CmBlockRepository extends JpaRepository<CmBlock, CmBlockId> {
    boolean existsByUserIdAndBlockUserId(String userId, String blockUserId);

    void deleteByUserIdAndBlockUserId(String userId, String blockUserId);

    @Query(value = 
        "SELECT b.user_id as userId, u1.user_nick_nm as userNickNm, " +
        "b.block_user_id as blockUserId, u2.user_nick_nm as blockUserNickNm, " +
        "b.block_dtime as blockDtime " +
        "FROM CM_BLOCK b " +
        "LEFT JOIN MM_USER u1 ON b.user_id = u1.user_id " +
        "LEFT JOIN MM_USER u2 ON b.block_user_id = u2.user_id " +
        "WHERE (:search IS NULL OR :search = '' " +
        "OR b.user_id LIKE %:search% OR u1.user_nick_nm LIKE %:search% " +
        "OR b.block_user_id LIKE %:search% OR u2.user_nick_nm LIKE %:search%) " +
        "ORDER BY b.block_dtime DESC", 
        countQuery = "SELECT count(*) FROM CM_BLOCK b " +
        "LEFT JOIN MM_USER u1 ON b.user_id = u1.user_id " +
        "LEFT JOIN MM_USER u2 ON b.block_user_id = u2.user_id " +
        "WHERE (:search IS NULL OR :search = '' " +
        "OR b.user_id LIKE %:search% OR u1.user_nick_nm LIKE %:search% " +
        "OR b.block_user_id LIKE %:search% OR u2.user_nick_nm LIKE %:search%)",
        nativeQuery = true)
    Page<CmBlockProjection> findAllBlocksWithNicknames(@Param("search") String search, Pageable pageable);
}
