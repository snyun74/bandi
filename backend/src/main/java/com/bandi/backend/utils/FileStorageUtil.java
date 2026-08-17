package com.bandi.backend.utils;

public class FileStorageUtil {

    /**
     * 공통 최상위 uploads 루트 디렉토리 반환
     */
    public static String getBaseUploadDir() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            return System.getProperty("user.dir") + "\\uploads";
        } else {
            return "/home/ubuntu/bandi/uploads";
        }
    }

    /**
     * 레거시 이미지(common_images) 업로드 경로 반환
     */
    public static String getUploadDir() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            return System.getProperty("user.dir") + "\\uploads\\common_images";
        } else {
            return "/home/ubuntu/bandi/uploads/common_images";
        }
    }

    /**
     * 레거시 쇼츠 동영상(shorts) 업로드 경로 반환
     */
    public static String getShortsDir() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            return System.getProperty("user.dir") + "\\uploads\\shorts";
        } else {
            return "/home/ubuntu/bandi/uploads/shorts";
        }
    }
}
