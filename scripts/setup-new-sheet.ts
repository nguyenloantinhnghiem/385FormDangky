/**
 * 🚀 SCRIPT TỰ ĐỘNG CÀI ĐẶT GOOGLE SHEET
 * 
 * Chạy 1 lần sau khi tạo Google Sheet mới:
 *   npx tsx scripts/setup-new-sheet.ts
 * 
 * Script sẽ tự động:
 * 1. Tạo 8 tab cần thiết
 * 2. Ghi headers cho mỗi tab
 * 3. Thêm dữ liệu mẫu (cài đặt + 1 form mẫu)
 */

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
const sid = process.env.GOOGLE_SPREADSHEET_ID!;

// ============================================================
// Định nghĩa tất cả tab + headers + dữ liệu mẫu
// ============================================================

interface TabDef {
    name: string;
    headers: string[];
    sampleData?: string[][];
}

const TABS: TabDef[] = [
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
            ['landing_notes', 'Vui lòng đăng ký đúng thời gian quy định\\nLiên hệ ban quản trị nếu cần hỗ trợ'],
        ],
    },
    {
        name: 'loại_đăng_ký',
        headers: ['Mã loại', 'Tên hiển thị', 'Mô tả ngắn', 'Icon', 'Đang mở', 'Thứ tự', 'Mã form', 'Thuộc nhóm cha'],
        sampleData: [
            ['mau_form', 'Đăng ký mẫu', 'Form mẫu để test hệ thống', '📝', 'TRUE', '1', 'mau_form', ''],
        ],
    },
    {
        name: 'trường_biểu_mẫu',
        headers: ['Mã form', 'Nhóm', 'Mã trường', 'Tên trường', 'Loại trường', 'Bắt buộc', 'Gợi ý nhập', 'Các lựa chọn', 'Thứ tự', 'Ghi chú', 'Cột riêng', 'Điều kiện hiện'],
        sampleData: [
            ['mau_form', 'Thông tin', 'ho_ten', 'Họ tên', 'text', 'TRUE', 'VD: Nguyễn Văn A', '', '1', '', 'TRUE', ''],
            ['mau_form', 'Thông tin', 'so_dien_thoai', 'Số điện thoại', 'text', 'TRUE', 'VD: 0912345678', '', '2', '', 'TRUE', ''],
            ['mau_form', 'Nội dung', 'noi_dung', 'Nội dung đăng ký', 'textarea', 'TRUE', 'Nhập nội dung...', '', '3', '', 'FALSE', ''],
            ['mau_form', 'Nội dung', 'loai', 'Loại đăng ký', 'select', 'TRUE', '', 'Loại A|Loại B|Loại C', '4', '', 'TRUE', ''],
            ['mau_form', 'Ghi chú', 'ghi_chu', 'Ghi chú thêm', 'textarea', 'FALSE', 'Nếu có...', '', '5', '', 'FALSE', ''],
        ],
    },
    {
        name: 'đăng_ký',
        headers: ['submission_id', 'submission_code', 'created_at', 'updated_at', 'status', 'ceremony_type', 'ceremony_label', 'applicant_name', 'applicant_phone', 'applicant_dao_trang', 'applicant_to', 'total_items', 'categories_text', 'applicant_payload_json', 'source', 'notes'],
        sampleData: [],
    },
    {
        name: 'chi_tiết_đăng_ký',
        headers: ['item_id', 'submission_id', 'item_index', 'category_key', 'category_label', 'created_at', 'updated_at', 'display_name', 'summary_text', 'subject_name', 'reference_value', 'item_payload_json', 'status'],
        sampleData: [],
    },
    {
        name: 'nhật_ký',
        headers: ['log_id', 'submission_id', 'action', 'created_at', 'detail'],
        sampleData: [],
    },
    {
        name: 'danh_mục',
        headers: ['Mã', 'Tên', 'Nhóm cha', 'Thứ tự'],
        sampleData: [],
    },
    {
        name: 'Tổng hợp đăng ký',
        headers: ['STT', 'Loại đăng ký', 'Tín chủ', 'SĐT', 'Tổ', 'Chi tiết'],
        sampleData: [],
    },
];

// ============================================================
// Main
// ============================================================

async function main() {
    console.log('🚀 Bắt đầu cài đặt Google Sheet...\n');

    // 1. Get existing tabs
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sid });
    const existingTabs = (meta.data.sheets || []).map(s => s.properties?.title || '');

    // 2. Create missing tabs
    for (const tab of TABS) {
        if (existingTabs.includes(tab.name)) {
            console.log(`  ✓ Tab "${tab.name}" — đã tồn tại, bỏ qua`);
            continue;
        }

        // Create tab
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sid,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: tab.name } } }],
                },
            });
        } catch { /* race condition ok */ }

        // Write headers
        await sheets.spreadsheets.values.update({
            spreadsheetId: sid,
            range: `'${tab.name}'!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [tab.headers] },
        });

        // Write sample data
        if (tab.sampleData && tab.sampleData.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: sid,
                range: `'${tab.name}'!A2`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: tab.sampleData },
            });
        }

        console.log(`  ✅ Tab "${tab.name}" — tạo thành công (${tab.sampleData?.length || 0} dữ liệu mẫu)`);
    }

    // 3. Rename default "Sheet1" if exists and is empty
    const sheet1 = existingTabs.find(t => t === 'Sheet1' || t === 'Trang tính1');
    if (sheet1 && !TABS.some(t => t.name === sheet1)) {
        try {
            const sheetObj = meta.data.sheets?.find(s => s.properties?.title === sheet1);
            if (sheetObj) {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: sid,
                    requestBody: {
                        requests: [{
                            deleteSheet: { sheetId: sheetObj.properties!.sheetId! },
                        }],
                    },
                });
                console.log(`\n  🗑️  Đã xoá tab "${sheet1}" (mặc định)`);
            }
        } catch { /* ok if can't delete */ }
    }

    console.log('\n✅ CÀI ĐẶT HOÀN TẤT!');
    console.log('\n📋 Các tab đã thiết lập:');
    TABS.forEach(t => console.log(`   • ${t.name}`));
    console.log(`\n🌐 Chạy "npm run dev" rồi mở http://localhost:3000 để test`);
    console.log(`   Form mẫu: http://localhost:3000/dang-ky/mau_form`);
}

main().catch(e => {
    console.error('\n❌ LỖI:', e.message);
    console.error('\n🔍 Kiểm tra:');
    console.error('   1. File .env.local đã có đủ 3 biến chưa?');
    console.error('   2. Google Sheet đã share cho Service Account chưa?');
    console.error('   3. Google Sheets API đã bật chưa?');
});
