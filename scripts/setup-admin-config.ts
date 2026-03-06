// Setup admin configuration in Google Sheets
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

async function getExistingSheets(): Promise<string[]> {
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    return (res.data.sheets || []).map((s) => s.properties?.title || '');
}

async function createSheetIfNotExists(title: string) {
    const existing = await getExistingSheets();
    if (existing.includes(title)) {
        console.log(`  ✅ Tab "${title}" đã tồn tại`);
        return;
    }
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
    console.log(`  ✅ Đã tạo tab "${title}"`);
}

async function main() {
    console.log('\n🔧 Thiết lập Admin Configuration...\n');

    // 1. Add settings rows
    console.log('📝 Thêm settings mới...');
    const newSettings = [
        ['registration_open', 'true'],
        ['registration_close_message', 'Đăng ký đã đóng. Vui lòng chờ đợt đăng ký tiếp theo.'],
        ['next_registration_date', ''],
        ['landing_title', 'Đăng Ký Cầu Siêu'],
        ['landing_subtitle', 'Hệ thống đăng ký trực tuyến — nhanh chóng, dễ dàng, chính xác.'],
        ['landing_notes', '• Nếu đã có Pháp danh thì ghi Pháp danh\n• Ngày mất ghi theo ngày âm lịch\n• Thông tin được bảo mật và chỉ dùng cho mục đích đăng ký'],
        ['form_warning', ''],
    ];

    // Read existing settings to avoid duplicates
    const existing = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'settings'!A:A",
    });
    const existingKeys = (existing.data.values || []).flat();

    const toAdd = newSettings.filter(([key]) => !existingKeys.includes(key));
    if (toAdd.length > 0) {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "'settings'!A:B",
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: toAdd },
        });
        console.log(`  ✅ Đã thêm ${toAdd.length} settings`);
    } else {
        console.log('  ✅ Tất cả settings đã tồn tại');
    }

    // 2. Create registration_types sheet
    await createSheetIfNotExists('registration_types');
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "'registration_types'!A1",
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [
                ['key', 'Tên hiển thị', 'Mô tả ngắn', 'Icon', 'Đang mở', 'Thứ tự', 'Loại form'],
            ],
        },
    });
    console.log('  📝 Đã ghi header cho "registration_types"');

    // Check if any rows exist
    const regTypes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'registration_types'!A2:A",
    });
    if (!regTypes.data.values || regTypes.data.values.length === 0) {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "'registration_types'!A:G",
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [
                    ['cau_sieu', 'Đăng ký Cầu Siêu', 'Đăng ký danh sách cầu siêu hương linh', '🙏', 'TRUE', '1', 'cau_sieu'],
                ],
            },
        });
        console.log('  ✅ Đã thêm loại đăng ký mặc định: Cầu Siêu');
    }

    console.log('\n🎉 Hoàn tất Admin Configuration!\n');
    console.log('📋 Admin có thể tuỳ chỉnh trong Google Sheet:');
    console.log('   • Tab "settings" → khoá/mở đăng ký, ghi chú, tiêu đề');
    console.log('   • Tab "registration_types" → thêm/bật/tắt loại đăng ký\n');
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
