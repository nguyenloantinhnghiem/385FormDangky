import { google } from 'googleapis';

// ============================================================
// Google Sheets Client — server-side only
// ============================================================

function getAuth() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error(
            'Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variables. ' +
            'Please check your .env file.'
        );
    }

    return new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
        ],
    });
}

function getSpreadsheetId(): string {
    const id = process.env.GOOGLE_SPREADSHEET_ID;
    if (!id) {
        throw new Error('Missing GOOGLE_SPREADSHEET_ID environment variable.');
    }
    return id;
}

export async function getSheetsClient() {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, spreadsheetId: getSpreadsheetId() };
}
