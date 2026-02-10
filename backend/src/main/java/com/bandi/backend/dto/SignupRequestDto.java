package com.bandi.backend.dto;

import lombok.Data;

@Data
public class SignupRequestDto {
    private String userId;
    private String userNm;
    private String userNickNm;
    private String email;
    private String phoneNo;
    private String birthDt;
    private String genderCd;
    private String password;
}
