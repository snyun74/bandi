import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaCalendarAlt, FaUsers, FaCheck, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { formatAccountNumber } from '../utils/bankUtils';

interface BookingState {
    useDate: string;           // "20260720"
    dateDisplay: string;       // "7월 20일(일)"
    timeRangeFormatted: string;// "18:00~20:00"
    sttTime: string;           // "1800"
    endTime: string;           // "2000"
    totalHours: number;
    totalAmount: number;
    studioNm: string;
    roomNm: string;
    capacityCnt: number;
    roomImg?: string | null;
    bankNm?: string;
    accountNo?: string;
    accountHolderNm?: string;
}

const JamRoomConfirm: React.FC = () => {
    const navigate = useNavigate();
    const { studioNo, roomNo } = useParams<{ studioNo: string; roomNo: string }>();
    const location = useLocation();

    const bookingState = (location.state as BookingState) || null;

    const [isAgreed, setIsAgreed] = useState<boolean>(true);
    const [selectedPayment, setSelectedPayment] = useState<string>('BANK');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [bankInfo, setBankInfo] = useState<{
        bankNm: string;
        accountNo: string;
        accountHolderNm: string;
    }>({
        bankNm: bookingState?.bankNm || '',
        accountNo: bookingState?.accountNo || '',
        accountHolderNm: bookingState?.accountHolderNm || ''
    });
    const [errorModal, setErrorModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        isConflict: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        isConflict: false
    });

    // 지점 상세 정보에서 사업자 계좌 정보 로드
    useEffect(() => {
        if (studioNo) {
            fetch(`/api/studios/${studioNo}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data && (data.bankNm || data.accountNo)) {
                        setBankInfo({
                            bankNm: data.bankNm || '',
                            accountNo: data.accountNo || '',
                            accountHolderNm: data.accountHolderNm || ''
                        });
                    }
                })
                .catch(err => console.error('Failed to load studio bank info', err));
        }
    }, [studioNo]);

    const handleCopyAccount = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // 전달된 상태가 없으면 뒤로 이동
    useEffect(() => {
        if (!bookingState && roomNo) {
            navigate(`/main/jam/reservation/studios/${studioNo}/rooms/${roomNo}/book`, { replace: true });
        }
    }, [bookingState, roomNo, studioNo, navigate]);

    if (!bookingState) return null;

    const platformFee = 0; // 플랫폼 수수료 (0원)
    const finalAmount = bookingState.totalAmount + platformFee;

    const handlePaymentAndBook = async () => {
        if (!isAgreed || isSubmitting) return;

        const userId = localStorage.getItem('userId') || 'guest';
        const currentJamNo = sessionStorage.getItem('currentJamNo');
        setIsSubmitting(true);

        try {
            const payload = {
                roomNo: parseInt(roomNo!, 10),
                bnNo: currentJamNo ? parseInt(currentJamNo, 10) : null,
                userId,
                useDate: bookingState.useDate,
                sttTime: bookingState.sttTime,
                endTime: bookingState.endTime,
                resvTotAmt: finalAmount,
                paymentAmt: finalAmount
            };

            const res = await fetch(`/api/studios/rooms/${roomNo}/reservations?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowSuccessModal(true);
            } else {
                const errorData = await res.json().catch(() => null);
                const isConflict = res.status === 409;
                setErrorModal({
                    isOpen: true,
                    title: isConflict ? '이미 예약된 시간대입니다' : '예약 신청 실패',
                    message: errorData?.message || '선택하신 시간대에 방금 다른 예약이 접수되었습니다.\n날짜와 시간을 다시 확인해 주세요.',
                    isConflict
                });
            }
        } catch (err) {
            console.error('Reservation error:', err);
            setErrorModal({
                isOpen: true,
                title: '오류 발생',
                message: '일시적인 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
                isConflict: false
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const jamTitle = sessionStorage.getItem('currentJamTitle') || '봄날 커버 합주';
    const [isSharing, setIsSharing] = useState<boolean>(false);

    // 합주 단체채팅방에 예약 정보 공유
    const handleShareToChat = async () => {
        const currentJamNo = sessionStorage.getItem('currentJamNo');
        const userId = localStorage.getItem('userId') || 'guest';

        if (!currentJamNo) {
            navigate('/main/jam');
            return;
        }

        setIsSharing(true);
        try {
            const shareMsg = `🎸 [합주실 예약 완료]\n` +
                `📍 장소: ${bookingState.studioNm} · ${bookingState.roomNm}\n` +
                `🗓️ 일시: ${bookingState.dateDisplay} ${bookingState.timeRangeFormatted}\n` +
                `👥 인원: ${bookingState.capacityCnt}명\n` +
                `💰 결제금액: ${finalAmount.toLocaleString()}원\n\n` +
                `합주실 예약이 완료되었습니다! 🎶`;

            await fetch('/api/jam-chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cnNo: parseInt(currentJamNo, 10),
                    sndUserId: userId,
                    msg: shareMsg,
                    msgTypeCd: 'TEXT',
                    roomType: 'BAND'
                })
            });
        } catch (err) {
            console.error('Error sharing to chat:', err);
        } finally {
            setIsSharing(false);
            navigate(`/main/clan/jam/room/${currentJamNo}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Pretendard'] overflow-hidden">
            {/* Header */}
            <div className="shrink-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1 -ml-1 text-gray-700 hover:text-gray-900 transition-colors"
                >
                    <FaChevronLeft size={18} />
                </button>
                <h1 className="text-[17px] font-bold text-[#052c42]">예약 확인</h1>
                <div className="w-6" />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                {/* Title */}
                <div>
                    <h2 className="text-[20px] font-extrabold text-[#052c42] leading-tight">
                        {jamTitle} 예약을 확인해주세요
                    </h2>
                </div>

                {/* Studio & Room Summary Card (Cyan border) */}
                <div className="bg-white rounded-2xl p-4 border-2 border-[#00BDF8] shadow-sm flex items-center gap-3.5">
                    {/* Thumbnail Image */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <img
                            src={
                                bookingState.roomImg ||
                                'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300&auto=format&fit=crop'
                            }
                            alt={bookingState.roomNm}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300&auto=format&fit=crop';
                            }}
                        />
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <h3 className="text-[15px] font-bold text-[#052c42] truncate">
                            {bookingState.studioNm} · {bookingState.roomNm}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                            <span className="text-cyan-500">🗓️</span>
                            <span className="font-semibold">
                                {bookingState.dateDisplay} {bookingState.timeRangeFormatted}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                            <span className="text-blue-500">👥</span>
                            <span className="truncate">{jamTitle} · 이용 인원 {bookingState.capacityCnt}명</span>
                        </div>
                    </div>
                </div>

                {/* Price Breakdown Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
                    <div className="flex justify-between text-[14px] text-gray-600">
                        <span>공간 이용료</span>
                        <span className="font-semibold text-[#052c42]">
                            {bookingState.totalAmount.toLocaleString()}원
                        </span>
                    </div>
                    <div className="flex justify-between text-[14px] text-gray-600">
                        <span>플랫폼 수수료</span>
                        <span className="font-semibold text-[#052c42]">
                            {platformFee > 0 ? `${platformFee.toLocaleString()}원` : '0원'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="text-[15px] font-bold text-[#052c42]">총 결제 금액</span>
                        <span className="text-[20px] font-extrabold text-[#00BDF8]">
                            {finalAmount.toLocaleString()}원
                        </span>
                    </div>
                </div>

                {/* Payment Method Card (계좌 입금) */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3.5">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[14px] font-bold text-[#052c42]">결제 수단</h4>
                        <span className="text-[11px] font-bold text-[#00BDF8] bg-[#00BDF8]/10 px-2.5 py-0.5 rounded-full">
                            계좌 입금
                        </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">입금 계좌 정보</span>
                            {bankInfo.bankNm && (
                                <span className="text-[11px] text-green-800 font-bold bg-green-100 px-2 py-0.5 rounded-md">
                                    {bankInfo.bankNm}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-lg border border-gray-100 shadow-xs">
                            <div className="flex flex-col">
                                <span className="text-[11px] text-gray-400">
                                    {bankInfo.bankNm ? `${bankInfo.bankNm} ` : ''}계좌번호 {bankInfo.accountHolderNm ? `(예금주: ${bankInfo.accountHolderNm})` : ''}
                                </span>
                                <span className="text-[15px] font-extrabold text-[#003C48] tracking-wider select-all mt-0.5">
                                    {formatAccountNumber(bankInfo.accountNo, bankInfo.bankNm) || '등록된 입금 계좌가 없습니다.'}
                                </span>
                            </div>
                            {bankInfo.accountNo && (
                                <button
                                    type="button"
                                    onClick={() => handleCopyAccount(formatAccountNumber(bankInfo.accountNo, bankInfo.bankNm))}
                                    className="text-[11px] font-bold text-[#00BDF8] hover:text-[#0096c7] bg-[#00BDF8]/10 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                                >
                                    {isCopied ? '복사됨 ✓' : '복사'}
                                </button>
                            )}
                        </div>

                        {/* 안내 문구 */}
                        <div className="flex items-start gap-1.5 pt-1 text-[11px] text-amber-800 bg-amber-50/90 p-2.5 rounded-lg border border-amber-200/60">
                            <span className="shrink-0 text-amber-600 font-bold">⚠️</span>
                            <p className="leading-snug">
                                <strong className="font-bold text-amber-900">결제하기 버튼을 누르기 전에</strong> 위 계좌로 입금을 먼저 진행해 주세요. 입금 확인 후 호스트가 예약을 승인합니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Agreement Checkbox */}
                <div
                    onClick={() => setIsAgreed(!isAgreed)}
                    className="flex items-center gap-2 py-1 px-1 cursor-pointer select-none"
                >
                    <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            isAgreed ? 'bg-[#00BDF8] text-white' : 'border-2 border-gray-300 bg-white'
                        }`}
                    >
                        {isAgreed && <FaCheck size={11} />}
                    </div>
                    <span className="text-[13px] text-gray-600 font-medium">
                        예약 및 취소 규정을 확인하고 동의합니다.
                    </span>
                </div>
            </div>

            {/* Bottom Payment Button */}
            <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <button
                    disabled={!isAgreed || isSubmitting}
                    onClick={handlePaymentAndBook}
                    className={`w-full py-4 rounded-2xl text-[15px] font-bold transition-all shadow-lg ${
                        isAgreed && !isSubmitting
                            ? 'bg-[#00BDF8] text-white hover:bg-[#009fd4] active:scale-[0.98] shadow-[#00BDF8]/30'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    {isSubmitting ? '결제 및 예약 처리 중...' : `${finalAmount.toLocaleString()}원 결제하기`}
                </button>
            </div>

            {/* Success Modal (Popup Dialog) */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Circle Check Icon */}
                        <div className="w-20 h-20 rounded-full bg-[#e8f8fe] flex items-center justify-center text-[#00BDF8] mx-auto shadow-sm">
                            <FaCheck size={30} className="stroke-[2.5]" />
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1">
                            <h2 className="text-[20px] font-black text-[#052c42] tracking-tight">
                                예약이 완료됐어요!
                            </h2>
                            <p className="text-[13px] text-gray-500">
                                {jamTitle} 합주방에 예약 정보를 공유해보세요.
                            </p>
                        </div>

                        {/* Room Info Summary Card */}
                        <div className="bg-white rounded-2xl p-3.5 border-2 border-[#00BDF8] shadow-sm flex items-center gap-3 text-left">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                <img
                                    src={
                                        bookingState.roomImg ||
                                        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300&auto=format&fit=crop'
                                    }
                                    alt={bookingState.roomNm}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300&auto=format&fit=crop';
                                    }}
                                />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                                <h3 className="text-[14px] font-bold text-[#052c42] truncate">
                                    {bookingState.studioNm} · {bookingState.roomNm}
                                </h3>
                                <div className="flex items-center gap-1 text-[11px] text-gray-600">
                                    <span className="text-cyan-500">🗓️</span>
                                    <span className="font-semibold truncate">
                                        {bookingState.dateDisplay} {bookingState.timeRangeFormatted}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                    <span className="text-blue-500">👥</span>
                                    <span className="truncate">{jamTitle} · {bookingState.capacityCnt}명</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5 pt-1">
                            <button
                                disabled={isSharing}
                                onClick={handleShareToChat}
                                className="w-full py-3.5 bg-[#e1f5fe] text-[#0288d1] rounded-2xl font-extrabold text-[14px] hover:bg-[#b3e5fc] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSharing ? '채팅방에 공유 중...' : '합주방에 공유하기'}
                            </button>
                            <button
                                onClick={() => navigate('/main/home')}
                                className="w-full py-3.5 bg-[#00BDF8] text-white rounded-2xl font-extrabold text-[14px] hover:bg-[#00a8df] active:scale-[0.98] transition-all shadow-md shadow-[#00BDF8]/30"
                            >
                                홈으로 돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error / Conflict Alert Modal */}
            {errorModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center space-y-4 animate-in fade-in zoom-in duration-200 shadow-2xl">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                            errorModal.isConflict ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                        }`}>
                            <FaExclamationTriangle size={28} />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-[18px] font-bold text-[#052c42]">{errorModal.title}</h3>
                            <p className="text-[13px] text-gray-500 whitespace-pre-line leading-relaxed">
                                {errorModal.message}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const isConflict = errorModal.isConflict;
                                setErrorModal(prev => ({ ...prev, isOpen: false }));
                                if (isConflict) {
                                    navigate(-1); // 날짜/시간 선택 화면으로 복귀
                                }
                            }}
                            className={`w-full py-3.5 text-white rounded-xl font-bold text-[14px] transition-all shadow-md ${
                                errorModal.isConflict
                                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                                    : 'bg-[#00BDF8] hover:bg-[#009fd4] shadow-[#00BDF8]/30'
                            }`}
                        >
                            {errorModal.isConflict ? '다른 시간대 선택하기' : '확인'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JamRoomConfirm;
