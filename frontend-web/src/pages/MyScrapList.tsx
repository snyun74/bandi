import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaRegThumbsUp, FaRegComment } from 'react-icons/fa';
import { BsPerson } from 'react-icons/bs';

interface MyScrapDto {
    scrapNo: number;
    scrapTableNm: string;
    scrapTablePkNo: number;
    param1: string | null;
    param2: string | null;
    title: string;
    writerName: string;
    likeCnt: number;
    replyCnt: number;
    scrapDate: string;
    originalRegDate: string;
}

const MyScrapList: React.FC = () => {
    const navigate = useNavigate();
    const [scraps, setScraps] = useState<MyScrapDto[]>([]);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchScraps = async () => {
            if (!userId) return;
            try {
                const res = await fetch(`/api/user/${userId}/scraps`);
                if (res.ok) {
                    const data = await res.json();
                    setScraps(data);
                }
            } catch (error) {
                console.error("Failed to fetch scraps", error);
            }
        };
        fetchScraps();
    }, [userId]);

    const handleScrapClick = (scrap: MyScrapDto) => {
        if (scrap.scrapTableNm === 'CM_BOARD') {
            navigate(`/main/board/detail/${scrap.scrapTablePkNo}`);
        } else if (scrap.scrapTableNm === 'CN_NOTICE') {
            navigate(`/main/clan/notice/${scrap.param1}/detail/${scrap.scrapTablePkNo}`);
        } else if (scrap.scrapTableNm === 'CN_BOARD') {
            navigate(`/main/clan/board/${scrap.param1}/${scrap.param2}/post/${scrap.scrapTablePkNo}`);
        }
    };

    const getLabelName = (tableName: string) => {
        switch (tableName) {
            case 'CM_BOARD': return '일반게시';
            case 'CN_NOTICE': return '클랜공지';
            case 'CN_BOARD': return '클랜게시';
            default: return '게시물';
        }
    };

    const getLabelColor = (tableName: string) => {
        switch (tableName) {
            case 'CM_BOARD': return 'text-blue-600 bg-blue-50';
            case 'CN_NOTICE': return 'text-red-600 bg-red-50';
            case 'CN_BOARD': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr;
        // yyyyMMdd -> yyyy.MM.dd
        return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 sticky top-0 bg-white z-10 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">내 스크랩</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    {scraps.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            스크랩한 항목이 없습니다.
                        </div>
                    ) : (
                        scraps.map((scrap, index) => (
                            <div
                                key={scrap.scrapNo}
                                onClick={() => handleScrapClick(scrap)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${index !== scraps.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 pr-4">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] mr-2 mb-1 ${getLabelColor(scrap.scrapTableNm)}`}>
                                            {getLabelName(scrap.scrapTableNm)}
                                        </span>
                                        <span className="text-[#003C48] font-bold text-sm leading-tight break-all">
                                            {scrap.title}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-gray-400 whitespace-nowrap mt-1">
                                        {formatDate(scrap.originalRegDate)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                        <BsPerson size={10} />
                                        <span>{scrap.writerName || '익명'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                        <FaRegThumbsUp size={10} />
                                        <span>({scrap.likeCnt || 0})</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                        <FaRegComment size={10} />
                                        <span>({scrap.replyCnt || 0})</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyScrapList;
