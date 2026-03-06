// Setup form_fields Google Sheet tab for dynamic forms
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
    console.log('\n🔧 Thiết lập Form Fields...\n');

    await createSheetIfNotExists('form_fields');

    // Headers
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "'form_fields'!A1",
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[
                'form_type',    // khớp với cột "Loại form" trong registration_types
                'section',      // tên nhóm (để gom các trường)
                'field_key',    // key lưu data
                'field_label',  // nhãn hiển thị
                'field_type',   // text | textarea | select | checkbox | number | repeatable
                'required',     // TRUE / FALSE
                'placeholder',  // placeholder text
                'options',      // Các lựa chọn (cho select), phân cách bằng |
                'order',        // thứ tự sắp xếp
                'helper_text',  // ghi chú nhỏ dưới trường
            ]],
        },
    });
    console.log('  📝 Đã ghi header cho "form_fields"');

    // Check if data exists
    const existing = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'form_fields'!A2:A",
    });

    if (!existing.data.values || existing.data.values.length === 0) {
        // Demo fields for AVLH
        const avlhFields = [
            ['avlh_gbc', 'Thông tin an vị', 'hoTenHL', 'Họ tên hương linh', 'text', 'TRUE', 'Họ tên người đã mất', '', '1', ''],
            ['avlh_gbc', 'Thông tin an vị', 'ngayMat', 'Ngày mất (âm lịch)', 'text', 'FALSE', 'VD: 8/8/Canh Tý', '', '2', ''],
            ['avlh_gbc', 'Thông tin an vị', 'tho', 'Thọ', 'text', 'FALSE', 'Tuổi thọ', '', '3', ''],
            ['avlh_gbc', 'Thông tin an vị', 'anTangTai', 'An táng tại', 'text', 'FALSE', 'Địa chỉ an táng', '', '4', ''],
            ['avlh_gbc', 'Giải bùa chú', 'loaiBuaChu', 'Loại bùa chú', 'select', 'TRUE', '', 'Bùa yểm|Bùa trấn|Bùa ngải|Khác', '5', 'Chọn loại bùa chú cần giải'],
            ['avlh_gbc', 'Giải bùa chú', 'moTa', 'Mô tả chi tiết', 'textarea', 'TRUE', 'Mô tả tình trạng bùa chú...', '', '6', ''],
            ['avlh_gbc', 'Giải bùa chú', 'diaDiem', 'Địa điểm phát hiện', 'text', 'FALSE', 'Nhà, đất, mộ...', '', '7', ''],
        ];

        // Demo fields for SHCT (Sám hối Chư Tăng)
        const shctFields = [
            ['shct', 'Nội dung sám hối', 'noiDung', 'Nội dung sám hối', 'textarea', 'TRUE', 'Mô tả nội dung cần sám hối...', '', '1', ''],
            ['shct', 'Nội dung sám hối', 'doiTuong', 'Đối tượng sám hối', 'select', 'FALSE', '', 'Chư Tăng|Tam Bảo|Cha mẹ|Thầy tổ|Khác', '2', ''],
            ['shct', 'Thông tin thêm', 'ghiChu', 'Ghi chú thêm', 'textarea', 'FALSE', 'Ghi chú bổ sung nếu có', '', '3', ''],
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "'form_fields'!A:J",
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [...avlhFields, ...shctFields] },
        });
        console.log('  ✅ Đã thêm fields demo cho AVLH và SHCT');
    } else {
        console.log('  ✅ form_fields đã có dữ liệu');
    }

    // Also set missing values for registration_types
    console.log('\n📝 Cập nhật registration_types...');
    const regTypes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'registration_types'!A:G",
    });
    const rows = regTypes.data.values || [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // Set "Đang mở" = TRUE and "Thứ tự" if empty
        if (!row[4]) row[4] = 'TRUE';
        if (!row[5]) row[5] = String(i);
    }
    if (rows.length > 1) {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'registration_types'!A2:G${rows.length}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: rows.slice(1) },
        });
        console.log('  ✅ Đã cập nhật registration_types (bổ sung cột mở/thứ tự)');
    }

    console.log('\n🎉 Hoàn tất!\n');
    console.log('📋 Cách thêm trường cho form mới:');
    console.log('   1. Mở tab "form_fields" trong Google Sheet');
    console.log('   2. Thêm dòng mới, điền form_type = key của loại đăng ký');
    console.log('   3. Điền section, field_key, field_label, field_type...');
    console.log('   4. Trang web tự cập nhật!\n');
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
