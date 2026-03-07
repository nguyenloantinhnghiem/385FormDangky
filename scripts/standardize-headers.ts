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

async function updateHeaders(sheetName: string, headers: string[]) {
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A1:${String.fromCharCode(64 + headers.length)}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
    });
    console.log(`  ✅ ${sheetName}: ${headers.join(' | ')}`);
}

async function main() {
    console.log('\n🔄 Chuẩn hoá headers tiếng Việt...\n');

    // 1. registration_types (A:H)
    await updateHeaders('registration_types', [
        'Mã loại',           // A - key
        'Tên hiển thị',      // B - label
        'Mô tả ngắn',        // C - description
        'Icon',               // D - icon
        'Đang mở',            // E - open
        'Thứ tự',             // F - order
        'Mã form',            // G - formType
        'Thuộc nhóm cha',     // H - parent
    ]);

    // 2. form_fields (A:J)
    await updateHeaders('form_fields', [
        'Mã form',            // A - form_type
        'Nhóm (Section)',     // B - section
        'Mã trường',          // C - field_key
        'Tên trường',         // D - field_label
        'Loại trường',        // E - field_type
        'Bắt buộc',           // F - required
        'Gợi ý nhập',         // G - placeholder
        'Các lựa chọn',       // H - options
        'Thứ tự',             // I - order
        'Ghi chú trường',     // J - helper_text
    ]);

    // 3. submissions (A:P)
    await updateHeaders('submissions', [
        'Mã đăng ký',         // submission_id
        'Mã tra cứu',         // submission_code
        'Ngày tạo',           // created_at
        'Ngày cập nhật',      // updated_at
        'Trạng thái',         // status
        'Loại lễ',            // ceremony_type
        'Tên loại lễ',        // ceremony_label
        'Tên tín chủ',        // applicant_name
        'SĐT',                // applicant_phone
        'Đạo tràng',          // applicant_dao_trang
        'Tổ',                 // applicant_to
        'Số mục',             // total_items
        'Danh mục',           // categories_text
        'Dữ liệu tín chủ',   // applicant_payload_json
        'Nguồn',              // source
        'Ghi chú',            // notes
    ]);

    // 4. submission_items (A:M)
    await updateHeaders('submission_items', [
        'Mã mục',             // item_id
        'Mã đăng ký',         // submission_id
        'STT mục',            // item_index
        'Mã danh mục',        // category_key
        'Tên danh mục',       // category_label
        'Ngày tạo',           // created_at
        'Ngày cập nhật',      // updated_at
        'Tên hiển thị',       // display_name
        'Tóm tắt',            // summary_text
        'Tên đối tượng',      // subject_name
        'Giá trị tham chiếu', // reference_value
        'Dữ liệu JSON',      // item_payload_json
        'Trạng thái',         // status
    ]);

    // 5. audit_logs (A:E)
    await updateHeaders('audit_logs', [
        'Mã log',             // log_id
        'Mã đăng ký',         // submission_id
        'Hành động',          // action
        'Thời gian',          // created_at
        'Chi tiết',           // detail
    ]);

    // 6. settings (A:B) — already has Vietnamese-ish keys, update header row
    await updateHeaders('settings', [
        'Khoá cài đặt',       // key
        'Giá trị',             // value
    ]);

    console.log('\n🎉 Hoàn tất chuẩn hoá headers!\n');
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
