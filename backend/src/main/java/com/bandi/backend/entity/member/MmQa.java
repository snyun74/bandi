package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_QA")
@Getter
@Setter
public class MmQa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "qa_no")
    private Long qaNo;

    @Column(name = "user_id", length = 20, nullable = false)
    private String userId;

    @Column(name = "crd_date", length = 8, nullable = false)
    private String crdDate;

    @Column(name = "title", length = 400, nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "parent_qa_no")
    private Long parentQaNo;

    @Column(name = "qa_stat_cd", length = 20, nullable = false)
    private String qaStatCd;

    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
