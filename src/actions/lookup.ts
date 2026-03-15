'use server';

import { getSheetsClient } from '@/lib/sheets/client';
import { getRegistrationTypes, type RegistrationType } from '@/actions/settings';

interface LookupResult {
    submissions: LookupSubmission[];
    registrationTypes: RegistrationType[];
}

interface LookupSubmission {
    submissionId: string;
    submissionCode: string;
    createdAt: string;
    ceremonyType: string;
    ceremonyLabel: string;
    applicantName: string;
    applicantPhone: string;
    applicantTo: string;
    totalItems: string;
    categoriesText: string;
    registrationLabel: string;
    itemsData: {
        categoryKey: string;
        categoryLabel: string;
        displayName: string;
        summaryText: string;
        payloadJson: string;
    }[];
}

/**
 * Normalize a phone number for comparison
 */
function normalizePhone(p: string): string {
    let clean = p.replace(/[\s\-().'+]/g, '').trim();
    // Remove leading +84 and replace with 0
    if (clean.startsWith('84') && clean.length >= 11) clean = '0' + clean.slice(2);
    if (clean.startsWith('+84')) clean = '0' + clean.slice(3);
    // Add leading 0 if missing
    if (/^\d{9}$/.test(clean)) clean = '0' + clean;
    return clean;
}

/**
 * Read a sheet tab as array of header-mapped records
 */
async function readSheetAsRecords(tabName: string): Promise<Record<string, string>[]> {
    try {
        const { sheets, spreadsheetId } = await getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${tabName}'!A:Z`,
        });
        const rows = (res.data.values as string[][]) || [];
        if (rows.length < 2) return [];
        const headers = rows[0];
        return rows.slice(1)
            .filter(row => row.some(cell => cell?.trim())) // skip fully empty rows
            .map((row) => {
                const obj: Record<string, string> = {};
                headers.forEach((h, i) => { obj[h] = row[i] || ''; });
                return obj;
            });
    } catch (err) {
        console.error(`[Lookup] Failed to read tab "${tabName}":`, err);
        return [];
    }
}

/**
 * Get value from a record trying multiple possible header names
 */
function get(row: Record<string, string>, ...keys: string[]): string {
    for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== '') return v;
    }
    return '';
}

/**
 * Find phone in a record checking all phone-like columns
 */
function getPhone(row: Record<string, string>): string {
    // Try known headers first, then any header containing 'phone' or 'SĐT'
    const explicit = get(row,
        'applicant_phone', 'SĐT', 'Số điện thoại',
        'phone', 'Điện thoại', 'sdt'
    );
    if (explicit) return explicit;

    // Fallback: search all keys
    for (const [key, val] of Object.entries(row)) {
        const k = key.toLowerCase();
        if ((k.includes('phone') || k.includes('sdt') || k.includes('điện thoại')) && val) {
            return val;
        }
    }
    return '';
}

