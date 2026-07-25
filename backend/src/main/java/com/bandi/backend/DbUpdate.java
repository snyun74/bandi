package com.bandi.backend;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbUpdate {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://127.0.0.1:5432/bandi?sslmode=disable";
        String user = "postgres";
        String password = "admin0325";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            String sql = "ALTER TABLE bn_studio ADD COLUMN IF NOT EXISTS zipcode VARCHAR(20)";
            stmt.executeUpdate(sql);
            System.out.println("Added zipcode column to bn_studio table.");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
