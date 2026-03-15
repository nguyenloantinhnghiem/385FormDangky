'use server';

/**
 * Auto-migrate Google Sheet: adds missing tabs and updates headers
 * without overwriting existing data. This runs once after each deploy.
 * 
 * Called from the main page on first load.
 */

import { getSheetsClient } from '@/lib/sheets/client';

// Version bumped whenever Sheet structure changes
const SCHEMA_VERSION = 2;

interface TabDef {
    name: string;
    headers: string[];
    sampleData?: string[][];
}

const REQUIRED_TABS: TabDef[] = [
    {
        name: 'cài_đặt',
        headers: ['Khoá', 'Giá trị'],
        sampleData: [
            ['landing_title', '🙏 Hệ Thống Đăng Ký Trực Tuyến'],
            ['landing_subtitle', 'Chọn loại đăng ký phía dưới để bắt đầu'],
            ['video_url', ''],
            ['registration_open', 'TRUE'],
            ['registration_close_message', 'Đăng ký hiện đang đóng. Xin vui lòng quay lại sau.'],
            ['next_registration_date', ''],
            ['landing_notes', 'Vui lòng đăng ký đúng thời gian quy định'],
        ],
    },
    {
        name: 'loại_đăng_ký',
        headers: ['Mã loại', 'Tên hiển thị', 'Mô tả ngắn', 'Icon', 'Đang mở', 'Thứ tự', 'Mã form', 'Thuộc nhóm cha', 'Video hướng dẫn'],
    },
    {
        name: 'trường_biểu_mẫu',
        headers: ['Mã form', 'Nhóm', 'Mã trường', 'Tên trường', 'Loại trường', 'Bắt buộc', 'Gợi ý nhập', 'Các lựa chọn', 'Thứ tự', 'Ghi chú', 'Cột riêng', 'Điều kiện hiện'],
    },
    {
        name: 'đăng_ký',
        headers: ['submission_id', 'submission_code', 'created_at', 'updated_at', 'status', 'ceremony_type', 'ceremony_label', 'applicant_name', 'applicant_phone', 'applicant_dao_trang', 'applicant_to', 'total_items', 'categories_text', 'applicant_payload_json', 'source', 'notes'],
    },
    {
        name: 'chi_tiết_đăng_ký',
        headers: ['item_id', 'submission_id', 'item_index', 'category_key', 'category_label', 'created_at', 'updated_at', 'display_name', 'summary_text', 'subject_name', 'reference_value', 'item_payload_json', 'status'],
    },
    {
        name: 'nhật_ký',
        headers: ['log_id', 'submission_id', 'action', 'created_at', 'detail'],
    },
    {
        name: 'danh_mục',
        headers: ['Mã', 'Tên', 'Nhóm cha', 'Thứ tự'],
    },
    {
        name: 'Tổng hợp đăng ký',
        headers: ['STT', 'Loại đăng ký', 'Tín chủ', 'SĐT', 'Tổ', 'Chi tiết'],
    },
];

// Track whether migration has already run in this process
let migrationDone = false;

export async function runSheetMigration(): Promise<{ migrated: boolean; actions: string[] }> {
    // Only run once per process (server restart = new deploy)
    if (migrationDone) return { migrated: false, actions: [] };
    migrationDone = true;

    const actions: string[] = [];

    try {
        const { sheets, spreadsheetId } = await getSheetsClient();

        // 1. Check existing tabs
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const existingTabs = (meta.data.sheets || []).map(s => s.properties?.title || '');

        // 2. Check schema version in cài_đặt
        let currentVersion = 0;
        if (existingTabs.includes('cài_đặt')) {
            try {
                const res = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: "'cài_đặt'!A:B",
                });
                const rows = (res.data.values || []) as string[][];
                const versionRow = rows.find(r => r[0] === '_schema_version');
                if (versionRow) currentVersion = parseInt(versionRow[1] || '0', 10);
            } catch { /* ok */ }
        }

        // Already up to date
        if (currentVersion >= SCHEMA_VERSION) {
            return { migrated: false, actions: ['Đã cập nhật'] };
        }

        // 3. Create missing tabs + add headers
        for (const tab of REQUIRED_TABS) {
            if (!existingTabs.includes(tab.name)) {
                // Create tab
                try {
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        requestBody: {
                            requests: [{ addSheet: { properties: { title: tab.name } } }],
                        },
                    });
                } catch { /* may already exist */ }

                // Write headers
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `'${tab.name}'!A1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [tab.headers] },
                });

                // Write sample data
                if (tab.sampleData && tab.sampleData.length > 0) {
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: `'${tab.name}'!A2`,
                        valueInputOption: 'USER_ENTERED',
                        requestBody: { values: tab.sampleData },
                    });
                }

                actions.push(`Tạo tab "${tab.name}"`);
            } else {
                // Tab exists → check if headers need updating (add missing columns)
                try {
                    const headerRes = await sheets.spreadsheets.values.get({
                        spreadsheetId,
                        range: `'${tab.name}'!1:1`,
                    });
                    const existingHeaders = (headerRes.data.values?.[0] || []) as string[];

                    // Find headers that are in the definition but not in the sheet
                    const missingHeaders = tab.headers.filter(h => !existingHeaders.includes(h));

                    if (missingHeaders.length > 0) {
                        // Append missing headers to the right
                        const startCol = String.fromCharCode(65 + existingHeaders.length); // A=65
                        await sheets.spreadsheets.values.update({
                            spreadsheetId,
                            range: `'${tab.name}'!${startCol}1`,
                            valueInputOption: 'USER_ENTERED',
                            requestBody: { values: [missingHeaders] },
                        });
                        actions.push(`Thêm cột "${missingHeaders.join(', ')}" vào tab "${tab.name}"`);
                    }
                } catch { /* ok */ }
            }
        }

        // 4. Update schema version
        if (existingTabs.includes('cài_đặt') || actions.length > 0) {
            try {
                const res = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: "'cài_đặt'!A:B",
                });
                const rows = (res.data.values || []) as string[][];
                const versionRowIdx = rows.findIndex(r => r[0] === '_schema_version');

                if (versionRowIdx >= 0) {
                    // Update existing
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: `'cài_đặt'!B${versionRowIdx + 1}`,
                        valueInputOption: 'USER_ENTERED',
                        requestBody: { values: [[String(SCHEMA_VERSION)]] },
                    });
                } else {
                    // Append new row
                    await sheets.spreadsheets.values.append({
                        spreadsheetId,
                        range: "'cài_đặt'!A:B",
                        valueInputOption: 'USER_ENTERED',
                        requestBody: { values: [['_schema_version', String(SCHEMA_VERSION)]] },
                    });
                }
                actions.push(`Cập nhật schema v${SCHEMA_VERSION}`);
            } catch { /* ok */ }
        }

        console.log(`[Sheet Migration] v${currentVersion} → v${SCHEMA_VERSION}:`, actions);
        return { migrated: true, actions };
    } catch (err) {
        console.error('[Sheet Migration] Error:', err);
        return { migrated: false, actions: ['Lỗi: ' + String(err)] };
    }
}
