import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaMinusCircle } from 'react-icons/fa';

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
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 mb-2">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-600">
                        <FaChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl text-[#003C48] font-bold">클랜 공지</h1>
                </div>
                {canCreateNotice && (
                    <button
                        className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold"
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
                    <div className="bg-[#4FC3F7] px-4 py-3">
                        <span className="text-white font-bold text-lg">공지</span>
                    </div>

                    {/* Notice List */}
                    <div className="p-4 space-y-3">
                        {notices.length > 0 ? (
                            notices.map((notice) => (
                                <div key={notice.cnNoticeNo} className="flex justify-between items-center">
                                    <span
                                        onClick={() => navigate(`/main/clan/notice/${clanId}/detail/${notice.cnNoticeNo}`)}
                                        className={`text-base font-medium flex items-center cursor-pointer hover:underline ${notice.pinYn === 'Y' ? 'text-[#00BDF8] font-bold' : 'text-[#003C48]'}`}
                                    >
                                        <span className="mr-2">•</span> {notice.title}
                                    </span>
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
