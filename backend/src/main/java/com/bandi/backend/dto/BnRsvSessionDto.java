package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class BnRsvSessionDto {
    private Long bnNo;
    private String sessionTypeCd;
    private String sessionName;
    private List<ReservationItem> reservations;

    @Getter
    @Setter
    @Builder
    public static class ReservationItem {
        private Long rsvNo; // 예약순번 (BN_RSV_SESSION_NO)
        private String userId;
        private String userNickNm; // 예약자 닉네임
        private String sessionName; // 세션명
    }
}
