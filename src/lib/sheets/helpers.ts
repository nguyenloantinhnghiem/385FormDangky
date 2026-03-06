import { getSheetsClient } from './client';
import type { SubmissionRow, SubmissionItemRow } from '@/types';

// ============================================================
// Sheet tab names — constants
// ============================================================
const SHEET = {
    SETTINGS: 'settings',
    CATEGORIES: 'categories',
    SUBMISSIONS: 'submissions',
    SUBMISSION_ITEMS: 'submission_items',
    AUDIT_LOGS: 'audit_logs',
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
    'applicant_name', 'applicant_phone', 'applicant_dao_trang',
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
