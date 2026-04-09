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
            // AWS 리눅스: 운영 서버 실제 배포 폴더 (dist)
            return "/home/ubuntu/bandi/dist/common_images";
        }
    }

    /**
     * 쇼츠 동영상(shorts) 업로드 경로 반환
     */
    public static String getShortsDir() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            // 로컬 윈도우: 개발용 폴더
            return "d:/Project/bandi/frontend-web/public/shorts";
        } else {
            // AWS 리눅스: 운영 서버 실제 배포 폴더 (dist/shorts)
            return "/home/ubuntu/bandi/dist/shorts";
        }
    }
}
