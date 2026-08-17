/**
 * 은행 및 계좌번호 자리수에 맞춰 하이픈(-) 포맷팅을 적용합니다.
 */
export function formatAccountNumber(accountNo?: string | null, bankNm?: string | null): string {
    if (!accountNo) return '';
    // 이미 하이픈이 들어있는 경우 그대로 반환
    if (accountNo.includes('-')) return accountNo;

    const clean = accountNo.replace(/\D/g, '');
    if (!clean) return accountNo;

    const bank = (bankNm || '').trim();

    // 1. 카카오뱅크 (13자리: 3333-XX-XXXXXXX)
    if (bank.includes('카카오') && clean.length === 13) {
        return clean.replace(/^(\d{4})(\d{2})(\d{7})$/, '$1-$2-$3');
    }

    // 2. 토스뱅크 (12자리: 1000-XXXX-XXXX)
    if (bank.includes('토스') && clean.length === 12) {
        return clean.replace(/^(\d{4})(\d{4})(\d{4})$/, '$1-$2-$3');
    }

    // 3. 케이뱅크 (12자리: 100-XXX-XXXXXX)
    if (bank.includes('케이') && clean.length === 12) {
        return clean.replace(/^(\d{3})(\d{3})(\d{6})$/, '$1-$2-$3');
    }

    // 4. KB국민은행
    if (bank.includes('국민') || bank.includes('KB')) {
        if (clean.length === 14) return clean.replace(/^(\d{6})(\d{2})(\d{6})$/, '$1-$2-$3');
        if (clean.length === 12) return clean.replace(/^(\d{3})(\d{2})(\d{7})$/, '$1-$2-$3');
    }

    // 5. 신한은행
    if (bank.includes('신한')) {
        if (clean.length === 12) return clean.replace(/^(\d{3})(\d{3})(\d{6})$/, '$1-$2-$3');
        if (clean.length === 11) return clean.replace(/^(\d{3})(\d{2})(\d{6})$/, '$1-$2-$3');
    }

    // 6. 우리은행 (13자리: 1002-XXX-XXXXXX)
    if (bank.includes('우리')) {
        if (clean.length === 13) return clean.replace(/^(\d{4})(\d{3})(\d{6})$/, '$1-$2-$3');
    }

    // 7. 하나은행 (14자리: XXX-XXXXXX-XXXXX)
    if (bank.includes('하나')) {
        if (clean.length === 14) return clean.replace(/^(\d{3})(\d{6})(\d{5})$/, '$1-$2-$3');
    }

    // 8. NH농협은행
    if (bank.includes('농협') || bank.includes('NH')) {
        if (clean.length === 13) return clean.replace(/^(\d{3})(\d{4})(\d{4})(\d{2})$/, '$1-$2-$3-$4');
        if (clean.length === 11) return clean.replace(/^(\d{3})(\d{2})(\d{6})$/, '$1-$2-$3');
    }

    // 9. IBK기업은행
    if (bank.includes('기업') || bank.includes('IBK')) {
        if (clean.length === 14) return clean.replace(/^(\d{3})(\d{6})(\d{2})(\d{3})$/, '$1-$2-$3-$4');
        if (clean.length === 12) return clean.replace(/^(\d{3})(\d{6})(\d{3})$/, '$1-$2-$3');
    }

    // 10. 우체국 (13자리)
    if (bank.includes('우체국') && clean.length === 13) {
        return clean.replace(/^(\d{6})(\d{2})(\d{5})$/, '$1-$2-$3');
    }

    // 11. 새마을금고 (13자리)
    if (bank.includes('새마을') && clean.length === 13) {
        return clean.replace(/^(\d{4})(\d{4})(\d{5})$/, '$1-$2-$3');
    }

    // 일반 자리수 기반 Fallback
    if (clean.length === 14) {
        return clean.replace(/^(\d{3})(\d{6})(\d{5})$/, '$1-$2-$3');
    }
    if (clean.length === 13) {
        return clean.replace(/^(\d{3})(\d{4})(\d{6})$/, '$1-$2-$3');
    }
    if (clean.length === 12) {
        return clean.replace(/^(\d{3})(\d{3})(\d{6})$/, '$1-$2-$3');
    }
    if (clean.length === 11) {
        return clean.replace(/^(\d{3})(\d{2})(\d{6})$/, '$1-$2-$3');
    }
    if (clean.length === 10) {
        return clean.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
    }

    return clean;
}
