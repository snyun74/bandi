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
        // 최신 버전 정보 반환 (추후 DB화 가능)
        return ResponseEntity.ok(java.util.Map.of(
            "latestVersionCode", 21,
            "latestVersionName", "3.5",
            "forceUpdate", false,
            "storeUrl", "market://details?id=com.bandimobile",
            "iosStoreUrl", "itms-apps://itunes.apple.com/app/id6475653554" // iOS 앱 스토어 ID (확인 필요)
        ));
    }
}
