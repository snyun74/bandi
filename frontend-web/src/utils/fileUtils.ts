/**
 * 파일 관련 공통 유틸리티 및 표준 업로드 API 모듈
 */

// 최대 파일 사이즈 (100MB)
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

export type FileCategoryType = 'profile' | 'board' | 'shorts' | 'sns' | 'chat' | 'clan' | 'band' | 'admin' | 'ambassador';

export interface UploadFileResult {
    attachNo: number;
    category: string;
    originalName: string;
    savedName: string;
    relativePath: string;
    fullUrl: string;
    fileSize: number;
    mimeType: string;
}

/**
 * 파일 사이즈 유효성 체크
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

/**
 * 단일 파일 표준 업로드 API (8대 도메인 카테고리 지원)
 */
export const uploadFileApi = async (
    file: File,
    category: FileCategoryType = 'board',
    userId?: string
): Promise<UploadFileResult> => {
    const sizeCheck = validateFileSize(file);
    if (!sizeCheck.isValid) {
        throw new Error(sizeCheck.message);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (userId) formData.append('userId', userId);

    const response = await fetch('/api/v1/files/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`업로드 통신 오류 (${response.status})`);
    }

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || '파일 업로드 실패');
    }
    return data.data;
};

/**
 * 다중 파일 표준 업로드 API
 */
export const uploadMultipleFilesApi = async (
    files: File[],
    category: FileCategoryType = 'board',
    userId?: string
): Promise<UploadFileResult[]> => {
    if (!files || files.length === 0) return [];

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('category', category);
    if (userId) formData.append('userId', userId);

    const response = await fetch('/api/v1/files/upload/multiple', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`다중 업로드 통신 오류 (${response.status})`);
    }

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || '다중 파일 업로드 실패');
    }
    return data.data;
};
