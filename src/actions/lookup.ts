'use server';

import { listSubmissions, listSubmissionItems } from '@/lib/sheets/helpers';
import { getRegistrationTypes, type RegistrationType } from '@/actions/settings';

interface LookupResult {
    submissions: {
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
    }[];
    registrationTypes: RegistrationType[];
}

// Helper: get value from row object trying multiple possible header names
function get(row: Record<string, string>, ...keys: string[]): string {
    for (const k of keys) {
        if (row[k]) return row[k];
    }
    return '';
}

export async function lookupByPhone(phone: string, formTypeFilter?: string): Promise<LookupResult> {
    try {
        const normalizePhone = (p: string) => {
            let clean = p.replace(/\s+/g, '').replace(/^'/, '').replace(/^\+84/, '0');
            if (/^\d{9}$/.test(clean)) clean = '0' + clean;
            return clean;
        };

        const searchPhone = normalizePhone(phone);
        const [allSubmissions, allItems, regTypes] = await Promise.all([
            listSubmissions(),
            listSubmissionItems(),
            getRegistrationTypes(),
        ]);

        let matched = allSubmissions.filter((s) => {
            const sPhone = normalizePhone(get(s, 'SĐT', 'Số điện thoại', 'applicant_phone'));
            return sPhone === searchPhone;
        });

        // Filter by form type if specified
        if (formTypeFilter) {
            matched = matched.filter((s) => {
                const ct = get(s, 'Loại lễ', 'Loại cầu siêu', 'ceremony_type', 'Loại đăng ký');
                const cl = get(s, 'Tên loại lễ', 'Tên loại cầu siêu', 'ceremony_label', 'Tên đăng ký');
                return ct === formTypeFilter || cl === formTypeFilter;
            });
        }

        const submissions = matched.map((s) => {
            const subId = get(s, 'Mã đăng ký', 'Mã đăng ký (ID)', 'submission_id');
            const items = allItems
                .filter((item) => get(item, 'Mã đăng ký', 'Mã đăng ký (ID)', 'submission_id') === subId)
                .map((item) => ({
                    categoryKey: get(item, 'Mã danh mục', 'Loại mục (key)', 'category_key'),
                    categoryLabel: get(item, 'Tên danh mục', 'Tên loại mục', 'category_label'),
                    displayName: get(item, 'Tên hiển thị', 'display_name'),
                    summaryText: get(item, 'Tóm tắt', 'summary_text'),
                    payloadJson: get(item, 'Dữ liệu JSON', 'Dữ liệu chi tiết (JSON)', 'item_payload_json'),
                }));

            return {
                submissionId: subId,
                submissionCode: get(s, 'Mã tra cứu', 'submission_code'),
                createdAt: get(s, 'Ngày tạo', 'created_at'),
                ceremonyType: get(s, 'Loại lễ', 'Loại cầu siêu', 'ceremony_type'),
                ceremonyLabel: get(s, 'Tên loại lễ', 'Tên loại cầu siêu', 'ceremony_label'),
                applicantName: get(s, 'Tên tín chủ', 'Tín chủ/Phật tử', 'applicant_name'),
                applicantPhone: get(s, 'SĐT', 'Số điện thoại', 'applicant_phone'),
                applicantTo: get(s, 'Tổ', 'Thuộc tổ', 'applicant_to'),
                totalItems: get(s, 'Số mục', 'Tổng số mục', 'total_items') || '0',
                categoriesText: get(s, 'Danh mục', 'Danh sách loại mục', 'categories_text'),
                registrationLabel: get(s, 'Tên loại lễ', 'Tên loại cầu siêu', 'ceremony_label') || get(s, 'Tên đăng ký'),
                itemsData: items,
            };
        });

        return { submissions, registrationTypes: regTypes };
    } catch (err) {
        console.error('Lookup error:', err);
        return { submissions: [], registrationTypes: [] };
    }
}
