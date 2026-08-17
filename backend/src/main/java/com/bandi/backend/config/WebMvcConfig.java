package com.bandi.backend.config;

import com.bandi.backend.utils.FileStorageUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String baseUploadDir = FileStorageUtil.getBaseUploadDir();
        String baseUploadPath = Paths.get(baseUploadDir).toAbsolutePath().toUri().toString();
        if (!baseUploadPath.endsWith("/")) baseUploadPath += "/";

        // 1. 공통 통합 uploads 핸들러
        registry.addResourceHandler("/uploads/**").addResourceLocations(baseUploadPath);
        registry.addResourceHandler("/api/uploads/**").addResourceLocations(baseUploadPath);

        // 2. 9개 도메인 개별 상대 경로 바로 접근 지원 핸들러 (/shorts/**, /sns/**, /profile/**, /ambassador/** 등)
        String[] domains = {"profile", "board", "shorts", "sns", "chat", "clan", "band", "admin", "ambassador"};
        for (String domain : domains) {
            String domainPath = Paths.get(baseUploadDir, domain).toAbsolutePath().toUri().toString();
            if (!domainPath.endsWith("/")) domainPath += "/";
            
            registry.addResourceHandler("/" + domain + "/**").addResourceLocations(domainPath);
            registry.addResourceHandler("/api/" + domain + "/**").addResourceLocations(domainPath);
        }

        // 3. 레거시 경로 호환용 핸들러 (common_images, legacy shorts)
        String commonDir = FileStorageUtil.getUploadDir();
        String commonPath = Paths.get(commonDir).toAbsolutePath().toUri().toString();
        if (!commonPath.endsWith("/")) commonPath += "/";

        registry.addResourceHandler("/api/common_images/**").addResourceLocations(commonPath);
        registry.addResourceHandler("/common_images/**").addResourceLocations(commonPath);
    }
}
