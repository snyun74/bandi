package com.bandi.backend.utils;

public class FileStorageUtil {

    /**
     * 이미지(common_images) 업로드 경로 반환
     */
    public static String getUploadDir() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            // 로컬 윈도우: 프로젝트 루트의 uploads 폴더
            return System.getProperty("user.dir") + "\\uploads\\common_images";
        } else {
            // AWS 리눅스: dist/common_images (사용자 확인 경로)
            return "/home/ubuntu/bandi/dist/common_images";
        }
    }

    /**
     * 쇼츠 동영상(shorts) 업로드 경로 반환
     */
    public static String getShortsDir() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            // 로컬 윈도우: 기존 하드코딩된 경로 유지 (또는 프로젝트 상대경로)
            return "d:/Project/bandi/frontend-web/public/shorts";
        } else {
            // AWS 리눅스: dist/shorts (사용자 확인 경로)
            return "/home/ubuntu/bandi/dist/shorts";
        }
    }
}
