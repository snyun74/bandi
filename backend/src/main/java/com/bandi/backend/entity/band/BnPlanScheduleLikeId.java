package com.bandi.backend.entity.band;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BnPlanScheduleLikeId implements Serializable {
    private Long bnNo;
    private String bnSchDate;
    private String bnUserId;
}
