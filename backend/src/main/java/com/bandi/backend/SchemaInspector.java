package com.bandi.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.io.PrintWriter;
import java.io.File;

@Component
public class SchemaInspector implements CommandLineRunner {

    private final DataSource dataSource;

    public SchemaInspector(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        File file = new File("schema_check.log");
        try (PrintWriter writer = new PrintWriter(file)) {
            writer.println("==================================================");
            writer.println(" SCHEMA INSPECTOR - BANDI MASTER TABLES CHECK ");
            writer.println("==================================================");

            String[] targetTables = {"bn_partner", "bn_studio", "bn_room", "bn_room_price", "bn_reservation"};

            try (Connection conn = dataSource.getConnection()) {
                DatabaseMetaData metaData = conn.getMetaData();
                for (String table : targetTables) {
                    writer.println("\nTable: " + table);
                    
                    // check in lowercase and uppercase
                    boolean exists = false;
                    String actualTableName = table;
                    
                    try (ResultSet tables = metaData.getTables(null, null, table, null)) {
                        if (tables.next()) {
                            exists = true;
                        }
                    }
                    
                    if (!exists) {
                        try (ResultSet tablesUpper = metaData.getTables(null, null, table.toUpperCase(), null)) {
                            if (tablesUpper.next()) {
                                exists = true;
                                actualTableName = table.toUpperCase();
                            }
                        }
                    }

                    if (exists) {
                        writer.println("Status: EXISTS");
                        try (ResultSet columns = metaData.getColumns(null, null, actualTableName, null)) {
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
                    writer.println("--------------------------------------------------");
                }
            } catch (Exception e) {
                writer.println("SCHEMA INSPECT ERROR: " + e.getMessage());
                e.printStackTrace(writer);
            }
            writer.println("==================================================");
        }
        System.out.println("Schema check written to schema_check.log");
    }
}
