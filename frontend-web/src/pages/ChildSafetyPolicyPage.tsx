import React from 'react';
import { useNavigate } from 'react-router-dom';

const ChildSafetyPolicyPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 font-['Pretendard'] text-gray-800">
            {/* Top Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
                        aria-label="뒤로가기"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-[16px] font-bold text-[#003C48] absolute left-1/2 -translate-x-1/2">
                        아동 안전 및 보호 표준
                    </h1>
                    <div className="w-10"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-screen-md mx-auto bg-white min-h-[calc(100vh-3.5rem)] shadow-sm px-6 py-8">
                {/* Header Title */}
                <div className="border-b border-gray-100 pb-6 mb-6">
                    <span className="inline-block bg-blue-50 text-[#0088B8] text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                        Google Play 안전 표준 준수
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        밴디콘(BANDICON) 아동 안전 및 보호 표준
                    </h2>
                    <p className="text-sm text-gray-500">
                        최종 개정일: 2026년 9월 9일 | 적용 대상: 밴디콘(BANDICON) 서비스 전체
                    </p>
                </div>

                {/* Section 1: Policy Overview */}
                <section className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-[#00BDF8] rounded-full mr-2"></span>
                        1. 기본 원칙 및 무관용 정책 (Zero Tolerance)
                    </h3>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-900 leading-relaxed mb-3">
                        <strong>밴디콘(BANDICON)</strong>은 모든 형태의 **아동 성적 학대 및 착취(CSAE, Child Sexual Abuse and Exploitation)**와 **아동 성 착취물(CSAM, Child Sexual Abuse Material)**에 대해 **절대 무관용 원칙(Zero-Tolerance Policy)**을 적용합니다.
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        밴디콘은 미성년자를 대상으로 하거나 이를 묘사·조장·유인하는 모든 유해 콘텐츠 및 행위를 엄격히 금지하며, 아동 및 청소년이 안전하게 음악과 밴드 문화를 즐길 수 있는 커뮤니티 환경을 유지하는 것을 최우선 과제로 삼습니다.
                    </p>
                </section>

                {/* Section 2: Prohibited Conduct */}
                <section className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-[#00BDF8] rounded-full mr-2"></span>
                        2. 명시적 금지 행위 및 콘텐츠 (CSAE/CSAM)
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <li>아동·청소년 성 착취물(사진, 영상, 음성, 그림, 텍스트 등)의 제작, 소지, 배포, 판매, 전송, 중개 또는 공유 행위</li>
                        <li>미성년자를 대상으로 한 성적 그루밍(온라인 길들이기), 성적 접촉 유도, 부적절한 대화 및 만남 요구 행위</li>
                        <li>미성년자의 신체적·정신적 학대, 성적 대상화 또는 착취를 조장하는 모든 커뮤니티 게시물 및 채팅</li>
                        <li>기타 국내외 아동 보호 관련 법률 및 구글 플레이(Google Play) 정책에 위배되는 일체의 아동 위해 행위</li>
                    </ul>
                </section>

                {/* Section 3: Enforcement & Penalties */}
                <section className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-[#00BDF8] rounded-full mr-2"></span>
                        3. 위반 시 조치 및 사법 기관 공조
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        밴디콘 내에서 아동 성적 학대 및 착취 관련 위반 사항이 감지되거나 신고될 경우, 밴디콘 운영진은 다음과 같은 즉각적인 조치를 취합니다:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2 leading-relaxed pl-1">
                        <li><strong>즉각적인 콘텐츠 영구 삭제 및 격리 조치</strong></li>
                        <li><strong>해당 계정에 대한 즉시 서비스 이용 영구 정지 및 디바이스 차단</strong></li>
                        <li><strong>관할 수사기관(경찰청 사이버수사국 등) 및 NCMEC 등 관련 아동 안전 전문 기관에 즉시 신고 및 데이터 제공</strong></li>
                    </ol>
                </section>

                {/* Section 4: In-App Reporting */}
                <section className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-[#00BDF8] rounded-full mr-2"></span>
                        4. 인앱 신고 및 모니터링 체계
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        밴디콘은 모든 게시글, 댓글, 채팅방 내에서 사용자가 위험 요소를 즉시 제보할 수 있도록 **[신고하기]** 기능을 기본 제공하고 있습니다. 접수된 모든 신고는 아동 보호 우선순위에 따라 24시간 이내에 검토 및 신속 처리됩니다.
                    </p>
                </section>

                {/* Section 5: Child Safety Contact */}
                <section className="mb-10">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-[#00BDF8] rounded-full mr-2"></span>
                        5. 아동 안전 전담 담당자 및 문의/신고처
                    </h3>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 text-sm text-gray-800">
                        <p className="mb-2">
                            아동 안전 정책과 관련된 문의 또는 즉각적인 조치가 필요한 사안이 있으시면 아래 전담 창구로 연락 주시기 바랍니다:
                        </p>
                        <div className="space-y-1.5 pt-2 border-t border-blue-100 text-gray-700">
                            <div><strong className="text-gray-900">앱 명칭:</strong> 밴디콘 (BANDICON)</div>
                            <div><strong className="text-gray-900">운영/개발:</strong> 밴디콘 운영팀</div>
                            <div><strong className="text-gray-900">아동 안전 보호 담당자:</strong> snyun74</div>
                            <div>
                                <strong className="text-gray-900">공식 신고 이메일:</strong>{' '}
                                <a href="mailto:snyun74@gmail.com" className="text-[#0088B8] font-medium underline">
                                    snyun74@gmail.com
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Notice */}
                <div className="pt-8 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        본 안전 표준은 구글 플레이(Google Play)의 아동 안전 표준 정책(Child Safety Standards) 및 관련 법령을 엄격히 준수합니다.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChildSafetyPolicyPage;
