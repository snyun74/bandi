package com.bandi.backend.enums;

import lombok.Getter;

@Getter
public enum FileCategory {
    PROFILE("profile"),
    BOARD("board"),
    SHORTS("shorts"),
    SNS("sns"),
    CHAT("chat"),
    CLAN("clan"),
    BAND("band"),
    ADMIN("admin"),
    AMBASSADOR("ambassador");

    private final String domain;

    FileCategory(String domain) {
        this.domain = domain;
    }

    public static FileCategory fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return BOARD; // 기본값
        }
        String cleanValue = value.contains(",") ? value.split(",")[0].trim() : value.trim();
        for (FileCategory category : FileCategory.values()) {
            if (category.domain.equalsIgnoreCase(cleanValue) || category.name().equalsIgnoreCase(cleanValue)) {
                return category;
            }
        }
        return BOARD;
    }
}
