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
// Schedule system — auto open/close by time
// ============================================================
type ScheduleMode = 'manual' | 'weekly' | 'monthly';

const DAY_MAP: Record<string, number> = {
    'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6,
    'cn': 0, 't2': 1, 't3': 2, 't4': 3, 't5': 4, 't6': 5, 't7': 6,
};

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
    const m = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return { hours: parseInt(m[1], 10), minutes: parseInt(m[2], 10) };
}

function getNowInTZ(tz: string): Date {
    const now = new Date();
    const str = now.toLocaleString('en-US', { timeZone: tz });
    return new Date(str);
}

interface ScheduleResult {
    isOpen: boolean;
    nextEventTime: string;  // ISO string or empty
    nextEventType: 'open' | 'close' | '';
}

function computeSchedule(
    mode: ScheduleMode,
    openDaysRaw: string,
    openTimeRaw: string,
    closeTimeRaw: string,
    tz: string,
    manualOpen: boolean,
): ScheduleResult {
    if (mode === 'manual') {
        return { isOpen: manualOpen, nextEventTime: '', nextEventType: '' };
    }

    const now = getNowInTZ(tz);
    const openTime = parseTime(openTimeRaw);
    const closeTime = parseTime(closeTimeRaw);
    if (!openTime || !closeTime) {
        return { isOpen: manualOpen, nextEventTime: '', nextEventType: '' };
    }

    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;
    const openMinutes = openTime.hours * 60 + openTime.minutes;
    const closeMinutes = closeTime.hours * 60 + closeTime.minutes;

    // Parse allowed days
    let allowedDays: number[] = [];
    if (mode === 'weekly') {
        allowedDays = openDaysRaw.split(',').map(d => {
            const key = d.trim().toLowerCase();
            return DAY_MAP[key] ?? parseInt(key, 10);
        }).filter(n => !isNaN(n));
    }

    // Parse allowed dates (for monthly)
    let allowedDates: number[] = [];
    if (mode === 'monthly') {
        allowedDates = openDaysRaw.split(',').map(d => parseInt(d.trim(), 10)).filter(n => !isNaN(n));
    }

    // Check if today is an allowed day
    let todayAllowed = false;
    if (mode === 'weekly') {
        todayAllowed = allowedDays.includes(currentDay);
    } else if (mode === 'monthly') {
        todayAllowed = allowedDates.includes(now.getDate());
    }

    // Is currently in open window?
    const inTimeWindow = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    const isOpen = todayAllowed && inTimeWindow;

    // Calculate next event
    let nextEventTime = '';
    let nextEventType: 'open' | 'close' | '' = '';

    if (isOpen) {
        // Next event: close time today
        nextEventType = 'close';
        const closeDate = new Date(now);
        closeDate.setHours(closeTime.hours, closeTime.minutes, 0, 0);
        nextEventTime = closeDate.toISOString();
    } else {
        // Next event: find next open time
        nextEventType = 'open';

        // If today is allowed and we haven't passed open time yet
        if (todayAllowed && currentMinutes < openMinutes) {
            const openDate = new Date(now);
            openDate.setHours(openTime.hours, openTime.minutes, 0, 0);
            nextEventTime = openDate.toISOString();
        } else {
            // Find next allowed day
            for (let offset = 1; offset <= 31; offset++) {
                const futureDate = new Date(now);
                futureDate.setDate(futureDate.getDate() + offset);

                let dayAllowed = false;
                if (mode === 'weekly') {
                    dayAllowed = allowedDays.includes(futureDate.getDay());
                } else if (mode === 'monthly') {
                    dayAllowed = allowedDates.includes(futureDate.getDate());
                }

                if (dayAllowed) {
                    futureDate.setHours(openTime.hours, openTime.minutes, 0, 0);
                    nextEventTime = futureDate.toISOString();
                    break;
                }
            }
        }
    }

    return { isOpen, nextEventTime, nextEventType };
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
    // Schedule fields
    scheduleMode: ScheduleMode;
    nextEventTime: string;
    nextEventType: 'open' | 'close' | '';
}

export async function getLandingConfig(): Promise<LandingConfig> {
    try {
        const settings = await readSettings();
        const notesRaw = settings['landing_notes'] || '';
        const notes = notesRaw.split('\n').filter((n: string) => n.trim());

        const scheduleMode = (settings['schedule_mode'] || 'manual') as ScheduleMode;
        const manualOpen = (settings['registration_open'] || 'true').toLowerCase() === 'true';

        const schedule = computeSchedule(
            scheduleMode,
            settings['schedule_open_days'] || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
            settings['schedule_open_time'] || '06:00',
            settings['schedule_close_time'] || '22:00',
            settings['schedule_timezone'] || 'Asia/Ho_Chi_Minh',
            manualOpen,
        );

        return {
            title: settings['landing_title'] || 'Đăng Ký Trực Tuyến',
            subtitle: settings['landing_subtitle'] || 'Hệ thống đăng ký trực tuyến — nhanh chóng, dễ dàng, chính xác.',
            notes,
            formWarning: settings['form_warning'] || '',
            videoUrl: settings['video_url'] || '',
            registrationOpen: schedule.isOpen,
            closeMessage: settings['registration_close_message'] || 'Đăng ký đang ngoài khung giờ hoạt động.',
            nextDate: settings['next_registration_date'] || '',
            scheduleMode,
            nextEventTime: schedule.nextEventTime,
            nextEventType: schedule.nextEventType,
        };
    } catch {
        return {
            title: 'Đăng Ký Trực Tuyến',
            subtitle: 'Hệ thống đăng ký trực tuyến',
            notes: [],
            formWarning: '',
            videoUrl: '',
            registrationOpen: true,
            closeMessage: '',
            nextDate: '',
            scheduleMode: 'manual',
            nextEventTime: '',
            nextEventType: '',
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
    formType: string;
    parent: string;
}

export async function getRegistrationTypes(): Promise<RegistrationType[]> {
    try {
        const { sheets, spreadsheetId } = await getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'loại_đăng_ký'!A:H",
        });
        const rows = (res.data.values as string[][]) || [];
        if (rows.length < 2) {
            return [{
                key: 'cau_sieu',
                label: 'Đăng ký',
                description: 'Đăng ký danh sách',
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
            label: 'Đăng ký',
            description: 'Đăng ký danh sách',
            icon: '🙏',
            open: true,
            order: 1,
            formType: 'cau_sieu',
            parent: '',
        }];
    }
}
