package com.bandi.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import jakarta.annotation.PostConstruct;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        System.out.println("DEBUG: Initializing Firebase...");
        try {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials
                            .fromStream(new ClassPathResource("firebase-service-account.json").getInputStream()))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("SUCCESS: FirebaseApp has been initialized successfully.");
            } else {
                System.out.println("INFO: FirebaseApp already initialized.");
            }
        } catch (IOException e) {
            System.err.println("CRITICAL ERROR: Failed to load firebase-service-account.json. Firebase will not work!");
            System.err.println("Error Message: " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR: Unexpected error during Firebase initialization.");
            e.printStackTrace();
        }
    }
}
