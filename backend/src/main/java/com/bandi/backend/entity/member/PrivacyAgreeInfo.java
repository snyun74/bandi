package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_PRIVACY_AGREE_INFO")
@Getter
@Setter
public class PrivacyAgreeInfo {
    @Id
    @Column(name = "privacy_agree_ver_id", length = 20)
    private String privacyAgreeVerId;

    @Column(name = "privacy_agree_content", columnDefinition = "TEXT")
    private String privacyAgreeContent;

    @Column(name = "privacy_stat_cd", length = 20)
    private String privacyStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
