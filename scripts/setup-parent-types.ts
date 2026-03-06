// Add 'parent' column (H) to registration_types + update AVLH sub-types
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
    console.log('\n🔧 Thêm cột parent vào registration_types...\n');

    // Update header to include 'parent' in column H
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "'registration_types'!H1",
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['parent']] },
    });
    console.log('  ✅ Đã thêm header "parent" (cột H)');

    // Read current data
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'registration_types'!A:H",
    });
    const rows = res.data.values || [];
    console.log(`  📋 Hiện có ${rows.length - 1} loại đăng ký`);

    // Check if AVLH sub-types already exist
    const keys = rows.map(r => r[0]);
    if (!keys.includes('avlh_th1')) {
        // Current AVLH row → make it a parent (remove formType, keep as group)
        // Find AVLH row index
        const avlhIdx = keys.indexOf('AVLH');
        if (avlhIdx > 0) {
            // Clear its formType (col G) since parent doesn't need one
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'registration_types'!G${avlhIdx + 1}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [['']] },
            });
            console.log('  📝 AVLH đã thành parent (xoá formType)');
        }

        // Add sub-types for AVLH
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "'registration_types'!A:H",
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [
                    ['avlh_th1', 'Trường hợp 1', 'Mô tả trường hợp 1', '🔥', 'TRUE', '1', 'avlh_th1', 'AVLH'],
                    ['avlh_th2', 'Trường hợp 2', 'Mô tả trường hợp 2', '🔥', 'TRUE', '2', 'avlh_th2', 'AVLH'],
                ],
            },
        });
        console.log('  ✅ Đã thêm 2 sub-types cho AVLH (avlh_th1, avlh_th2)');

        // Add demo fields for sub-types
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "'form_fields'!A:J",
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [
                    ['avlh_th1', 'Thông tin', 'hoTenHL', 'Họ tên hương linh', 'text', 'TRUE', '', '', '1', ''],
                    ['avlh_th1', 'Thông tin', 'ngayMat', 'Ngày mất (âm lịch)', 'text', 'FALSE', 'VD: 8/8 âm lịch', '', '2', ''],
                    ['avlh_th1', 'Chi tiết TH1', 'moTa', 'Mô tả chi tiết', 'textarea', 'TRUE', '', '', '3', ''],
                    ['avlh_th2', 'Thông tin', 'hoTenHL', 'Họ tên hương linh', 'text', 'TRUE', '', '', '1', ''],
                    ['avlh_th2', 'Chi tiết TH2', 'noiDung', 'Nội dung', 'textarea', 'TRUE', '', '', '2', ''],
                    ['avlh_th2', 'Chi tiết TH2', 'loai', 'Phân loại', 'select', 'FALSE', '', 'Loại A|Loại B|Loại C', '3', ''],
                ],
            },
        });
        console.log('  ✅ Đã thêm demo fields cho avlh_th1 và avlh_th2');
    } else {
        console.log('  ✅ Sub-types đã tồn tại');
    }

    console.log('\n🎉 Hoàn tất!\n');
    console.log('📋 Cách dùng parent-child:');
    console.log('   • Cột "parent" trống → hiện trên trang chủ');
    console.log('   • Cột "parent" = key cha → hiện khi chọn loại cha');
    console.log('   • VD: avlh_th1 có parent = AVLH → chọn AVLH rồi chọn TH1\n');
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
