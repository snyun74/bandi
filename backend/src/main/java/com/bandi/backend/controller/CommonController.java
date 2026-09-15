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
        String iosStoreUrl = "https://apps.apple.com/app/id6779875361";

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

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("iosVersionCode", iosVersionCode);
        response.put("iosVersionName", iosVersionName);
        response.put("iosForceUpdate", iosForceUpdate);
        response.put("iosStoreUrl", iosStoreUrl);

        response.put("androidVersionCode", androidVersionCode);
        response.put("androidVersionName", androidVersionName);
        response.put("androidForceUpdate", androidForceUpdate);
        response.put("androidStoreUrl", androidStoreUrl);

        response.put("latestVersionCode", Math.max(iosVersionCode, androidVersionCode));
        response.put("latestVersionName", iosVersionName);
        response.put("forceUpdate", iosForceUpdate || androidForceUpdate);
        response.put("storeUrl", androidStoreUrl);

        return ResponseEntity.ok(response);
    }
}
