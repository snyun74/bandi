package com.bandi.backend.entity.sns;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostViewId implements Serializable {
    private Long postId;
    private String userId;
}
