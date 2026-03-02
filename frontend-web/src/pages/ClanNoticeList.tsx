import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaMinusCircle } from 'react-icons/fa';
import SectionTitle from '../components/common/SectionTitle';

interface NoticeItem {
    cnNoticeNo: number;
    title: string;
    pinYn: string;
    insDtime: string;
}

const ClanNoticeList: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();
    const [notices, setNotices] = useState<NoticeItem[]>([]);
    const [userRole, setUserRole] = useState<string>(''); // 01: Leader, 02: Executive
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (clanId) {
            // Fetch Notices
            fetch(`/api/clans/${clanId}/notices`)
                .then(res => res.json())
                .then(data => setNotices(data))
                .catch(err => console.error("Failed to fetch notices", err));

            // Fetch User Role for this specific clan
            if (userId) {
                fetch(`/api/clans/${clanId}/members/${userId}/role`)
                    .then(res => {
                        if (res.ok) return res.text();
                        return '';
                    })
                    .then(role => {
                        console.log("Fetched Role:", role); // for debugging
                        setUserRole(role);
                    })
                    .catch(err => {
                        console.error("Failed to fetch role", err);
                        setUserRole('');
                    });
            }
        }
    }, [clanId, userId]);

    // Role check helper
    const canCreateNotice = ['01', '02'].includes(userRole);

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 mb-2">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-[#052c42]">
                        <FaChevronLeft size={24} />
                    </button>
                    <SectionTitle as="h1" className="!mt-0 !mb-0">클랜 공지</SectionTitle>
                </div>
                {canCreateNotice && (
                    <button
                        className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-[14px] font-bold"
                        onClick={() => navigate(`/main/clan/notice/${clanId}/create`)}
                    >
                        공지 생성
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="px-4 pb-20">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* List Header */}
                    <div className="bg-[#00BDF8] px-4 py-3 border-b border-[#009dc4]">
                        <SectionTitle as="h2" className="text-white !mt-0 !mb-0">공지</SectionTitle>
                    </div>

                    {/* Notice List */}
                    <div className="p-4 space-y-3">
                        {notices.length > 0 ? (
                            notices.map((notice: NoticeItem) => (
                                <div key={notice.cnNoticeNo} className="flex justify-between items-center">
                                    <div
                                        onClick={() => navigate(`/main/clan/notice/${clanId}/detail/${notice.cnNoticeNo}`)}
                                        className="flex items-center cursor-pointer group"
                                    >
                                        <span className={`mr-2 ${notice.pinYn === 'Y' ? 'font-bold' : ''}`}>•</span>
                                        <SectionTitle
                                            as="h3"
                                            className={`!mt-0 !mb-0 text-base group-hover:underline ${notice.pinYn === 'Y' ? 'font-bold' : 'font-medium'} text-[#003C48]`}
                                        >
                                            {notice.title}
                                        </SectionTitle>
                                    </div>
                                    {canCreateNotice && (
                                        <button className="text-[#FF8A80] hover:text-[#ff5252]">
                                            <FaMinusCircle size={20} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-4">등록된 공지가 없습니다.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClanNoticeList;
