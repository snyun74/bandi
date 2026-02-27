package com.bandi.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Use FileStorageUtil to get the base path and convert to valid Spring file:///
        // URI
        String uploadDir = com.bandi.backend.utils.FileStorageUtil.getUploadDir();
        String uploadPath = Paths.get(uploadDir).toAbsolutePath().toUri().toString();

        // Resource locations MUST end with a trailing slash!
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }

        registry.addResourceHandler("/api/common_images/**")
                .addResourceLocations(uploadPath);
    }
}
