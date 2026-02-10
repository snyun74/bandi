package com.bandi.backend.repository;

import com.bandi.backend.entity.member.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByMmRoomNoOrderBySndDtimeAsc(Long mmRoomNo);

    // 마지막 메시지 번호 이후의 메시지 조회 (페이징/최신 메시지)
    List<ChatMessage> findByMmRoomNoAndMmMsgNoGreaterThanOrderBySndDtimeAsc(Long mmRoomNo, Long mmMsgNo);

    // 특정 메시지 번호 이전의 메시지 조회 (무한 스크롤 - 과거 내역)
    List<ChatMessage> findTop30ByMmRoomNoAndMmMsgNoLessThanOrderBySndDtimeDesc(Long mmRoomNo, Long mmMsgNo);

    // 가장 최신 메시지 조회 (채팅방 목록 표시용)
    ChatMessage findFirstByMmRoomNoOrderBySndDtimeDesc(Long mmRoomNo);
}
