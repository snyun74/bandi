package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupChatCreateDto {
    private String roomNm;
    private List<String> userIds; // List of user IDs to invite
}
