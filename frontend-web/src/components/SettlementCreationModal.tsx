import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaTimes, FaUserCircle, FaPen } from 'react-icons/fa';
import CommonModal from './common/CommonModal';

interface SettlementUser {
    userId: string;
    userNm: string;
    profileUrl?: string;
    amount: number;
}

interface SettlementData {
    bank: string;
    accountNumber: string;
    totalAmount: number;
    users: SettlementUser[];
}

interface SettlementCreationModalProps {
    onClose: () => void;
    onSubmit: (data: SettlementData) => void;
    roomId: string;
}

const SettlementCreationModal: React.FC<SettlementCreationModalProps> = ({ onClose, onSubmit, roomId }) => {
    const [bank, setBank] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [totalAmount, setTotalAmount] = useState<string>('');

    const [selectedUsers, setSelectedUsers] = useState<SettlementUser[]>([]);

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [promptUserId, setPromptUserId] = useState<string | null>(null);
    const [promptAmount, setPromptAmount] = useState<string>('');

    useEffect(() => {
        // Fetch participants of the jam chat room on load
        if (roomId) {
            fetch(`/api/jam-chat/${roomId}/users`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Failed to fetch room users");
                })
                .then(data => {
                    const mappedUsers = data.map((u: any) => ({
                        userId: u.userId,
                        userNm: u.userNickNm || u.userNm,
                        profileUrl: u.profileUrl,
                        amount: 0
                    }));
                    setSelectedUsers(mappedUsers);
                })
                .catch(err => console.error("Error fetching room users:", err));
        }
    }, [roomId]);

    useEffect(() => {
        // Automatically split total amount among selected users
        const amountNum = parseInt(totalAmount) || 0;
        if (selectedUsers.length > 0 && amountNum > 0) {
            const splitAmount = Math.floor(amountNum / selectedUsers.length);
            setSelectedUsers(prev => prev.map(u => ({ ...u, amount: splitAmount })));
        }
    }, [totalAmount, selectedUsers.length]);

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(prev => prev.filter(u => u.userId !== userId));
    };

    const handleEditAmount = (userId: string, newAmount: number) => {
        setSelectedUsers(prev => prev.map(u => u.userId === userId ? { ...u, amount: newAmount } : u));
    };

    const handleSubmit = () => {
        if (!bank || !accountNumber || !totalAmount || selectedUsers.length === 0) {
            setAlertMessage('모든 정보를 입력하고 정산 대상자를 최소 1명 추가해주세요.');
            setIsAlertOpen(true);
            return;
        }
        onSubmit({
            bank,
            accountNumber,
            totalAmount: parseInt(totalAmount),
            users: selectedUsers
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" style={{ fontFamily: '"Jua", sans-serif', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center p-4">
                    <button onClick={onClose} className="text-gray-500 flex items-center text-sm font-bold">
                        <FaChevronLeft className="mr-1" /> 뒤로 가기
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Inputs */}
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="은행 선택"
                            value={bank}
                            onChange={(e) => setBank(e.target.value)}
                            className="w-full bg-[#f4f6f8] text-[#003C48] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#00BDF8]"
                        />
                        <input
                            type="text"
                            placeholder="계좌번호 입력"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full bg-[#f4f6f8] text-[#003C48] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#00BDF8]"
                        />
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">₩</span>
                            <input
                                type="number"
                                placeholder="금액 입력"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                className="w-full bg-[#f4f6f8] text-[#003C48] pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#00BDF8]"
                            />
                        </div>
                    </div>

                    {/* User Section */}
                    <div className="mt-4 border border-[#a8b8c2] rounded-xl p-4 min-h-[220px] flex flex-col items-center">
                        <div className="w-full text-sm font-bold text-[#003C48] mb-4 text-left border-b border-gray-100 pb-2">
                            정산 대상자 ({selectedUsers.length}명)
                        </div>

                        <div className="w-full grid grid-cols-2 gap-y-4 gap-x-2 pb-2">
                            {selectedUsers.map(user => (
                                <div key={user.userId} className="flex flex-col items-center relative group">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-[#003C48] flex items-center justify-center text-[#003C48] overflow-hidden mb-1">
                                            {user.profileUrl ? (
                                                <img src={user.profileUrl} alt={user.userNm} className="w-full h-full object-cover" />
                                            ) : (
                                                <FaUserCircle size={24} />
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveUser(user.userId)}
                                            className="absolute -top-1 -right-1 text-gray-400 bg-white rounded-full w-4 h-4 flex items-center justify-center border border-gray-200"
                                        >
                                            <FaTimes size={10} />
                                        </button>
                                    </div>
                                    <span className="text-[#003C48] text-xs font-bold mb-1">{user.userNm}</span>
                                    <div className="flex items-center text-[10px] text-[#003C48] font-bold">
                                        {user.amount}원
                                        <button
                                            onClick={() => {
                                                setPromptUserId(user.userId);
                                                setPromptAmount(user.amount.toString());
                                                setIsPromptOpen(true);
                                            }}
                                            className="ml-1 text-gray-400"
                                        >
                                            <FaPen size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Button */}
                <div className="p-4 mb-4">
                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 bg-[#00BDF8] text-white rounded-[20px] shadow-md font-bold text-lg hover:bg-[#009bc9] transition-colors"
                    >
                        정산하기
                    </button>
                </div>
            </div>

            <CommonModal
                isOpen={isAlertOpen}
                type="alert"
                message={alertMessage}
                onConfirm={() => setIsAlertOpen(false)}
            />

            {isPromptOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" style={{ fontFamily: '"Jua", sans-serif', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all duration-300 scale-100 p-8 text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">금액 입력</h3>
                        <input
                            type="number"
                            value={promptAmount}
                            onChange={(e) => setPromptAmount(e.target.value)}
                            className="w-full bg-[#f4f6f8] text-[#003C48] px-4 py-3 mb-8 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#00BDF8]"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsPromptOpen(false)}
                                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    if (promptUserId && promptAmount && !isNaN(parseInt(promptAmount))) {
                                        handleEditAmount(promptUserId, parseInt(promptAmount));
                                    }
                                    setIsPromptOpen(false);
                                }}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors duration-200 shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettlementCreationModal;
