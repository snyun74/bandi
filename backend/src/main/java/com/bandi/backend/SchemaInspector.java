package com.bandi.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
public class SchemaInspector implements CommandLineRunner {

    private final DataSource dataSource;

    public SchemaInspector(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        java.io.File file = new java.io.File("schema_check.log");
        try (java.io.PrintWriter writer = new java.io.PrintWriter(file)) {
            writer.println("==================================================");
            writer.println(" SCHEMA INSPECTOR - CHECKING BN_CHAT_MESSAGE ");
            writer.println("==================================================");

            try (Connection conn = dataSource.getConnection();
                    Statement stmt = conn.createStatement()) {

                // Check columns for BN_CHAT_MESSAGE
                ResultSet rs = stmt.executeQuery(
                        "SELECT column_name, data_type, is_nullable " +
                                "FROM information_schema.columns " +
                                "WHERE table_name = 'bn_chat_message' " + // PostgreSQL stores table names in lowercase
                                                                          // usually, or check case sensitivity
                                "ORDER BY ordinal_position");

                boolean found = false;
                while (rs.next()) {
                    found = true;
                    String colName = rs.getString("column_name");
                    String dataType = rs.getString("data_type");
                    String isNullable = rs.getString("is_nullable");
                    writer.println("COLUMN: " + colName + " | TYPE: " + dataType + " | NULLABLE: " + isNullable);
                }

                if (!found) {
                    // Try upper case if not found
                    rs = stmt.executeQuery(
                            "SELECT column_name, data_type, is_nullable " +
                                    "FROM information_schema.columns " +
                                    "WHERE table_name = 'BN_CHAT_MESSAGE' " +
                                    "ORDER BY ordinal_position");
                    while (rs.next()) {
                        found = true;
                        String colName = rs.getString("column_name");
                        String dataType = rs.getString("data_type");
                        String isNullable = rs.getString("is_nullable");
                        writer.println(
                                "COLUMN (Upper): " + colName + " | TYPE: " + dataType + " | NULLABLE: " + isNullable);
                    }
                }

                if (!found) {
                    writer.println("TABLE 'BN_CHAT_MESSAGE' NOT FOUND IN INFORMATION_SCHEMA");
                }

                writer.println("==================================================");

                // Also check BN_CHAT_MESSAGE_READ
                writer.println(" CHECKING BN_CHAT_MESSAGE_READ ");
                rs = stmt.executeQuery(
                        "SELECT column_name, data_type, is_nullable " +
                                "FROM information_schema.columns " +
                                "WHERE table_name = 'bn_chat_message_read' " +
                                "ORDER BY ordinal_position");
                while (rs.next()) {
                    String colName = rs.getString("column_name");
                    writer.println("COLUMN: " + colName);
                }
                writer.println("==================================================");

            } catch (Exception e) {
                writer.println("SCHEMA INSPECT ERROR: " + e.getMessage());
                e.printStackTrace(writer);
            }
        }
    }
}
