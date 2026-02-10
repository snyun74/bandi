package com.bandi.backend.repository;

import com.bandi.backend.entity.member.ChatMessageRead;
import com.bandi.backend.entity.member.ChatMessageReadId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageReadRepository extends JpaRepository<ChatMessageRead, ChatMessageReadId> {
}
