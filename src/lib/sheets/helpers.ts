import { getSheetsClient } from './client';
import type { SubmissionRow, SubmissionItemRow } from '@/types';

// ============================================================
// Sheet tab names — constants
// ============================================================
const SHEET = {
    SETTINGS: 'cài_đặt',
    CATEGORIES: 'danh_mục',
    SUBMISSIONS: 'đăng_ký',
    SUBMISSION_ITEMS: 'chi_tiết_đăng_ký',
    AUDIT_LOGS: 'nhật_ký',
    SUMMARY: 'Tổng hợp đăng ký',
} as const;

// ============================================================
// Low-level helpers
// ============================================================

async function appendRows(sheetName: string, rows: string[][]) {
    const { sheets, spreadsheetId } = await getSheetsClient();
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${sheetName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rows },
    });
}

async function readRows(sheetName: string): Promise<string[][]> {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A:Z`,
    });
    return (res.data.values as string[][]) || [];
}

// ============================================================
// Summary sheet — formatted output matching sample
// ============================================================

export async function getNextSTT(): Promise<number> {
    try {
        const rows = await readRows(SHEET.SUMMARY);
        // Find the last row with a number in column A
        let maxSTT = 0;
        for (const row of rows) {
            const num = parseInt(row[0], 10);
            if (!isNaN(num) && num > maxSTT) maxSTT = num;
        }
        return maxSTT + 1;
    } catch {
        return 1;
    }
}

export async function appendSummaryRow(row: string[]) {
    await appendRows(SHEET.SUMMARY, [row]);
}

// ============================================================
// Submission helpers (structured data)
// ============================================================

const SUBMISSION_COLUMNS: (keyof SubmissionRow)[] = [
    'submission_id', 'submission_code', 'created_at', 'updated_at', 'status',
    'ceremony_type', 'ceremony_label',
    'applicant_name', 'applicant_phone', 'applicant_dao_trang', 'applicant_to',
    'total_items', 'categories_text', 'applicant_payload_json', 'source', 'notes',
];

const ITEM_COLUMNS: (keyof SubmissionItemRow)[] = [
    'item_id', 'submission_id', 'item_index', 'category_key', 'category_label',
    'created_at', 'updated_at', 'display_name', 'summary_text', 'subject_name',
    'reference_value', 'item_payload_json', 'status',
];

export async function appendSubmission(row: SubmissionRow) {
    const values = SUBMISSION_COLUMNS.map((col) => row[col] || '');
    await appendRows(SHEET.SUBMISSIONS, [values]);
}

export async function appendSubmissionItems(rows: SubmissionItemRow[]) {
    const values = rows.map((row) =>
        ITEM_COLUMNS.map((col) => row[col] || '')
    );
    await appendRows(SHEET.SUBMISSION_ITEMS, values);
}

export async function appendAuditLog(row: { log_id: string; submission_id: string; action: string; created_at: string; detail: string }) {
    const values = [row.log_id, row.submission_id, row.action, row.created_at, row.detail];
    await appendRows(SHEET.AUDIT_LOGS, [values]);
}

// ============================================================
// Read helpers (admin)
// ============================================================

export async function listSubmissions(): Promise<Record<string, string>[]> {
    const rows = await readRows(SHEET.SUBMISSIONS);
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
    });
}

export async function listSubmissionItems(): Promise<Record<string, string>[]> {
    const rows = await readRows(SHEET.SUBMISSION_ITEMS);
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
    });
}

export async function getSubmissionById(submissionId: string) {
    const submissions = await listSubmissions();
    const submission = submissions.find(
        (s) => s.submission_id === submissionId || s.submission_code === submissionId
    );
    if (!submission) return null;
    const allItems = await listSubmissionItems();
    const items = allItems.filter((item) => item.submission_id === submission.submission_id);
    return { submission, items };
}

export async function readSettings(): Promise<Record<string, string>> {
    const rows = await readRows(SHEET.SETTINGS);
    const settings: Record<string, string> = {};
    rows.slice(1).forEach((row) => {
        if (row[0]) settings[row[0]] = row[1] || '';
    });
    return settings;
}

// ============================================================
// Per-form-type sheet — auto-create and append
// ============================================================

/**
 * Writes a row to a sheet named after the form type label.
 * Auto-creates the sheet + headers if it doesn't exist.
 * 
 * fieldConfigs: key → { label, separateColumn }
 *   - separateColumn=true → own column with header = label
 *   - separateColumn=false → grouped into "Chi tiết" column
 */
export async function appendToFormSheet(
    sheetLabel: string,
    applicant: { tinChu: string; phone: string; to?: string; notes?: string },
    formData: Record<string, unknown>,
    fieldConfigs: Record<string, { label: string; separateColumn: boolean }>,
) {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const tabName = `KQ_${sheetLabel}`.slice(0, 50);

    // Split into separate-column fields and grouped fields
    const allKeys = Object.keys(formData).filter(
        (k) => formData[k] !== undefined && formData[k] !== null
    );
    const separateKeys = allKeys.filter((k) => fieldConfigs[k]?.separateColumn);
    const groupedKeys = allKeys.filter((k) => !fieldConfigs[k]?.separateColumn);

    // Build label→key map for separate columns
    const labelToKey = new Map<string, string>();
    for (const k of separateKeys) {
        const label = fieldConfigs[k]?.label || k;
        labelToKey.set(label, k);
    }

    // Check if tab exists
    let tabExists = false;
    let existingHeaders: string[] = [];
    try {
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        tabExists = (meta.data.sheets || []).some(
            (s) => s.properties?.title === tabName
        );
        if (tabExists) {
            const headerRes = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `'${tabName}'!1:1`,
            });
            existingHeaders = (headerRes.data.values?.[0] || []) as string[];
        }
    } catch { /* ignore */ }

    // Fixed headers
    const fixedHeaders = ['STT', 'Ngày gửi', 'Tín chủ', 'SĐT', 'Tổ'];
    const separateLabels = separateKeys.map((k) => fieldConfigs[k]?.label || k);

    if (!tabExists) {
        // Create new tab with all headers
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: tabName } } }],
                },
            });
        } catch { /* race */ }

        const allHeaders = [...fixedHeaders, ...separateLabels];
        if (groupedKeys.length > 0) allHeaders.push('Chi tiết');

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${tabName}'!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [allHeaders] },
        });

        existingHeaders = allHeaders;
    } else {
        // Tab exists → add any new separate column headers that don't exist yet
        const newLabels = separateLabels.filter(
            (label) => !existingHeaders.includes(label)
        );
        // Also ensure "Chi tiết" column exists if needed
        const needChiTiet = groupedKeys.length > 0 && !existingHeaders.includes('Chi tiết');

        if (newLabels.length > 0 || needChiTiet) {
            const toAdd = [...newLabels];
            if (needChiTiet) toAdd.push('Chi tiết');
            const startCol = String.fromCharCode(65 + existingHeaders.length);
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${tabName}'!${startCol}1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [toAdd] },
            });
            existingHeaders = [...existingHeaders, ...toAdd];
        }
    }

    // STT
    let stt = 1;
    try {
        const existing = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${tabName}'!A:A`,
        });
        stt = Math.max((existing.data.values?.length || 1) - 1, 0) + 1;
    } catch { /* starts at 1 */ }

    // Format value helper
    const fmt = (v: unknown, fieldKey?: string): string => {
        if (v === true) return 'Có';
        if (v === false) return 'Không';
        if (Array.isArray(v)) {
            // Array of objects (group data) → format each item with sub-field labels
            if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null) {
                const items = v as Record<string, unknown>[];
                return items.map((item, idx) => {
                    const parts = Object.entries(item)
                        .filter(([, sv]) => sv !== undefined && sv !== null && sv !== '')
                        .map(([sk, sv]) => {
                            const subLabel = fieldKey
                                ? (fieldConfigs[`${fieldKey}.${sk}`]?.label || fieldConfigs[sk]?.label || sk)
                                : sk;
                            return `${subLabel}: ${Array.isArray(sv) ? (sv as string[]).join(', ') : String(sv)}`;
                        });
                    return `${idx + 1}. ${parts.join(' — ')}`;
                }).join('\n');
            }
            // Array of strings
            return v.join(', ');
        }
        if (typeof v === 'object' && v !== null) {
            // Single object → format key:value pairs
            return Object.entries(v)
                .filter(([, sv]) => sv !== undefined && sv !== null && sv !== '')
                .map(([sk, sv]) => `${sk}: ${String(sv)}`)
                .join(', ');
        }
        return String(v || '');
    };

    // Build row by matching to existing header positions
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const row: string[] = new Array(existingHeaders.length).fill('');

    // Fixed columns
    const fixedValues = [String(stt), now, applicant.tinChu, "'" + applicant.phone, applicant.to || ''];
    for (let i = 0; i < fixedValues.length && i < existingHeaders.length; i++) {
        row[i] = fixedValues[i];
    }

    // Separate column values → put in correct header position
    for (const k of separateKeys) {
        const label = fieldConfigs[k]?.label || k;
        const colIdx = existingHeaders.indexOf(label);
        if (colIdx >= 0) {
            row[colIdx] = fmt(formData[k], k);
        }
    }

    // Grouped "Chi tiết" column
    if (groupedKeys.length > 0) {
        const chiTietIdx = existingHeaders.indexOf('Chi tiết');
        const groupedText = groupedKeys
            .filter((k) => {
                const v = formData[k];
                if (v === false || v === '' || v === null || v === undefined) return false;
                if (Array.isArray(v) && v.length === 0) return false;
                return true;
            })
            .map((k) => {
                const v = formData[k];
                const label = fieldConfigs[k]?.label || k;

                // Group data: array of objects
                if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null) {
                    const items = v as Record<string, unknown>[];
                    const itemLines = items.map((item, idx) => {
                        const parts = Object.entries(item)
                            .filter(([, sv]) => sv !== undefined && sv !== null && sv !== '')
                            .map(([sk, sv]) => {
                                const subLabel = fieldConfigs[`${k}.${sk}`]?.label || fieldConfigs[sk]?.label || sk;
                                return `${subLabel}: ${Array.isArray(sv) ? (sv as string[]).join(', ') : String(sv)}`;
                            });
                        return `  ${idx + 1}. ${parts.join(' — ')}`;
                    });
                    return `${label}:\n${itemLines.join('\n')}`;
                }

                return `${label}: ${fmt(v)}`;
            })
            .join('\n');

        if (chiTietIdx >= 0) {
            row[chiTietIdx] = groupedText;
        } else {
            row.push(groupedText);
        }
    }

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${tabName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
    });
}

