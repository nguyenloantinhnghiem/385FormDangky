'use server';

import { readSettings } from '@/lib/sheets/helpers';
import { getSheetsClient } from '@/lib/sheets/client';

// ============================================================
// Video guide URL
// ============================================================
export async function getGuideVideoUrl(): Promise<string | null> {
    try {
        const settings = await readSettings();
        return settings['video_url'] || null;
    } catch {
        return null;
    }
}

// ============================================================
// Registration status (open/closed)
// ============================================================
export interface RegistrationStatus {
    open: boolean;
    closeMessage: string;
    nextDate: string;
}

export async function getRegistrationStatus(): Promise<RegistrationStatus> {
    try {
        const settings = await readSettings();
        return {
            open: (settings['registration_open'] || 'true').toLowerCase() === 'true',
            closeMessage: settings['registration_close_message'] || 'Đăng ký đã đóng. Vui lòng chờ đợt tiếp theo.',
            nextDate: settings['next_registration_date'] || '',
        };
    } catch {
        return { open: true, closeMessage: '', nextDate: '' };
    }
}

// ============================================================
// Landing page configuration
// ============================================================
export interface LandingConfig {
    title: string;
    subtitle: string;
    notes: string[];
    formWarning: string;
    videoUrl: string;
    registrationOpen: boolean;
    closeMessage: string;
    nextDate: string;
}

export async function getLandingConfig(): Promise<LandingConfig> {
    try {
        const settings = await readSettings();
        const notesRaw = settings['landing_notes'] || '';
        const notes = notesRaw.split('\n').filter((n: string) => n.trim());

        return {
            title: settings['landing_title'] || 'Đăng Ký Cầu Siêu',
            subtitle: settings['landing_subtitle'] || 'Hệ thống đăng ký trực tuyến — nhanh chóng, dễ dàng, chính xác.',
            notes,
            formWarning: settings['form_warning'] || '',
            videoUrl: settings['video_url'] || '',
            registrationOpen: (settings['registration_open'] || 'true').toLowerCase() === 'true',
            closeMessage: settings['registration_close_message'] || 'Đăng ký đã đóng.',
            nextDate: settings['next_registration_date'] || '',
        };
    } catch {
        return {
            title: 'Đăng Ký Cầu Siêu',
            subtitle: 'Hệ thống đăng ký trực tuyến',
            notes: [],
            formWarning: '',
            videoUrl: '',
            registrationOpen: true,
            closeMessage: '',
            nextDate: '',
        };
    }
}

// ============================================================
// Registration types (dynamic from sheet)
// ============================================================
export interface RegistrationType {
    key: string;
    label: string;
    description: string;
    icon: string;
    open: boolean;
    order: number;
    formType: string; // 'cau_sieu' | 'custom' | etc.
    parent: string;   // key of parent type, empty = root
}

export async function getRegistrationTypes(): Promise<RegistrationType[]> {
    try {
        const { sheets, spreadsheetId } = await getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'registration_types'!A:H",
        });
        const rows = (res.data.values as string[][]) || [];
        if (rows.length < 2) {
            // No data — return default
            return [{
                key: 'cau_sieu',
                label: 'Đăng ký Cầu Siêu',
                description: 'Đăng ký danh sách cầu siêu hương linh',
                icon: '🙏',
                open: true,
                order: 1,
                formType: 'cau_sieu',
                parent: '',
            }];
        }

        return rows.slice(1)
            .map((row) => ({
                key: row[0] || '',
                label: row[1] || '',
                description: row[2] || '',
                icon: row[3] || '📋',
                open: (row[4] || 'TRUE').toUpperCase() === 'TRUE',
                order: parseInt(row[5] || '99', 10),
                formType: row[6] || 'custom',
                parent: row[7] || '',
            }))
            .filter((r) => r.key && r.label)
            .sort((a, b) => a.order - b.order);
    } catch {
        return [{
            key: 'cau_sieu',
            label: 'Đăng ký Cầu Siêu',
            description: 'Đăng ký danh sách cầu siêu hương linh',
            icon: '🙏',
            open: true,
            order: 1,
            formType: 'cau_sieu',
            parent: '',
        }];
    }
}
