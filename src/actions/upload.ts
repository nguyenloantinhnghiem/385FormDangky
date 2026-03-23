'use server';

import { google } from 'googleapis';
import { getSheetsClient } from '@/lib/sheets/client';
import { Readable } from 'stream';

// ============================================================
// Upload files to Google Drive (zero-config for forks)
// ============================================================

const SETTINGS_TAB = 'cài_đặt';
const FOLDER_KEY = 'drive_folder_id';

/**
 * Get or create the uploads folder in Google Drive.
 * The folder ID is stored in the Google Sheet settings tab.
 * If it doesn't exist yet, a new folder is created automatically.
 */
async function getOrCreateDriveFolder(): Promise<string> {
    const { sheets, spreadsheetId } = await getSheetsClient();

    // 1. Check if folder ID already saved in Sheet settings
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${SETTINGS_TAB}'!A:B`,
        });
        const rows = res.data.values || [];
        for (const row of rows) {
            if (row[0] === FOLDER_KEY && row[1]) {
                return row[1] as string;
            }
        }
    } catch {
        // Settings tab might not exist yet — will create folder and save
    }

    // 2. Create a new folder via Drive API
    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const folderRes = await drive.files.create({
        requestBody: {
            name: 'Uploads_DangKy',
            mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
    });

    const folderId = folderRes.data.id!;

    // 3. Make folder accessible to anyone with the link
    await drive.permissions.create({
        fileId: folderId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    // 4. Save folder ID to Sheet settings for future use
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${SETTINGS_TAB}'!A:A`,
        });
        const rows = res.data.values || [];
        const nextRow = rows.length + 1;
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${SETTINGS_TAB}'!A${nextRow}:B${nextRow}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[FOLDER_KEY, folderId]] },
        });
    } catch {
        // If settings tab doesn't exist, still return the folder ID
        // It will be recreated next time (acceptable for edge case)
        console.warn('Could not save drive_folder_id to settings tab');
    }

    return folderId;
}

/**
 * Upload a file to Google Drive and return the public view URL.
 * Called from the client via FormData.
 */
export async function uploadFile(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get('file') as File;
        if (!file || file.size === 0) {
            return { success: false, error: 'Không có file nào được chọn' };
        }

        // Validate: max 10MB, only images
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'File quá lớn (tối đa 10MB)' };
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
        if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
            return { success: false, error: 'Chỉ hỗ trợ file hình ảnh (JPG, PNG, WebP)' };
        }

        const folderId = await getOrCreateDriveFolder();

        const auth = new google.auth.JWT({
            email: process.env.GOOGLE_CLIENT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Convert File to stream
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${timestamp}_${safeName}`;

        // Upload to Drive
        const uploadRes = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId],
            },
            media: {
                mimeType: file.type,
                body: stream,
            },
            fields: 'id, webViewLink',
        });

        const fileId = uploadRes.data.id!;

        // Make file publicly viewable
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Return direct view link
        const url = `https://drive.google.com/file/d/${fileId}/view`;

        return { success: true, url };
    } catch (err) {
        console.error('Upload error:', err);
        return { success: false, error: 'Lỗi tải lên. Vui lòng thử lại.' };
    }
}
