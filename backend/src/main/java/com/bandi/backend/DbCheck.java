package com.bandi.backend;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheck {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://127.0.0.1:5432/bandi?sslmode=disable";
        String user = "postgres";
        String password = "admin0325";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            String sql = "SELECT privacy_agree_content FROM mm_privacy_agree_info WHERE privacy_stat_cd = 'A'";
            ResultSet rs = stmt.executeQuery(sql);
            
            if (rs.next()) {
                System.out.println("--- PRIVACY POLICY CONTENT ---");
                System.out.println(rs.getString("privacy_agree_content"));
                System.out.println("--- END ---");
            } else {
                System.out.println("No active privacy policy found.");
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
