import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaPlus, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

const PartnerManagePage: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const [partner, setPartner] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'studio' | 'room' | 'price' | 'approve'>('studio');

    // UI Feedback Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

    // Reject Dialog state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedResvNo, setSelectedResvNo] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // --- State Lists ---
    const [studios, setStudios] = useState<any[]>([]);
    const [selectedStudioNo, setSelectedStudioNo] = useState<number | null>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedRoomNo, setSelectedRoomNo] = useState<number | null>(null);
    const [prices, setPrices] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);

    // --- Form States ---
    const [studioNm, setStudioNm] = useState('');
    const [zipcode, setZipcode] = useState('');        // 우편번호
    const [address, setAddress] = useState('');        // 기본 주소 (Daum 검색 결과)
    const [addressDetail, setAddressDetail] = useState(''); // 상세 주소
    const [bigo, setBigo] = useState('');   
    const [roomNm, setRoomNm] = useState('');
    const [hourBaseUprice, setHourBaseUprice] = useState(10000);
    const [capacityCnt, setCapacityCnt] = useState(4);
    const [equipmentInfo, setEquipmentInfo] = useState('');

    const [dayOfWeek, setDayOfWeek] = useState<number>(1);
    const [sttTime, setSttTime] = useState('0900');
    const [endTime, setEndTime] = useState('2200');
    const [timeUprice, setTimeUprice] = useState(10000);

    const showModal = (msg: string, callback?: () => void) => {
        setModalMessage(msg);
        setModalCallback(() => callback || null);
        setModalOpen(true);
    };

    // Daum 우편번호 검색 핸들러
    const handleAddressSearch = () => {
        if (!(window as any).daum?.Postcode) {
            showModal('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }
        new (window as any).daum.Postcode({
            oncomplete: (data: any) => {
                // 도로명 주소 우선, 없으면 지번 주소
                const fullAddress = data.roadAddress || data.jibunAddress;
                setZipcode(data.zonecode);
                setAddress(fullAddress);
                setAddressDetail(''); // 상세주소 초기화
            },
            theme: {
                bgColor: '#003C48',
                searchBgColor: '#00BDF8',
                contentBgColor: '#ffffff',
                pageBgColor: '#f8f9fa',
                textColor: '#333333',
                queryTextColor: '#003C48',
            }
        }).open();
    };

    const loadPartnerStatus = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/partner/status?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.partnerStatCd === 'A') {
                    setPartner(data);
                    loadStudios(data.partnerNo);
                    loadReservations(data.partnerNo);
                } else {
                    showModal("권한이 없거나 승인 대기 상태입니다.", () => navigate('/main/profile'));
                }
            } else {
                showModal("파트너 정보 조회에 실패했습니다.", () => navigate('/main/profile'));
            }
        } catch (error) {
            console.error("Load partner status error:", error);
            showModal("네트워크 오류 발생", () => navigate('/main/profile'));
        }
    };

    useEffect(() => {
        loadPartnerStatus();
    }, [userId]);

    const loadStudios = async (pNo: number) => {
        try {
            const res = await fetch(`/api/partner/studios?partnerNo=${pNo}`);
            if (res.ok) {
                const data = await res.json();
                setStudios(data);
                if (data.length > 0) {
                    setSelectedStudioNo(data[0].studioNo);
                }
            }
        } catch (e) {
            console.error("Load studios failed", e);
        }
    };

    const handleCreateStudio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partner || !studioNm) return;

        try {
            const res = await fetch(`/api/partner/studios?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerNo: partner.partnerNo,
                    studioNm,
                    zipcode,
                    address: addressDetail ? `${address} ${addressDetail}`.trim() : address,
                    bigo
                })
            });

            if (res.ok) {
                showModal('지점이 등록되었습니다.');
                setStudioNm('');
                setZipcode('');
                setAddress('');
                setAddressDetail('');
                setBigo('');
                loadStudios(partner.partnerNo);
            }
        } catch (e) {
            console.error('Create studio failed', e);
        }
    };

    const loadRooms = async (sNo: number) => {
        try {
            const res = await fetch(`/api/partner/rooms?studioNo=${sNo}`);
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
                if (data.length > 0) {
                    setSelectedRoomNo(data[0].roomNo);
                } else {
                    setSelectedRoomNo(null);
                    setPrices([]);
                }
            }
        } catch (e) {
            console.error("Load rooms failed", e);
        }
    };

    useEffect(() => {
        if (selectedStudioNo) {
            loadRooms(selectedStudioNo);
        }
    }, [selectedStudioNo]);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudioNo || !roomNm) {
            showModal("지점 선택 및 룸 명칭을 입력해주세요.");
            return;
        }

        try {
            const res = await fetch(`/api/partner/rooms?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studioNo: selectedStudioNo,
                    roomNm,
                    hourBaseUprice,
                    capacityCnt,
                    equipmentInfo
                })
            });

            if (res.ok) {
                showModal("룸이 성공적으로 등록되었습니다.");
                setRoomNm('');
                setHourBaseUprice(10000);
                setCapacityCnt(4);
                setEquipmentInfo('');
                loadRooms(selectedStudioNo);
            }
        } catch (e) {
            console.error("Create room failed", e);
        }
    };

    const loadPrices = async (rNo: number) => {
        try {
            const res = await fetch(`/api/partner/room-prices?roomNo=${rNo}`);
            if (res.ok) {
                const data = await res.json();
                setPrices(data);
            }
        } catch (e) {
            console.error("Load prices failed", e);
        }
    };

    useEffect(() => {
        if (selectedRoomNo) {
            loadPrices(selectedRoomNo);
        }
    }, [selectedRoomNo]);

    const handleAddPrice = () => {
        if (!selectedRoomNo) return;
        const newPrice = {
            dayOfWeek,
            sttTime,
            endTime,
            timeUprice
        };
        setPrices([...prices, newPrice]);
    };

    const handleRemovePrice = (index: number) => {
        setPrices(prices.filter((_, i) => i !== index));
    };

    const handleSavePrices = async () => {
        if (!selectedRoomNo) {
            showModal("룸을 선택해주세요.");
            return;
        }

        try {
            const res = await fetch(`/api/partner/room-prices?roomNo=${selectedRoomNo}&userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prices)
            });

            if (res.ok) {
                showModal("단가 설정이 저장되었습니다.");
                loadPrices(selectedRoomNo);
            } else {
                showModal("단가 저장 실패");
            }
        } catch (e) {
            console.error("Save prices failed", e);
        }
    };

    const loadReservations = async (pNo: number) => {
        try {
            const res = await fetch(`/api/partner/reservations?partnerNo=${pNo}`);
            if (res.ok) {
                const data = await res.json();
                setReservations(data);
            }
        } catch (e) {
            console.error("Load reservations failed", e);
        }
    };

    const handleReservationAction = async (resvNo: number, status: 'APR' | 'REJ', bigoText: string = '') => {
        try {
            const res = await fetch(`/api/partner/reservations/${resvNo}/status?status=${status}&userId=${userId}&rejectBigo=${encodeURIComponent(bigoText)}`, {
                method: 'PUT'
            });
            if (res.ok) {
                showModal(status === 'APR' ? "승인 처리되었습니다." : "반려 처리되었습니다.");
                if (partner) {
                    loadReservations(partner.partnerNo);
                }
            } else {
                showModal("처리 중 오류가 발생했습니다.");
            }
        } catch (e) {
            console.error("Update reservation error", e);
        }
    };

    const getDayName = (dayCode: number) => {
        const days = ["월", "화", "수", "목", "금", "토", "일"];
        return days[dayCode - 1] || "";
    };

    const formatTime = (timeStr: string) => {
        if (timeStr.length !== 4) return timeStr;
        return `${timeStr.substring(0, 2)}:${timeStr.substring(2)}`;
    };

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-[100]">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/main/profile')} className="text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <FaChevronLeft size={20} />
                    </button>
                    <h1 className="text-[14px] font-bold text-[#003C48]">{partner ? `${partner.bizNm} 관리` : '합주실 관리'}</h1>
                </div>
            </div>

            <div className="flex bg-white px-2 py-1.5 border-b border-gray-100 flex-shrink-0">
                {(['studio', 'room', 'price', 'approve'] as const).map((tab) => {
                    const label = tab === 'studio' ? '지점' : tab === 'room' ? '룸' : tab === 'price' ? '단가' : '승인';
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${isActive ? 'bg-[#003C48] text-white shadow-sm' : 'text-gray-400'}`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-20">
                {activeTab === 'studio' && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-xs font-bold text-[#003C48] mb-3">지점 등록</h2>
                            <form onSubmit={handleCreateStudio} className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={studioNm}
                                    onChange={(e) => setStudioNm(e.target.value)}
                                    placeholder="지점명 (예: 강남역점)"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                    required
                                />
                                {/* 주소 검색 */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={zipcode}
                                            readOnly
                                            placeholder="우편번호"
                                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 cursor-default"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddressSearch}
                                            className="shrink-0 px-4 py-2.5 bg-[#00BDF8] text-white text-xs font-bold rounded-xl hover:bg-[#009fd4] active:scale-95 transition-all whitespace-nowrap"
                                        >
                                            🔍 주소 검색
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={address}
                                        readOnly
                                        placeholder="기본 주소"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 cursor-default"
                                    />
                                    {address && (
                                        <input
                                            type="text"
                                            value={addressDetail}
                                            onChange={(e) => setAddressDetail(e.target.value)}
                                            placeholder="상세주소 입력 (동/호수 등)"
                                            className="w-full px-4 py-2.5 bg-white border border-[#00BDF8]/40 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] transition-colors"
                                        />
                                    )}
                                </div>
                                <textarea
                                    value={bigo}
                                    onChange={(e) => setBigo(e.target.value)}
                                    placeholder="설명 및 편의시설"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs h-20 resize-none"
                                />
                                <button type="submit" className="bg-[#003C48] text-white py-2.5 rounded-xl font-bold text-xs">지점 등록</button>
                            </form>
                        </div>
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-xs font-bold text-[#003C48] mb-3">등록 지점 목록</h2>
                            {studios.map(s => (
                                <div key={s.studioNo} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 mb-2">
                                    <div className="flex justify-between items-center"><span className="text-xs font-bold text-[#003C48]">{s.studioNm}</span></div>
                                    <p className="text-[10px] text-gray-500 mt-1">{s.address}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'room' && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-xs font-bold text-[#003C48] mb-3">룸 등록</h2>
                            <select
                                value={selectedStudioNo || ''}
                                onChange={(e) => setSelectedStudioNo(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs mb-3"
                            >
                                {studios.map(s => (
                                    <option key={s.studioNo} value={s.studioNo}>{s.studioNm}</option>
                                ))}
                            </select>
                            <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={roomNm}
                                    onChange={(e) => setRoomNm(e.target.value)}
                                    placeholder="룸 명칭 (예: Room A)"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                    required
                                />
                                <input
                                    type="number"
                                    value={hourBaseUprice}
                                    onChange={(e) => setHourBaseUprice(Number(e.target.value))}
                                    placeholder="시간당 요금"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                />
                                <input
                                    type="number"
                                    value={capacityCnt}
                                    onChange={(e) => setCapacityCnt(Number(e.target.value))}
                                    placeholder="수용인원"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                />
                                <textarea
                                    value={equipmentInfo}
                                    onChange={(e) => setEquipmentInfo(e.target.value)}
                                    placeholder="보유 장비 정보"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs h-20 resize-none"
                                />
                                <button type="submit" className="bg-[#003C48] text-white py-2.5 rounded-xl font-bold text-xs">룸 등록</button>
                            </form>
                        </div>
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-xs font-bold text-[#003C48] mb-3">등록 룸 목록</h2>
                            {rooms.map(r => (
                                <div key={r.roomNo} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 mb-2">
                                    <div className="flex justify-between"><span className="text-xs font-bold text-[#003C48]">{r.roomNm}</span></div>
                                    <p className="text-[10px] text-gray-500 mt-1">{r.hourBaseUprice.toLocaleString()}원/시간 | {r.capacityCnt}명 수용</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'price' && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                            <h2 className="text-xs font-bold text-[#003C48] mb-3">단가 설정</h2>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <select
                                    value={selectedStudioNo || ''}
                                    onChange={(e) => setSelectedStudioNo(Number(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                >
                                    {studios.map(s => (
                                        <option key={s.studioNo} value={s.studioNo}>{s.studioNm}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedRoomNo || ''}
                                    onChange={(e) => setSelectedRoomNo(Number(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                                >
                                    {rooms.map(r => (
                                        <option key={r.roomNo} value={r.roomNo}>{r.roomNm}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedRoomNo && (
                                <div className="flex flex-col gap-3 pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                                            <option value={1}>월요일</option>
                                            <option value={2}>화요일</option>
                                            <option value={3}>수요일</option>
                                            <option value={4}>목요일</option>
                                            <option value={5}>금요일</option>
                                            <option value={6}>토요일</option>
                                            <option value={7}>일요일</option>
                                        </select>
                                        <input type="number" value={timeUprice} onChange={(e) => setTimeUprice(Number(e.target.value))} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs" placeholder="시간당 단가"/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" value={sttTime} onChange={(e) => setSttTime(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-center" placeholder="시작시간 (HHmm)"/>
                                        <input type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-center" placeholder="종료시간 (HHmm)"/>
                                    </div>
                                    <button onClick={handleAddPrice} className="bg-[#00BDF8] text-white py-2 rounded-xl text-xs font-bold">단가 추가</button>
                                </div>
                            )}
                        </div>
                        {selectedRoomNo && (
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-xs font-bold text-[#003C48]">단가 목록</h2>
                                    <button onClick={handleSavePrices} className="bg-[#003C48] text-white px-3 py-1.5 rounded-xl text-xs font-bold">저장</button>
                                </div>
                                {prices.map((p, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2.5 border border-gray-50 rounded-xl bg-gray-50/50 text-xs mb-2">
                                        <span>{getDayName(p.dayOfWeek)}요일: {formatTime(p.sttTime)} ~ {formatTime(p.endTime)} ({p.timeUprice.toLocaleString()}원)</span>
                                        <button onClick={() => handleRemovePrice(idx)} className="text-red-400"><FaTrash size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'approve' && (
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                        <h2 className="text-xs font-bold text-[#003C48] mb-3">예약 요청 목록</h2>
                        {reservations.map((resv) => (
                            <div key={resv.resvNo} className="border border-gray-100 rounded-2xl p-4 mb-3 flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-[#003C48]">{resv.studioNm} - {resv.roomNm}</span>
                                    <span className="text-xs font-bold text-gray-500">{resv.resvStatFg === 'REQ' ? '대기' : resv.resvStatFg === 'APR' ? '승인' : '거절'}</span>
                                </div>
                                <div className="text-[11px] text-gray-500">
                                    <p>신청자: {resv.userNickNm} ({resv.userId})</p>
                                    <p>사용일: {resv.useDate.substring(0,4)}-{resv.useDate.substring(4,6)}-{resv.useDate.substring(6,8)}</p>
                                    <p>시간: {formatTime(resv.sttTime)} ~ {formatTime(resv.endTime)}</p>
                                    <p>금액: {resv.paymentAmt.toLocaleString()}원</p>
                                </div>
                                {resv.resvStatFg === 'REQ' && (
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleReservationAction(resv.resvNo, 'APR')} className="flex-1 bg-[#003C48] text-white py-2 rounded-xl text-xs font-bold">승인</button>
                                        <button onClick={() => { setSelectedResvNo(resv.resvNo); setRejectReason(''); setRejectModalOpen(true); }} className="flex-1 bg-red-50 text-red-500 py-2 rounded-xl text-xs font-bold">반려</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CommonModal isOpen={modalOpen} type="alert" message={modalMessage} onConfirm={() => { setModalOpen(false); if (modalCallback) { modalCallback(); setModalCallback(null); } }} />

            {rejectModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-gray-100 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-[#003C48]">거절 사유 입력</h3>
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="거절 사유를 입력하세요." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs h-24 resize-none" />
                        <div className="flex gap-2">
                            <button onClick={() => { if (selectedResvNo) { handleReservationAction(selectedResvNo, 'REJ', rejectReason); setRejectModalOpen(false); } }} className="flex-1 bg-[#FF6B6B] text-white py-2 rounded-xl text-xs font-bold">반려</button>
                            <button onClick={() => setRejectModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-2 rounded-xl text-xs font-bold">취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerManagePage;
