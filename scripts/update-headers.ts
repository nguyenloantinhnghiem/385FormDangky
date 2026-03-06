// Update Google Sheet headers to include "TỔ" column
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

async function main() {
    console.log('\n📝 Cập nhật headers...\n');

    // Tổng hợp đăng ký — thêm cột TỔ
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'Tổng hợp đăng ký'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [['STT', 'TÍN CHỦ/PHẬT TỬ', 'SỐ ĐIỆN THOẠI', 'TỔ', 'NỘI DUNG ĐĂNG KÝ']],
        },
    });
    console.log('  ✅ Đã cập nhật header "Tổng hợp đăng ký" (thêm cột TỔ)');

    // submissions — thêm cột Thuộc tổ
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'submissions'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[
                'Mã đăng ký (ID)', 'Mã tra cứu', 'Ngày tạo', 'Ngày cập nhật', 'Trạng thái',
                'Loại cầu siêu', 'Tên loại cầu siêu',
                'Tín chủ/Phật tử', 'Số điện thoại', 'Đạo tràng/Nhóm', 'Thuộc tổ',
                'Tổng số mục', 'Danh sách loại mục', 'Dữ liệu tín chủ (JSON)', 'Nguồn', 'Ghi chú',
            ]],
        },
    });
    console.log('  ✅ Đã cập nhật header "submissions"');

    console.log('\n🎉 Hoàn tất!\n');
}

main().catch((err) => { console.error('❌ Lỗi:', err.message); process.exit(1); });
