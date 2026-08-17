import React from 'react';

// 국내 주요 은행 목록
export const BANK_OPTIONS = [
    '직접 입력',
    'KB국민은행',
    '신한은행',
    '우리은행',
    '하나은행',
    'NH농협은행',
    'IBK기업은행',
    '카카오뱅크',
    '토스뱅크',
    '케이뱅크',
    'SC제일은행',
    '씨티은행',
    '우체국',
    '새마을금고',
    '신협',
    '수협은행',
    '광주은행',
    '전북은행',
    '대구은행(iM뱅크)',
    '부산은행',
    '경남은행',
    '제주은행',
    'KDB산업은행',
    '산림조합',
    '저축은행'
];

export interface BankAccountData {
    bankNm: string;
    accountNo: string;
    accountHolderNm: string;
}

interface BankAccountInputGroupProps {
    bankNm: string;
    accountNo: string;
    accountHolderNm: string;
    onChangeBankNm: (value: string) => void;
    onChangeAccountNo: (value: string) => void;
    onChangeAccountHolderNm: (value: string) => void;
    required?: boolean;
    title?: string;
    description?: string;
}

export const BankAccountInputGroup: React.FC<BankAccountInputGroupProps> = ({
    bankNm,
    accountNo,
    accountHolderNm,
    onChangeBankNm,
    onChangeAccountNo,
    onChangeAccountHolderNm,
    required = false,
    title = '정산 / 입금 계좌 정보',
    description = '정산금 지급 및 입금 처리를 위한 계좌 정보를 입력해주세요.'
}) => {
    // 은행 선택 드롭다운 상태
    const isKnownBank = BANK_OPTIONS.filter(b => b !== '직접 입력').includes(bankNm);
    const selectValue = isKnownBank ? bankNm : (bankNm ? '직접 입력' : '');

    const handleSelectBank = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '직접 입력') {
            if (isKnownBank) {
                onChangeBankNm('');
            }
        } else {
            onChangeBankNm(val);
        }
    };

    // 계좌번호: 숫자만 허용
    const handleAccountNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const onlyNumbers = e.target.value.replace(/\D/g, '');
        onChangeAccountNo(onlyNumbers);
    };

    return (
        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100/80 flex flex-col gap-3.5 transition-all">
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm">💳</span>
                    <h3 className="text-xs font-bold text-[#003C48]">
                        {title} {required && <span className="text-red-500">*</span>}
                    </h3>
                </div>
                {description && (
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{description}</p>
                )}
            </div>

            {/* 은행명 입력/선택 */}
            <div>
                <label className="block text-[11px] font-semibold text-[#003C48] mb-1">
                    은행명 {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex gap-2">
                    <select
                        value={selectValue}
                        onChange={handleSelectBank}
                        className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#00BDF8] transition-all"
                    >
                        <option value="">은행 선택</option>
                        {BANK_OPTIONS.filter(b => b !== '직접 입력').map((b) => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="직접 입력">직접 입력</option>
                    </select>

                    {(!isKnownBank || selectValue === '직접 입력') && (
                        <input
                            type="text"
                            value={bankNm}
                            onChange={(e) => onChangeBankNm(e.target.value)}
                            placeholder="은행명 직접 입력"
                            className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#00BDF8] transition-all"
                            required={required}
                        />
                    )}
                </div>
            </div>

            {/* 계좌번호 (숫자만) */}
            <div>
                <label className="block text-[11px] font-semibold text-[#003C48] mb-1">
                    계좌번호 <span className="text-[10px] text-gray-400 font-normal">(- 없이 숫자만 입력)</span> {required && <span className="text-red-500">*</span>}
                </label>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={accountNo}
                    onChange={handleAccountNoChange}
                    placeholder="계좌번호 (- 제외 숫자만)"
                    maxLength={30}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#00BDF8] transition-all"
                    required={required}
                />
            </div>

            {/* 예금주명(입금자명) */}
            <div>
                <label className="block text-[11px] font-semibold text-[#003C48] mb-1">
                    예금주명(입금받는자명) {required && <span className="text-red-500">*</span>}
                </label>
                <input
                    type="text"
                    value={accountHolderNm}
                    onChange={(e) => onChangeAccountHolderNm(e.target.value)}
                    placeholder="예: 홍길동 (또는 상호/법인명)"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#00BDF8] transition-all"
                    required={required}
                />
            </div>
        </div>
    );
};

export default BankAccountInputGroup;
