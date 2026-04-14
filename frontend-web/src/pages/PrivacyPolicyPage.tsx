import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface PrivacyPolicy {
    privacyAgreeVerId: string;
    privacyAgreeContent: string;
}

const PrivacyPolicyPage: React.FC = () => {
    const navigate = useNavigate();
    const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicy | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrivacyPolicy = async () => {
            try {
                const res = await fetch('/api/auth/privacy-policy');
                if (res.ok) {
                    const data = await res.json();
                    setPrivacyPolicy(data);
                }
            } catch (error) {
                console.error("Failed to fetch privacy policy", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrivacyPolicy();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-['Pretendard']">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-[16px] font-bold text-[#003C48] absolute left-1/2 -translate-x-1/2">
                        개인정보 처리방침
                    </h1>
                    <div className="w-10"></div> {/* Spacer for symmetry */}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-screen-md mx-auto bg-white min-h-[calc(100vh-3.5rem)] shadow-sm">
                <div className="px-5 py-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00BDF8] mb-4"></div>
                            <p className="text-[14px] text-gray-500">내용을 불러오는 중입니다...</p>
                        </div>
                    ) : privacyPolicy ? (
                        <div 
                            className="policy-content"
                            dangerouslySetInnerHTML={{ __html: privacyPolicy.privacyAgreeContent }} 
                        />
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-[14px] text-gray-500">활성화된 약관 내용이 없습니다.</p>
                        </div>
                    )}
                </div>
                
                {/* Footer Info */}
                <div className="px-5 py-10 border-t border-gray-100 bg-gray-50">
                    <p className="text-[12px] text-gray-400 text-center leading-relaxed">
                        본 페이지는 구글 플레이 스토어 및 서비스 약관 준수를 위해 제공되는<br/>
                        공식 개인정보 처리방침 페이지입니다.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
