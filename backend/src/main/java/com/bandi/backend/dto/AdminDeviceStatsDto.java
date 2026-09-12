package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDeviceStatsDto {
    private long totalDeviceCount;
    private long androidCount;
    private long iosCount;
    private long webCount;
    private long totalUserCount;
}
