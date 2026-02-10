package com.bandi.backend.repository;

import com.bandi.backend.dto.CommunityBoardListDto;
import com.bandi.backend.entity.common.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

        @Query("SELECT new com.bandi.backend.dto.CommunityBoardListDto(" +
                        "b.boardNo, " +
                        "b.boardTypeFg, " +
                        "b.title, " +
                        "b.insDtime, " +
                        "b.writerUserId, " +
                        "u.userNickNm, " +
                        "(SELECT COUNT(bl) FROM BoardLike bl WHERE bl.boardNo = b.boardNo), " +
                        "(SELECT COUNT(bd) FROM BoardDetail bd WHERE bd.boardNo = b.boardNo), " +
                        "(CASE WHEN (SELECT COUNT(bl2) FROM BoardLike bl2 WHERE bl2.boardNo = b.boardNo AND bl2.userId = :userId) > 0 THEN true ELSE false END)) "
                        +
                        "FROM Board b " +
                        "LEFT JOIN com.bandi.backend.entity.member.User u ON b.writerUserId = u.userId " +
                        "WHERE b.boardTypeFg = :boardTypeFg " +
                        "ORDER BY b.insDtime DESC")
        Page<CommunityBoardListDto> findBoardList(@Param("boardTypeFg") String boardTypeFg,
                        @Param("userId") String userId,
                        Pageable pageable);

        @Query("SELECT new com.bandi.backend.dto.CommunityBoardListDto(" +
                        "b.boardNo, " +
                        "b.boardTypeFg, " +
                        "b.title, " +
                        "b.insDtime, " +
                        "b.writerUserId, " +
                        "u.userNickNm, " +
                        "(SELECT COUNT(bl) FROM BoardLike bl WHERE bl.boardNo = b.boardNo), " +
                        "(SELECT COUNT(bd) FROM BoardDetail bd WHERE bd.boardNo = b.boardNo), " +
                        "(CASE WHEN (SELECT COUNT(bl2) FROM BoardLike bl2 WHERE bl2.boardNo = b.boardNo AND bl2.userId = :userId) > 0 THEN true ELSE false END)) "
                        +
                        "FROM Board b " +
                        "LEFT JOIN com.bandi.backend.entity.member.User u ON b.writerUserId = u.userId " +
                        "ORDER BY (SELECT COUNT(bl) FROM BoardLike bl WHERE bl.boardNo = b.boardNo) DESC")
        List<CommunityBoardListDto> findHotBoardList(@Param("userId") String userId, Pageable pageable);
}
