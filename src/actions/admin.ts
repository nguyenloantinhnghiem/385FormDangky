'use server';

import { listSubmissions, getSubmissionById } from '@/lib/sheets/helpers';

interface AdminResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function adminListSubmissions(
    password: string
): Promise<AdminResult<Record<string, string>[]>> {
    if (password !== process.env.ADMIN_PASSWORD) {
        return { success: false, error: 'Mật khẩu không đúng' };
    }
    try {
        const submissions = await listSubmissions();
        // Sort by created_at descending
        submissions.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        return { success: true, data: submissions };
    } catch (err) {
        return {
            success: false,
            error: `Lỗi đọc dữ liệu: ${err instanceof Error ? err.message : 'Unknown'}`,
        };
    }
}

export async function adminGetSubmission(
    password: string,
    submissionId: string
): Promise<AdminResult<{ submission: Record<string, string>; items: Record<string, string>[] }>> {
    if (password !== process.env.ADMIN_PASSWORD) {
        return { success: false, error: 'Mật khẩu không đúng' };
    }
    try {
        const result = await getSubmissionById(submissionId);
        if (!result) {
            return { success: false, error: 'Không tìm thấy đăng ký' };
        }
        return { success: true, data: result };
    } catch (err) {
        return {
            success: false,
            error: `Lỗi đọc dữ liệu: ${err instanceof Error ? err.message : 'Unknown'}`,
        };
    }
}
