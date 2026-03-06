// Setup script to create Google Sheet tabs with Vietnamese headers
// Run with: npx tsx scripts/setup-sheets.ts

import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

if (!clientEmail || !privateKey || !spreadsheetId) {
    console.error('❌ Missing env vars. Check .env.local');
    process.exit(1);
}

const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function getExistingSheets(): Promise<string[]> {
    const res = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
    return (res.data.sheets || []).map((s) => s.properties?.title || '');
}

async function createSheetIfNotExists(title: string) {
    const existing = await getExistingSheets();
    if (existing.includes(title)) {
        console.log(`  ✅ Tab "${title}" đã tồn tại`);
        return;
    }
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId!,
        requestBody: {
            requests: [{ addSheet: { properties: { title } } }],
        },
    });
    console.log(`  ✅ Đã tạo tab "${title}"`);
}

async function setHeaders(sheetName: string, headers: string[]) {
    await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId!,
        range: `'${sheetName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
    });
    console.log(`  📝 Đã ghi header cho "${sheetName}"`);
}

async function main() {
    console.log('\n🔧 Thiết lập Google Sheet tabs...\n');

    // 1. Tổng hợp đăng ký (formatted output)
    await createSheetIfNotExists('Tổng hợp đăng ký');
    await setHeaders('Tổng hợp đăng ký', [
        'STT',
        'TÍN CHỦ/PHẬT TỬ',
        'SỐ ĐIỆN THOẠI',
        'TỔ',
        'NỘI DUNG ĐĂNG KÝ',
    ]);

    // 2. submissions (structured data)
    await createSheetIfNotExists('submissions');
    await setHeaders('submissions', [
        'Mã đăng ký (ID)', 'Mã tra cứu', 'Ngày tạo', 'Ngày cập nhật', 'Trạng thái',
        'Loại cầu siêu', 'Tên loại cầu siêu',
        'Tín chủ/Phật tử', 'Số điện thoại', 'Đạo tràng/Nhóm',
        'Tổng số mục', 'Danh sách loại mục', 'Dữ liệu tín chủ (JSON)', 'Nguồn', 'Ghi chú',
    ]);

    // 3. submission_items (structured item data)
    await createSheetIfNotExists('submission_items');
    await setHeaders('submission_items', [
        'Mã mục (ID)', 'Mã đăng ký (ID)', 'STT mục', 'Loại mục (key)', 'Tên loại mục',
        'Ngày tạo', 'Ngày cập nhật', 'Tên hiển thị', 'Tóm tắt', 'Tên đối tượng',
        'Giá trị tham chiếu', 'Dữ liệu chi tiết (JSON)', 'Trạng thái',
    ]);

    // 4. audit_logs
    await createSheetIfNotExists('audit_logs');
    await setHeaders('audit_logs', [
        'Mã log (ID)', 'Mã đăng ký (ID)', 'Hành động', 'Thời gian', 'Chi tiết',
    ]);

    // 5. settings
    await createSheetIfNotExists('settings');
    await setHeaders('settings', ['Tên cài đặt', 'Giá trị']);
    // Seed default settings
    await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId!,
        range: `'settings'!A2`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values: [
                ['app_name', 'Đăng Ký Cầu Siêu'],
                ['admin_password', 'admin123'],
            ],
        },
    });
    console.log('  📝 Đã ghi cài đặt mặc định');

    console.log('\n🎉 Hoàn tất! Google Sheet đã sẵn sàng.\n');
}

main().catch((err) => {
    console.error('❌ Lỗi:', err.message);
    if (err.message.includes('not found')) {
        console.error('\n⚠️  Hãy chắc chắn đã Share Google Sheet cho:', clientEmail);
    }
    process.exit(1);
});
