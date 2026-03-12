import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
const auth = new google.auth.JWT({ email: process.env.GOOGLE_CLIENT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
const sheets = google.sheets({ version: 'v4', auth });
const sid = process.env.GOOGLE_SPREADSHEET_ID!;
async function main() {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: sid, range: "'settings'!A:B" });
    const rows = res.data.values || [];
    const existing = new Set(rows.map(r => (r[0]||'').trim()));
    const toAdd: string[][] = [];
    const newSettings = [
        ['schedule_mode', 'manual'],
        ['schedule_open_days', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
        ['schedule_open_time', '06:00'],
        ['schedule_close_time', '22:00'],
        ['schedule_timezone', 'Asia/Ho_Chi_Minh'],
    ];
    for (const [k, v] of newSettings) {
        if (!existing.has(k)) toAdd.push([k, v]);
    }
    if (toAdd.length > 0) {
        const insertRow = rows.length + 1;
        await sheets.spreadsheets.values.update({
            spreadsheetId: sid, range: `'settings'!A${insertRow}:B${insertRow + toAdd.length - 1}`,
            valueInputOption: 'USER_ENTERED', requestBody: { values: toAdd },
        });
        console.log(`✅ Thêm ${toAdd.length} schedule settings`);
    } else {
        console.log('ℹ️ Schedule settings đã tồn tại');
    }
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
