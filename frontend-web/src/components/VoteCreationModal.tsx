import React, { useState } from 'react';
import { FaTimes, FaChevronLeft, FaRegCalendarAlt, FaCheckSquare, FaSquare } from 'react-icons/fa';
import CommonModal from './common/CommonModal';

interface VoteCreationModalProps {
    onClose: () => void;
    onSubmit: (voteData: any) => void;
}

const VoteCreationModal: React.FC<VoteCreationModalProps> = ({ onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']); // Start with 2 empty options
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [endTime, setEndTime] = useState('');

    // Alert State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) return; // Minimum 2 options
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            showAlert('투표 제목을 입력해주세요.');
            return;
        }
        if (options.some(opt => !opt.trim())) {
            showAlert('빈 투표 항목이 있습니다.');
            return;
        }
        if (!endTime) {
            showAlert('투표 종료 시간을 설정해주세요.');
            return;
        }

        onSubmit({
            title,
            options,
            allowMultiple,
            isAnonymous,
            endTime
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Jua']">
            <div className="bg-white w-full max-w-sm rounded-[20px] shadow-xl overflow-hidden relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-100">
                    <button onClick={onClose} className="text-gray-500 mr-2 flex items-center text-sm">
                        <FaChevronLeft className="mr-1" />
                        뒤로 가기
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4">

                    {/* Title Input */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="투표 제목 입력"
                        className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[#003C48] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00BDF8]/20"
                    />

                    {/* Options */}
                    <div className="space-y-2">
                        {options.map((opt, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`${index + 1}. 투표 항목 입력`}
                                        className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[#003C48] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00BDF8]/20 pr-10"
                                    />
                                    {options.length > 2 && (
                                        <button
                                            onClick={() => removeOption(index)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                        >
                                            <FaTimes />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Option Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={addOption}
                            className="bg-[#00BDF8] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm hover:bg-[#009bc9] transition-colors"
                        >
                            항목 추가
                        </button>
                    </div>

                    <div className="border-t border-gray-100 my-4 pt-4 flex justify-between items-start">
                        {/* Checkboxes */}
                        <div className="space-y-3">
                            <label className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => setAllowMultiple(!allowMultiple)}>
                                {allowMultiple ? (
                                    <FaCheckSquare className="text-[#003C48] text-lg" />
                                ) : (
                                    <FaSquare className="text-gray-300 text-lg" />
                                )}
                                <span className="text-[#003C48] font-medium">복수 선택 허용</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => setIsAnonymous(!isAnonymous)}>
                                {isAnonymous ? (
                                    <FaCheckSquare className="text-[#003C48] text-lg" />
                                ) : (
                                    <FaSquare className="text-gray-300 text-lg" />
                                )}
                                <span className="text-[#003C48] font-medium">익명</span>
                            </label>
                        </div>

                        {/* Date Picker */}
                        <div className="flex flex-col items-end">
                            <span className="text-[#003C48] font-medium mb-1.5">투표 종료 시간</span>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="bg-gray-100 text-xs text-gray-600 rounded-lg px-3 py-2 focus:outline-none border border-transparent focus:border-[#00BDF8]"
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Button */}
                <div className="p-5 pt-0 mt-auto">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-[#00BDF8] text-white py-3.5 rounded-[15px] text-lg font-bold shadow-md hover:bg-[#009bc9] transition-transform active:scale-[0.98]"
                    >
                        투표 올리기
                    </button>
                </div>

                {/* Common Modal for Alerts */}
                <CommonModal
                    isOpen={isAlertOpen}
                    type="alert"
                    message={alertMessage}
                    onConfirm={() => setIsAlertOpen(false)}
                />

            </div>
        </div>
    );
};

export default VoteCreationModal;
