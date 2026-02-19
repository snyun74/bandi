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
public class ClanMemberDetailDto {
    private Long cnNo;
    private String cnUserId;
    private String cnUserRoleCd;
    private String cnUserApprStatCd;
    private String userNm;
    private String userNickNm;
    private List<MemberSessionDto> sessions;
}