export async function lookupByPhone(phone: string, formTypeFilter?: string): Promise<LookupResult> {
    try {
        const searchPhone = normalizePhone(phone);
        if (!searchPhone || searchPhone.length < 8) {
            return { submissions: [], registrationTypes: [] };
        }

        // Read both structured (đăng_ký) and summary (Tổng hợp) tabs in parallel
        const [structuredRows, structuredItems, summaryRows, regTypes] = await Promise.all([
            readSheetAsRecords('đăng_ký'),
            readSheetAsRecords('chi_tiết_đăng_ký'),
            readSheetAsRecords('Tổng hợp đăng ký'),
            getRegistrationTypes(),
        ]);

        const results: LookupSubmission[] = [];
        const seenIds = new Set<string>();

        // 1. Search structured submissions (đăng_ký tab)
        for (const s of structuredRows) {
            const sPhone = normalizePhone(getPhone(s));
            if (sPhone !== searchPhone) continue;

            const subId = get(s, 'submission_id', 'Mã đăng ký', 'Mã đăng ký (ID)');
            const ceremonyType = get(s, 'ceremony_type', 'Loại lễ', 'Loại đăng ký');
            const ceremonyLabel = get(s, 'ceremony_label', 'Tên loại lễ', 'Tên đăng ký');

            // Apply form type filter
            if (formTypeFilter) {
                if (ceremonyType !== formTypeFilter && ceremonyLabel !== formTypeFilter) continue;
            }

            // Get items for this submission
            const items = structuredItems
                .filter(item => get(item, 'submission_id', 'Mã đăng ký') === subId)
                .map(item => ({
                    categoryKey: get(item, 'category_key', 'Mã danh mục'),
                    categoryLabel: get(item, 'category_label', 'Tên danh mục', 'Tên loại mục'),
                    displayName: get(item, 'display_name', 'Tên hiển thị'),
                    summaryText: get(item, 'summary_text', 'Tóm tắt'),
                    payloadJson: get(item, 'item_payload_json', 'Dữ liệu JSON'),
                }));

            const submission: LookupSubmission = {
                submissionId: subId,
                submissionCode: get(s, 'submission_code', 'Mã tra cứu'),
                createdAt: get(s, 'created_at', 'Ngày tạo'),
                ceremonyType,
                ceremonyLabel,
                applicantName: get(s, 'applicant_name', 'Tên tín chủ', 'Tín chủ/Phật tử', 'Tín chủ'),
                applicantPhone: get(s, 'applicant_phone', 'SĐT', 'Số điện thoại'),
                applicantTo: get(s, 'applicant_to', 'Tổ', 'Thuộc tổ'),
                totalItems: get(s, 'total_items', 'Số mục', 'Tổng số mục') || String(items.length),
                categoriesText: get(s, 'categories_text', 'Danh mục', 'Danh sách loại mục'),
                registrationLabel: ceremonyLabel || ceremonyType,
                itemsData: items,
            };

            seenIds.add(subId);
            results.push(submission);
        }

        // 2. Search summary tab (Tổng hợp đăng ký) for entries not in structured
        for (const s of summaryRows) {
            const sPhone = normalizePhone(get(s, 'SĐT', 'Số điện thoại', 'applicant_phone'));
            if (sPhone !== searchPhone) continue;

            // Skip if STT is empty (empty row)
            const stt = get(s, 'STT');
            if (!stt) continue;

            // Check if already found in structured
            const summaryId = `summary_${stt}`;

            const regLabel = get(s, 'Loại đăng ký', 'Loại lễ');

            if (formTypeFilter && regLabel !== formTypeFilter) continue;

            // Check if this entry already exists in results (by matching name + date)
            const applicantName = get(s, 'Tín chủ', 'Tín chủ/Phật tử');
            const alreadyFound = results.some(r =>
                r.applicantName === applicantName && r.registrationLabel === regLabel
            );
            if (alreadyFound) continue;

            const chiTiet = get(s, 'Chi tiết', 'Nội dung');

            results.push({
                submissionId: summaryId,
                submissionCode: `TH-${stt}`,
                createdAt: get(s, 'Ngày gửi', 'Ngày tạo') || '',
                ceremonyType: regLabel,
                ceremonyLabel: regLabel,
                applicantName,
                applicantPhone: sPhone,
                applicantTo: get(s, 'Tổ', 'Thuộc tổ'),
                totalItems: '1',
                categoriesText: regLabel,
                registrationLabel: regLabel,
                itemsData: chiTiet ? [{
                    categoryKey: regLabel,
                    categoryLabel: regLabel,
                    displayName: regLabel,
                    summaryText: chiTiet.slice(0, 200),
                    payloadJson: JSON.stringify({ chi_tiet: chiTiet }),
                }] : [],
            });
        }

        // Sort by date descending
        results.sort((a, b) => {
            try {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } catch {
                return 0;
            }
        });

        return { submissions: results, registrationTypes: regTypes };
    } catch (err) {
        console.error('[Lookup] Error:', err);
        return { submissions: [], registrationTypes: [] };
    }
}
