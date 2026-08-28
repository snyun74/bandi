package com.bandi.backend.service;

import com.bandi.backend.entity.band.BnStudioDir;
import com.bandi.backend.repository.BnStudioDirRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudioDirectoryService {

    private final BnStudioDirRepository studioDirRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${kakao.client-id}")
    private String kakaoRestApiKey;

    private static final String KAKAO_KEYWORD_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

    /**
     * 우리 자체 DB에서 합주실 검색 (사용자용: useYn = 'Y')
     */
    @Transactional(readOnly = true)
    public Page<BnStudioDir> searchDirectory(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (keyword == null || keyword.trim().isEmpty()) {
            return studioDirRepository.findByUseYnOrderByLatest(pageable);
        }
        return studioDirRepository.searchByKeyword(keyword.trim(), pageable);
    }

    /**
     * 관리자용 전체 합주실 목록 검색 및 조회 (useYn 전체, 최신 갱신일시 순)
     */
    @Transactional(readOnly = true)
    public Page<BnStudioDir> searchDirectoryForAdmin(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String cleanKw = keyword != null ? keyword.trim() : "";
        return studioDirRepository.findAllForAdmin(cleanKw, pageable);
    }

    /**
     * 관리자용: 사용 여부(Y/N) 토글/변경
     */
    @Transactional
    public BnStudioDir updateUseYn(Long dirNo, String useYn) {
        BnStudioDir dir = studioDirRepository.findById(dirNo)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 합주실입니다. dirNo: " + dirNo));
        dir.setUseYn("N".equalsIgnoreCase(useYn) ? "N" : "Y");
        dir.setUpdDtime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        dir.setUpdId("ADMIN");
        return studioDirRepository.save(dir);
    }

    /**
     * 상호명 + 도로명주소(또는 지번주소) 기준 중복 데이터 정리 (중복건 중 1건만 유지)
     */
    @Transactional
    public int cleanDuplicates() {
        List<BnStudioDir> all = studioDirRepository.findAll();
        Map<String, BnStudioDir> uniqueMap = new HashMap<>();
        List<BnStudioDir> toDelete = new ArrayList<>();

        for (BnStudioDir dir : all) {
            String cleanName = dir.getStudioNm() != null ? dir.getStudioNm().replaceAll("\\s+", "").toLowerCase() : "";
            String cleanRoadAddr = dir.getRoadAddress() != null ? dir.getRoadAddress().replaceAll("\\s+", "").toLowerCase() : "";
            String cleanJibunAddr = dir.getJibunAddress() != null ? dir.getJibunAddress().replaceAll("\\s+", "").toLowerCase() : "";

            String key = cleanName + "___" + (!cleanRoadAddr.isBlank() ? cleanRoadAddr : cleanJibunAddr);

            if (uniqueMap.containsKey(key)) {
                toDelete.add(dir);
            } else {
                uniqueMap.put(key, dir);
            }
        }

        if (!toDelete.isEmpty()) {
            studioDirRepository.deleteAll(toDelete);
            log.info("[cleanDuplicates] Deleted {} duplicate studio records.", toDelete.size());
        }

        return toDelete.size();
    }

    /**
     * 카카오 로컬 키워드 검색 API를 통한 합주실 수집/저장 (Upsert)
     */
    @Transactional
    public Map<String, Object> syncFromKakaoByKeyword(String query) {
        int savedCount = 0;
        int updatedCount = 0;
        int totalFound = 0;

        try {
            for (int page = 1; page <= 3; page++) {
                URI uri = UriComponentsBuilder.fromUriString(KAKAO_KEYWORD_SEARCH_URL)
                        .queryParam("query", query)
                        .queryParam("size", 15)
                        .queryParam("page", page)
                        .build()
                        .encode()
                        .toUri();

                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
                ResponseEntity<Map> response = restTemplate.exchange(uri, HttpMethod.GET, requestEntity, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> body = response.getBody();
                    Map<String, Object> meta = (Map<String, Object>) body.get("meta");
                    if (meta != null && meta.get("total_count") instanceof Number) {
                        totalFound = ((Number) meta.get("total_count")).intValue();
                    }

                    List<Map<String, Object>> documents = (List<Map<String, Object>>) body.get("documents");
                    String nowDtime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

                    if (documents != null && !documents.isEmpty()) {
                        for (Map<String, Object> doc : documents) {
                            String placeName = String.valueOf(doc.getOrDefault("place_name", "")).trim();
                            String roadAddress = String.valueOf(doc.getOrDefault("road_address_name", "")).trim();
                            String address = String.valueOf(doc.getOrDefault("address_name", "")).trim();
                            String phone = String.valueOf(doc.getOrDefault("phone", "")).trim();
                            String category = String.valueOf(doc.getOrDefault("category_name", "")).trim();
                            String placeUrl = String.valueOf(doc.getOrDefault("place_url", "")).trim();
                            String x = String.valueOf(doc.getOrDefault("x", "")).trim();
                            String y = String.valueOf(doc.getOrDefault("y", "")).trim();

                            if (placeName.isBlank() || "null".equals(placeName)) continue;
                            if ("null".equals(roadAddress)) roadAddress = "";
                            if ("null".equals(address)) address = "";
                            if ("null".equals(phone)) phone = "";
                            if ("null".equals(category)) category = "";
                            if ("null".equals(placeUrl)) placeUrl = "";
                            if ("null".equals(x)) x = "";
                            if ("null".equals(y)) y = "";

                            // 주소에서 시/도, 시/군/구, 읍/면/동 분리
                            String sido = "";
                            String sigungu = "";
                            String dong = "";

                            String targetAddr = !roadAddress.isBlank() ? roadAddress : address;
                            if (!targetAddr.isBlank()) {
                                String[] parts = targetAddr.split(" ");
                                if (parts.length > 0) sido = parts[0];
                                if (parts.length > 1) sigungu = parts[1];
                                if (parts.length > 2) dong = parts[2];
                            }

                            // 네이버 플레이스 바로가기 URL 생성 (상호명 + 지역구/시)
                            String naverSearchQuery = placeName;
                            if (!sigungu.isBlank()) {
                                naverSearchQuery += " " + sigungu;
                            } else if (!sido.isBlank()) {
                                naverSearchQuery += " " + sido;
                            }
                            String naverLinkUrl = "https://m.map.naver.com/search2/search.naver?query=" 
                                    + java.net.URLEncoder.encode(naverSearchQuery, java.nio.charset.StandardCharsets.UTF_8);

                            // 중복 체크 및 저장
                            Optional<BnStudioDir> existingOpt = Optional.empty();
                            if (!roadAddress.isBlank()) {
                                existingOpt = studioDirRepository.findByStudioNmAndRoadAddress(placeName, roadAddress);
                            }

                            BnStudioDir studioDir;
                            if (existingOpt.isPresent()) {
                                studioDir = existingOpt.get();
                                studioDir.setJibunAddress(address);
                                studioDir.setTelephone(phone);
                                studioDir.setCategoryNm(category);
                                studioDir.setLinkUrl(naverLinkUrl);
                                if (!x.isBlank()) studioDir.setMapX(x);
                                if (!y.isBlank()) studioDir.setMapY(y);
                                studioDir.setSido(sido);
                                studioDir.setSigungu(sigungu);
                                studioDir.setDong(dong);
                                studioDir.setUpdDtime(nowDtime);
                                studioDir.setUpdId("KAKAO_SYNC");
                                updatedCount++;
                            } else {
                                studioDir = new BnStudioDir();
                                studioDir.setStudioNm(placeName);
                                studioDir.setRoadAddress(roadAddress);
                                studioDir.setJibunAddress(address);
                                studioDir.setTelephone(phone);
                                studioDir.setCategoryNm(category);
                                studioDir.setLinkUrl(naverLinkUrl);
                                studioDir.setMapX(x);
                                studioDir.setMapY(y);
                                studioDir.setSido(sido);
                                studioDir.setSigungu(sigungu);
                                studioDir.setDong(dong);
                                studioDir.setSourceCd("KAKAO");
                                studioDir.setUseYn("Y");
                                studioDir.setInsDtime(nowDtime);
                                studioDir.setInsId("KAKAO_SYNC");
                                studioDirRepository.save(studioDir);
                                savedCount++;
                            }
                        }
                    }

                    Boolean isEnd = meta != null ? (Boolean) meta.get("is_end") : true;
                    if (Boolean.TRUE.equals(isEnd)) {
                        break;
                    }
                }
            }
        } catch (Exception e) {
            log.error("[syncFromKakaoByKeyword] Failed for query: {}", query, e);
            throw new RuntimeException("카카오 로컬 API 수집 중 오류: " + e.getMessage(), e);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("query", query);
        result.put("totalFound", totalFound);
        result.put("savedCount", savedCount);
        result.put("updatedCount", updatedCount);
        return result;
    }

    /**
     * 전국 주요 지역별 "합주실" 키워드 일괄 수집
     */
    @Transactional
    public Map<String, Object> syncNationwideStudios() {
        String[] keywords = {
                // 서울 주요 거점 및 구별
                "합주실", "홍대 합주실", "신촌 합주실", "합정 합주실", "망원 합주실", "강남 합주실", "서초 합주실", "교대 합주실", "양재 합주실",
                "마포구 합주실", "영등포 합주실", "여의도 합주실", "문래 합주실", "당산 합주실", "구로 합주실", "신도림 합주실", "가산 합주실",
                "관악구 합주실", "서울대입구 합주실", "신림 합주실", "사당 합주실", "이수 합주실", "동작구 합주실",
                "종로 합주실", "혜화 합주실", "대학로 합주실", "동대문 합주실", "성동구 합주실", "성수 합주실", "왕십리 합주실",
                "광진구 합주실", "건대 합주실", "군자 합주실", "구의 합주실", "송파구 합주실", "잠실 합주실", "문정 합주실", "강동구 합주실", "천호 합주실",
                "중랑구 합주실", "노원구 합주실", "도봉구 합주실", "수유 합주실", "미아 합주실", "강북구 합주실", "성북구 합주실", "안암 합주실",
                "서대문구 합주실", "은평구 합주실", "연신내 합주실", "불광 합주실", "강서구 합주실", "화곡 합주실", "발산 합주실", "마곡 합주실",
                "양천구 합주실", "목동 합주실", "용산 합주실", "이태원 합주실", "한남동 합주실",

                // 경기도 / 인천
                "수원 합주실", "인계동 합주실", "영통 합주실", "성남 합주실", "분당 합주실", "서현 합주실", "야탑 합주실", "판교 합주실",
                "부천 합주실", "부천역 합주실", "상동 합주실", "중동 합주실", "고양 합주실", "일산 합주실", "화정 합주실", "백석 합주실",
                "안양 합주실", "범계 합주실", "평촌 합주실", "안산 합주실", "중앙동 합주실", "용인 합주실", "기흥 합주실", "수지 합주실",
                "평택 합주실", "화성 합주실", "동탄 합주실", "시흥 합주실", "광명 합주실", "철산 합주실", "군포 합주실", "산본 합주실",
                "하남 합주실", "미사 합주실", "구리 합주실", "남양주 합주실", "다산 합주실", "의정부 합주실", "파주 합주실", "김포 합주실",
                "인천 합주실", "부평 합주실", "구월동 합주실", "주안 합주실", "송도 합주실", "청라 합주실", "연수구 합주실",

                // 주요 광역시 및 지방 도시
                "부산 합주실", "서면 합주실", "부산대 합주실", "해운대 합주실", "남포동 합주실", "경성대 합주실", "동래 합주실",
                "대구 합주실", "동성로 합주실", "대명동 합주실", "수성구 합주실", "경북대 합주실",
                "대전 합주실", "둔산동 합주실", "궁동 합주실", "유성 합주실", "은행동 합주실",
                "광주 합주실", "충장로 합주실", "상무지구 합주실", "전남대 합주실",
                "울산 합주실", "삼산동 합주실", "성남동 합주실",
                "세종 합주실", "천안 합주실", "신부동 합주실", "아산 합주실", "청주 합주실", "성안길 합주실",
                "전주 합주실", "객사 합주실", "전북대 합주실", "군산 합주실", "익산 합주실",
                "포항 합주실", "구미 합주실", "경주 합주실", "창원 합주실", "상남동 합주실", "김해 합주실", "진주 합주실",
                "춘천 합주실", "원주 합주실", "강릉 합주실", "제주 합주실", "제주시 합주실", "서귀포 합주실"
        };

        int totalSaved = 0;
        int totalUpdated = 0;
        List<String> failedKeywords = new ArrayList<>();

        for (String kw : keywords) {
            try {
                Map<String, Object> res = syncFromKakaoByKeyword(kw);
                totalSaved += (Integer) res.getOrDefault("savedCount", 0);
                totalUpdated += (Integer) res.getOrDefault("updatedCount", 0);
                Thread.sleep(60); // 60ms 간격으로 카카오 API 호출
            } catch (Exception e) {
                log.warn("[syncNationwideStudios] Keyword '{}' failed: {}", kw, e.getMessage());
                failedKeywords.add(kw);
            }
        }

        int deletedDuplicates = cleanDuplicates();
        long currentTotalCount = studioDirRepository.count();

        Map<String, Object> finalResult = new HashMap<>();
        finalResult.put("processedKeywordsCount", keywords.length);
        finalResult.put("totalSaved", totalSaved);
        finalResult.put("totalUpdated", totalUpdated);
        finalResult.put("deletedDuplicates", deletedDuplicates);
        finalResult.put("currentTotalCountInDb", currentTotalCount);
        finalResult.put("failedKeywords", failedKeywords);
        return finalResult;
    }

    /**
     * DB에 저장된 모든 합주실의 링크를 네이버 플레이스 링크로 일괄 갱신
     */
    @Transactional
    public Map<String, Object> updateAllLinksToNaver() {
        List<BnStudioDir> list = studioDirRepository.findAll();
        int updatedCount = 0;
        String nowDtime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        for (BnStudioDir dir : list) {
            String name = dir.getStudioNm() != null ? dir.getStudioNm() : "";
            String sigungu = dir.getSigungu() != null ? dir.getSigungu() : "";
            String sido = dir.getSido() != null ? dir.getSido() : "";

            String naverSearchQuery = name;
            if (!sigungu.isBlank()) {
                naverSearchQuery += " " + sigungu;
            } else if (!sido.isBlank()) {
                naverSearchQuery += " " + sido;
            }

            String naverLinkUrl = "https://m.map.naver.com/search2/search.naver?query=" 
                    + java.net.URLEncoder.encode(naverSearchQuery, java.nio.charset.StandardCharsets.UTF_8);

            dir.setLinkUrl(naverLinkUrl);
            dir.setUpdDtime(nowDtime);
            dir.setUpdId("NAVER_LINK_BATCH");
            updatedCount++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalUpdated", updatedCount);
        return result;
    }
}
