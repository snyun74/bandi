package com.bandi.backend.utils;

public class FileStorageUtil {

    /**
     * Returns the upload directory based on the operating system.
     * On Windows (local environment), it returns a path relative to the user
     * directory.
     * On Linux (server environment), it returns the absolute server path.
     *
     * @return The absolute path to the designated upload directory.
     */
    public static String getUploadDir() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            // Local Windows environment
            return System.getProperty("user.dir") + "\\uploads\\common_images";
        } else {
            // Server Linux environment
            return "/home/ubuntu/bandi/dist/common_images";
        }
    }
}
