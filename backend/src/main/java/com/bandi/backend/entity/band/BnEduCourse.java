package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "BN_EDU_COURSE")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BnEduCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "COURSE_NO")
    private Long courseNo;

    @Column(name = "USER_ID", length = 20, nullable = false)
    private String userId;

    @Column(name = "COURSE_TITLE", length = 300, nullable = false)
    private String courseTitle;

    @Column(name = "COURSE_DESC", columnDefinition = "TEXT")
    private String courseDesc;

    @Column(name = "EDU_TYPE_FG", length = 1, nullable = false)
    private String eduTypeFg; // F: 무상, P: 유상

    @Column(name = "COURSE_AMT", nullable = false)
    @Builder.Default
    private Integer courseAmt = 0;

    @Column(name = "ATTACH_NO_IMG")
    private Long attachNoImg;

    @Column(name = "ATTACH_NO_MOV")
    private Long attachNoMov;

    @Column(name = "COURSE_STAT_CD", length = 20, nullable = false)
    private String courseStatCd; // R: 등록/대기, A: 승인/공개, D: 삭제/내림

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
