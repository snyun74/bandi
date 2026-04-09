package com.bandi.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. 공통 이미지 핸들러 (common_images)
        String uploadDir = com.bandi.backend.utils.FileStorageUtil.getUploadDir();
        String uploadPath = Paths.get(uploadDir).toAbsolutePath().toUri().toString();
        if (!uploadPath.endsWith("/")) uploadPath += "/";

        registry.addResourceHandler("/api/common_images/**")
                .addResourceLocations(uploadPath);

        // 2. 쇼츠 동영상 핸들러 (shorts)
        String shortsDir = com.bandi.backend.utils.FileStorageUtil.getShortsDir();
        String shortsPath = Paths.get(shortsDir).toAbsolutePath().toUri().toString();
        if (!shortsPath.endsWith("/")) shortsPath += "/";

        registry.addResourceHandler("/api/shorts/**")
                .addResourceLocations(shortsPath);
    }
}
