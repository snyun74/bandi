import React from 'react';

interface CommonModalProps {
    isOpen: boolean;
    type: 'alert' | 'confirm';
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

const CommonModal: React.FC<CommonModalProps> = ({ isOpen, type, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" style={{ fontFamily: '"Jua", sans-serif', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all duration-300 scale-100">
                <div className="p-8 text-center">
                    {/* Icon based on type */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
                        {type === 'alert' ? (
                            <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {type === 'alert' ? '알림' : '확인'}
                    </h3>
                    <p className="text-gray-500 mb-8 leading-relaxed break-keep">
                        {message}
                    </p>

                    <div className={`grid ${type === 'confirm' ? 'grid-cols-2 gap-3' : 'grid-cols-1'}`}>
                        {type === 'confirm' && (
                            <button
                                onClick={onCancel}
                                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                취소
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors duration-200 shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommonModal;
