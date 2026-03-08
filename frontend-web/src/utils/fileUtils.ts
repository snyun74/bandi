/**
 * 파일 관련 공통 유틸리티
 */

// 최대 파일 사이즈 (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * 파일 사이즈가 유효한지 체크합니다.
 * @param file 체크할 파일 객체
 * @param maxSize 최대 허용 사이즈 (기본값 50MB)
 * @returns { isValid: boolean, message: string }
 */
export const validateFileSize = (file: File, maxSize: number = MAX_FILE_SIZE) => {
    if (file.size > maxSize) {
        return {
            isValid: false,
            message: `파일 크기는 ${maxSize / (1024 * 1024)}MB를 초과할 수 없습니다.`
        };
    }
    return {
        isValid: true,
        message: ''
    };
};
