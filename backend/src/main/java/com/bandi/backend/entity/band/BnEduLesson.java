package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "BN_EDU_LESSON", uniqueConstraints = {
    @UniqueConstraint(name = "UK_BN_EDU_LESSON_SEQ", columnNames = {"COURSE_NO", "LESSON_SEQ"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BnEduLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LESSON_NO")
    private Long lessonNo;

    @Column(name = "COURSE_NO", nullable = false)
    private Long courseNo;

    @Column(name = "LESSON_SEQ", nullable = false)
    private Integer lessonSeq;

    @Column(name = "LESSON_TITLE", length = 300, nullable = false)
    private String lessonTitle;

    @Column(name = "LESSON_DESC", columnDefinition = "TEXT")
    private String lessonDesc;

    @Column(name = "ATTACH_NO_MOV", nullable = false)
    private Long attachNoMov;

    @Column(name = "ATTACH_NO_IMG")
    private Long attachNoImg;

    @Column(name = "DURATION_SEC", nullable = false)
    @Builder.Default
    private Integer durationSec = 0;

    @Column(name = "LESSON_STAT_CD", length = 20, nullable = false)
    private String lessonStatCd; // R: 등록/대기, A: 승인/공개, D: 삭제/내림

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
