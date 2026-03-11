'use server';

import { v4 as uuidv4 } from 'uuid';
import { generateSubmissionCode } from '@/lib/utils/submission-code';
import { appendSubmission, appendSubmissionItems, appendAuditLog, appendSummaryRow, getNextSTT, appendToFormSheet } from '@/lib/sheets/helpers';
import { getFormFields } from '@/actions/form-fields';

interface DynamicSubmitPayload {
    registrationType: string;
    registrationLabel: string;
    applicant: {
        tinChu: string;
        phone: string;
        daoTrang?: string;
        to?: string;
        notes?: string;
    };
    formData: Record<string, unknown>;
}

export async function submitDynamicRegistration(payload: DynamicSubmitPayload): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
        const { registrationType, registrationLabel, applicant, formData } = payload;

        const submissionId = uuidv4();
        const submissionCode = generateSubmissionCode();
        const now = new Date().toISOString();

        // Build formatted text from form data
        const lines: string[] = [];
        lines.push(`Loại đăng ký: ${registrationLabel}`);
        lines.push(`Tín chủ/Phật tử: ${applicant.tinChu}`);
        lines.push(`SĐT: ${applicant.phone}`);
        if (applicant.to) lines.push(`Thuộc: ${applicant.to}`);
        lines.push('');

        // Add form fields as key-value pairs
        for (const [key, value] of Object.entries(formData)) {
            if (value === undefined || value === null || value === '' || value === false) continue;
            // Group data: array of objects
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const items = value as Record<string, unknown>[];
                lines.push(`• ${key}:`);
                items.forEach((item, idx) => {
                    const parts = Object.entries(item)
                        .filter(([, v]) => v !== undefined && v !== null && v !== '')
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? (v as string[]).join(', ') : String(v)}`);
                    lines.push(`  ${idx + 1}. ${parts.join(' | ')}`);
                });
            } else if (Array.isArray(value)) {
                if (value.length === 0) continue;
                lines.push(`• ${key}: ${value.join(', ')}`);
            } else if (value === true) {
                lines.push(`• ${key}: Có`);
            } else {
                lines.push(`• ${key}: ${String(value)}`);
            }
        }

        if (applicant.notes?.trim()) {
            lines.push('');
            lines.push(`Ghi chú: ${applicant.notes}`);
        }

        const formattedText = lines.join('\n');

        // Write to summary sheet
        const stt = await getNextSTT();
        await appendSummaryRow([
            String(stt),
            registrationLabel,
            applicant.tinChu,
            "'" + applicant.phone,
            applicant.to || '',
            formattedText,
        ]);

        // Write structured submission
        const itemRows = [{
            item_id: uuidv4(),
            submission_id: submissionId,
            item_index: '1',
            category_key: registrationType,
            category_label: registrationLabel,
            created_at: now,
            updated_at: now,
            display_name: registrationLabel,
            summary_text: Object.entries(formData)
                .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0))
                .map(([k, v]) => `${k}: ${v === true ? 'Có' : Array.isArray(v) ? v.join(', ') : String(v).slice(0, 50)}`)
                .join(' • '),
            subject_name: applicant.tinChu,
            reference_value: '',
            item_payload_json: JSON.stringify(formData),
            status: 'active',
        }];

        await appendSubmission({
            submission_id: submissionId,
            submission_code: submissionCode,
            created_at: now,
            updated_at: now,
            status: 'submitted',
            ceremony_type: registrationType,
            ceremony_label: registrationLabel,
            applicant_name: applicant.tinChu,
            applicant_phone: applicant.phone,
            applicant_dao_trang: applicant.daoTrang || '',
            applicant_to: applicant.to || '',
            total_items: '1',
            categories_text: registrationLabel,
            applicant_payload_json: JSON.stringify(applicant),
            source: 'webapp',
            notes: applicant.notes || '',
        });

        await appendSubmissionItems(itemRows);

        await appendAuditLog({
            log_id: uuidv4(),
            submission_id: submissionId,
            action: 'submit',
            created_at: now,
            detail: `Dynamic form "${registrationLabel}" submitted via webapp`,
        });

        // Write to per-form-type sheet (KQ_{label})
        try {
            const sections = await getFormFields(registrationType);
            const fieldConfigs: Record<string, { label: string; separateColumn: boolean }> = {};
            for (const sec of sections) {
                for (const f of sec.fields) {
                    fieldConfigs[f.fieldKey] = {
                        label: f.fieldLabel,
                        separateColumn: f.separateColumn,
                    };
                }
            }
            await appendToFormSheet(registrationLabel, applicant, formData, fieldConfigs);
        } catch (e) {
            console.error('appendToFormSheet error (non-fatal):', e);
        }

        return { success: true, code: submissionCode };
    } catch (err) {
        console.error('Dynamic submit error:', err);
        return { success: false, error: 'Đã có lỗi khi gửi đăng ký. Vui lòng thử lại sau.' };
    }
}

