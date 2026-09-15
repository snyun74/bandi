package com.bandi.backend.controller;

import com.bandi.backend.entity.common.CommDetail;
import com.bandi.backend.repository.CommDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
public class CommonController {

    private final CommDetailRepository commDetailRepository;

    @GetMapping("/codes/{code}")
    public ResponseEntity<List<CommDetail>> getCommonCodes(@PathVariable String code) {
        List<CommDetail> details = commDetailRepository.findActiveDetailsByCommCd(code);
        return ResponseEntity.ok(details);
    }

    @GetMapping("/app-version")
    public ResponseEntity<java.util.Map<String, Object>> getAppVersion() {
        // iOS 설정 (기본값)
        int iosVersionCode = 4;
        String iosVersionName = "1.1.0";
        boolean iosForceUpdate = false;
        String iosStoreUrl = "https://apps.apple.com/app/id6475653554";

        // Android 설정 (기본값)
        int androidVersionCode = 24;
        String androidVersionName = "3.7.1";
        boolean androidForceUpdate = false;
        String androidStoreUrl = "market://details?id=com.bandimobile";

        try {
            List<CommDetail> details = commDetailRepository.findActiveDetailsByCommCd("APP_VERSION");
            if (details != null && !details.isEmpty()) {
                for (CommDetail d : details) {
                    String code = d.getCommDtlCd();
                    String val = d.getCommDtlNm() != null ? d.getCommDtlNm().trim() : "";
                    if ("IOS_VERSION_NAME".equalsIgnoreCase(code)) {
                        iosVersionName = val;
                    } else if ("IOS_VERSION_CODE".equalsIgnoreCase(code)) {
                        try { iosVersionCode = Integer.parseInt(val); } catch (Exception ignored) {}
                    } else if ("IOS_STORE_URL".equalsIgnoreCase(code)) {
                        iosStoreUrl = val;
                    } else if ("IOS_FORCE_UPDATE".equalsIgnoreCase(code)) {
                        iosForceUpdate = "Y".equalsIgnoreCase(val) || "TRUE".equalsIgnoreCase(val);
                    } else if ("ANDROID_VERSION_NAME".equalsIgnoreCase(code) || "VERSION_NAME".equalsIgnoreCase(code)) {
                        androidVersionName = val;
                    } else if ("ANDROID_VERSION_CODE".equalsIgnoreCase(code) || "VERSION_CODE".equalsIgnoreCase(code)) {
                        try { androidVersionCode = Integer.parseInt(val); } catch (Exception ignored) {}
                    } else if ("ANDROID_STORE_URL".equalsIgnoreCase(code) || "STORE_URL".equalsIgnoreCase(code)) {
                        androidStoreUrl = val;
                    } else if ("ANDROID_FORCE_UPDATE".equalsIgnoreCase(code) || "FORCE_UPDATE".equalsIgnoreCase(code)) {
                        androidForceUpdate = "Y".equalsIgnoreCase(val) || "TRUE".equalsIgnoreCase(val);
                    }
                }
            }
        } catch (Exception ignored) {}

        return ResponseEntity.ok(java.util.Map.of(
            // iOS 전용
            "iosVersionCode", iosVersionCode,
            "iosVersionName", iosVersionName,
            "iosForceUpdate", iosForceUpdate,
            "iosStoreUrl", iosStoreUrl,

            // Android 전용
            "androidVersionCode", androidVersionCode,
            "androidVersionName", androidVersionName,
            "androidForceUpdate", androidForceUpdate,
            "androidStoreUrl", androidStoreUrl,

            // 공통/하위 호환 필드
            "latestVersionCode", Math.max(iosVersionCode, androidVersionCode),
            "latestVersionName", iosVersionName,
            "forceUpdate", iosForceUpdate || androidForceUpdate,
            "storeUrl", androidStoreUrl
        ));
    }
}
