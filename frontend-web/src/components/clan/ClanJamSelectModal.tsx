import React from 'react';
import { FaTimes, FaMusic, FaChevronRight, FaUserTag } from 'react-icons/fa';

export interface EligibleJam {
    bnNo: number;
    cnNo: number;
    bnNm: string;
    bnSongNm?: string;
    bnSingerNm?: string;
    bnConfFg: string; // 'N' (진행), 'Y' (확정)
    bnImg?: string;
    role?: string;
}

interface ClanJamSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    jams: EligibleJam[];
    onSelectJam: (jam: EligibleJam) => void;
}

const ClanJamSelectModal: React.FC<ClanJamSelectModalProps> = ({
    isOpen,
    onClose,
    jams,
    onSelectJam,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cyan-50/50 to-blue-50/30">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            동방 예약 합주방 선택
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            예약을 진행할 합주방을 선택해 주세요.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="닫기"
                    >
                        <FaTimes size={15} />
                    </button>
                </div>

                {/* Jam List */}
                <div className="px-3 py-2 overflow-y-auto divide-y divide-gray-100 flex-1">
                    {jams.map((jam) => {
                        const isConfirmed = jam.bnConfFg === 'Y';
                        return (
                            <div
                                key={jam.bnNo}
                                onClick={() => onSelectJam(jam)}
                                className="group py-3 px-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer flex items-center gap-3.5"
                            >
                                {/* Thumbnail */}
                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative flex items-center justify-center border border-gray-100">
                                    {jam.bnImg ? (
                                        <img
                                            src={jam.bnImg}
                                            alt={jam.bnNm}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-cyan-50 text-[#00BDF8]">
                                            <FaMusic size={18} className="opacity-80" />
                                        </div>
                                    )}
                                </div>

                                {/* Jam Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span
                                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm shrink-0 ${
                                                isConfirmed
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                    : 'bg-sky-50 text-[#00BDF8] border border-sky-200'
                                            }`}
                                        >
                                            {isConfirmed ? '합주 확정' : '진행 중'}
                                        </span>
                                        {jam.role && (
                                            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5">
                                                <FaUserTag size={9} className="text-gray-400" />
                                                {jam.role === 'LEAD' ? '리더' : '멤버'}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-[#00BDF8] transition-colors">
                                        {jam.bnNm}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {jam.bnSongNm || jam.bnSingerNm
                                            ? `${jam.bnSongNm || '미정'} - ${jam.bnSingerNm || '미정'}`
                                            : '자유 합주'}
                                    </p>
                                </div>

                                {/* Action Icon */}
                                <div className="text-gray-300 group-hover:text-gray-500 transition-colors pr-1 shrink-0">
                                    <FaChevronRight size={12} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors"
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClanJamSelectModal;
