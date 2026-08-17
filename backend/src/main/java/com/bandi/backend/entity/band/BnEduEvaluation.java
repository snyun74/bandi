package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "BN_EDU_EVALUATION", uniqueConstraints = {
    @UniqueConstraint(name = "UK_BN_EDU_EVAL_USER", columnNames = {"COURSE_NO", "USER_ID"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BnEduEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "EVAL_NO")
    private Long evalNo;

    @Column(name = "COURSE_NO", nullable = false)
    private Long courseNo;

    @Column(name = "USER_ID", length = 20, nullable = false)
    private String userId;

    @Column(name = "RATING_SCORE", nullable = false)
    private Integer ratingScore; // 1~5

    @Column(name = "REVIEW_CONTENT", columnDefinition = "TEXT")
    private String reviewContent;

    @Column(name = "LIKE_FG", length = 1, nullable = false)
    @Builder.Default
    private String likeFg = "N";

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
