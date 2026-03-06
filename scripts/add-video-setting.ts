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

async function main() {
    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
        range: "'settings'!A:B",
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [['video_url', '']] },
    });
    console.log('✅ video_url setting added to Google Sheet (settings tab)');
    console.log('   → Admin: paste YouTube URL vào ô B bên cạnh video_url');
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
