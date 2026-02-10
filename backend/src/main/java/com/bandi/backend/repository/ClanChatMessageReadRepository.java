package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanChatMessageRead;
import com.bandi.backend.entity.clan.ClanChatMessageReadId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClanChatMessageReadRepository extends JpaRepository<ClanChatMessageRead, ClanChatMessageReadId> {
}
