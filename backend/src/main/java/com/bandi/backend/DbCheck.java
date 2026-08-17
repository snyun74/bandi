package com.bandi.backend;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;

public class DbCheck {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://127.0.0.1:5432/bandi?sslmode=disable";
        String user = "postgres";
        String password = "admin0325";

        String[] targetTables = {"bn_partner", "bn_studio", "bn_studio_attachment", "bn_room", "bn_room_attachment", "bn_room_price", "bn_reservation"};

        try {
            Class.forName("org.postgresql.Driver");
            try (Connection conn = DriverManager.getConnection(url, user, password);
                 PrintWriter writer = new PrintWriter(new FileWriter("db_tables_schema.txt"))) {
                
                DatabaseMetaData metaData = conn.getMetaData();
                
                writer.println("=== Database Tables Schema Check ===");
                for (String table : targetTables) {
                    writer.println("\nTable: " + table);
                    
                    try (ResultSet tables = metaData.getTables(null, null, table, null)) {
                        if (tables.next()) {
                            writer.println("Status: EXISTS");
                            
                            try (ResultSet columns = metaData.getColumns(null, null, table, null)) {
                                while (columns.next()) {
                                    String columnName = columns.getString("COLUMN_NAME");
                                    String typeName = columns.getString("TYPE_NAME");
                                    int columnSize = columns.getInt("COLUMN_SIZE");
                                    String isNullable = columns.getString("IS_NULLABLE");
                                    writer.printf(" - Column: %s | Type: %s(%d) | Nullable: %s%n", 
                                            columnName, typeName, columnSize, isNullable);
                                }
                            }
                        } else {
                            try (ResultSet tablesUpper = metaData.getTables(null, null, table.toUpperCase(), null)) {
                                if (tablesUpper.next()) {
                                    writer.println("Status: EXISTS (uppercase)");
                                    try (ResultSet columns = metaData.getColumns(null, null, table.toUpperCase(), null)) {
                                        while (columns.next()) {
                                            String columnName = columns.getString("COLUMN_NAME");
                                            String typeName = columns.getString("TYPE_NAME");
                                            int columnSize = columns.getInt("COLUMN_SIZE");
                                            String isNullable = columns.getString("IS_NULLABLE");
                                            writer.printf(" - Column: %s | Type: %s(%d) | Nullable: %s%n", 
                                                    columnName, typeName, columnSize, isNullable);
                                        }
                                    }
                                } else {
                                    writer.println("Status: NOT FOUND");
                                }
                            }
                        }
                    }
                }
                System.out.println("Metadata dump complete. Saved to db_tables_schema.txt");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
