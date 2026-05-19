'use server';

import { v4 as uuidv4 } from 'uuid';
import { generateSubmissionCode } from '@/lib/utils/submission-code';
import { appendSubmission, appendSubmissionItems, appendAuditLog, appendSummaryRow, getNextSTT, appendToFormSheet } from '@/lib/sheets/helpers';
import { getFormFields, type FormFieldDef, type FormSection } from '@/actions/form-fields';
import { getRegistrationTypes } from '@/actions/settings';

interface DynamicSubmitPayload {
    registrationKey?: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasMeaningfulValue(value: unknown): boolean {
    if (value === undefined || value === null || value === '' || value === false) return false;
    if (Array.isArray(value)) return value.some(hasMeaningfulValue);
    if (isRecord(value)) return Object.values(value).some(hasMeaningfulValue);
    return true;
}

function isPresentationField(field: FormFieldDef): boolean {
    return ['notice', 'heading', 'reading', 'video'].includes(field.fieldType);
}

function sanitizeDynamicFormData(
    rawData: Record<string, unknown>,
    sections: FormSection[],
): Record<string, unknown> {
    const fields = sections.flatMap((section) => section.fields);
    const result: Record<string, unknown> = {};

    for (const field of fields) {
        if (field.groupKey || isPresentationField(field)) continue;

        const value = rawData[field.fieldKey];
        if (value === undefined) continue;

        if (field.fieldType === 'group' || field.fieldType === 'block') {
            const subFields = fields.filter((subField) =>
                subField.groupKey === field.fieldKey
                && subField.subFieldKey
                && !isPresentationField(subField)
            );
            const subKeys = new Set(subFields.map((subField) => subField.subFieldKey!));

            if (field.fieldType === 'group' && Array.isArray(value)) {
                const items = value
                    .filter(isRecord)
                    .map((item) => Object.fromEntries(
                        Object.entries(item).filter(([key, itemValue]) =>
                            subKeys.has(key) && hasMeaningfulValue(itemValue)
                        )
                    ))
                    .filter(hasMeaningfulValue);
                if (items.length > 0) result[field.fieldKey] = items;
            } else if (field.fieldType === 'block' && isRecord(value)) {
                const blockValue = Object.fromEntries(
                    Object.entries(value).filter(([key, itemValue]) =>
                        subKeys.has(key) && hasMeaningfulValue(itemValue)
                    )
                );
                if (hasMeaningfulValue(blockValue)) result[field.fieldKey] = blockValue;
            }

            continue;
        }

        if (hasMeaningfulValue(value)) result[field.fieldKey] = value;
    }

    return result;
}

export async function submitDynamicRegistration(payload: DynamicSubmitPayload): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
        const {
            registrationKey = '',
            registrationType: submittedRegistrationType,
            registrationLabel: submittedRegistrationLabel,
            applicant,
        } = payload;
        const normalizedRegistrationKey = registrationKey.trim();
        const normalizedRegistrationType = submittedRegistrationType.trim();
        const regTypes = await getRegistrationTypes();
        const resolvedRegType = regTypes.find((type) =>
            normalizedRegistrationKey
                ? type.key === normalizedRegistrationKey && type.formType === normalizedRegistrationType
                : type.formType === normalizedRegistrationType
        );

        if (!resolvedRegType && normalizedRegistrationKey) {
            return { success: false, error: 'Mã form và mã loại không khớp. Vui lòng mở lại đúng link đăng ký.' };
        }

        const registrationType = resolvedRegType?.formType || normalizedRegistrationType;
        const registrationLabel = resolvedRegType?.label || submittedRegistrationLabel.trim();

        const submissionId = uuidv4();
        const submissionCode = generateSubmissionCode();
        const now = new Date().toISOString();

        // Build label map from form field definitions
        const sections = await getFormFields(registrationType);
        if (sections.length === 0) {
            return { success: false, error: 'Form này chưa có cấu hình trường. Vui lòng mở lại đúng link đăng ký.' };
        }

        const formData = sanitizeDynamicFormData(payload.formData || {}, sections);
        const labelMap: Record<string, string> = {};
        for (const sec of sections) {
            for (const f of sec.fields) {
                labelMap[f.fieldKey] = f.fieldLabel;
                if (f.groupKey && f.subFieldKey) {
                    labelMap[`${f.groupKey}.${f.subFieldKey}`] = f.fieldLabel;
                }
            }
        }
        const getLabel = (k: string) => labelMap[k] || k;
        const formatValue = (value: unknown): string => {
            if (value === true) return 'Có';
            if (value === false) return 'Không';
            if (Array.isArray(value)) return value.map(String).join(', ');
            return String(value || '');
        };
        const formatNestedParts = (parentKey: string, item: Record<string, unknown>): string[] =>
            Object.entries(item)
                .filter(([, v]) => hasMeaningfulValue(v))
                .map(([k, v]) => `${getLabel(`${parentKey}.${k}`)}: ${formatValue(v)}`);

        // Build formatted text from form data
        const lines: string[] = [];
        lines.push(`Loại đăng ký: ${registrationLabel}`);
        lines.push(`Tín chủ/Phật tử: ${applicant.tinChu}`);
        lines.push(`SĐT: ${applicant.phone}`);
        if (applicant.to) lines.push(`Thuộc: ${applicant.to}`);
        lines.push('');

        // Add form fields as key-value pairs (using labels)
        for (const [key, value] of Object.entries(formData)) {
            if (!hasMeaningfulValue(value)) continue;
            // Group data: array of objects
            if (Array.isArray(value) && value.length > 0 && isRecord(value[0])) {
                const items = value.filter(isRecord);
                lines.push(`• ${getLabel(key)}:`);
                items.forEach((item, idx) => {
                    const parts = formatNestedParts(key, item);
                    lines.push(`  ${idx + 1}. ${parts.join(' | ')}`);
                });
            } else if (Array.isArray(value)) {
                if (value.length === 0) continue;
                lines.push(`• ${getLabel(key)}: ${value.join(', ')}`);
            } else if (isRecord(value)) {
                const parts = formatNestedParts(key, value);
                if (parts.length === 0) continue;
                lines.push(`• ${getLabel(key)}:`);
                lines.push(`  ${parts.join(' | ')}`);
            } else if (value === true) {
                lines.push(`• ${getLabel(key)}: Có`);
            } else {
                lines.push(`• ${getLabel(key)}: ${String(value)}`);
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
                .filter(([, v]) => hasMeaningfulValue(v))
                .map(([k, v]) => {
                    if (Array.isArray(v) && v.length > 0 && isRecord(v[0])) {
                        return `${getLabel(k)}: ${v.filter(isRecord).length} mục`;
                    }
                    if (isRecord(v)) {
                        return `${getLabel(k)}: ${formatNestedParts(k, v).join(' | ')}`;
                    }
                    return `${getLabel(k)}: ${v === true ? 'Có' : Array.isArray(v) ? v.join(', ') : String(v).slice(0, 50)}`;
                })
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

        // Write to per-form-type sheet (KQ_{label}) — reuse sections from above
        try {
            const fieldConfigs: Record<string, { label: string; separateColumn: boolean }> = {};
            for (const sec of sections) {
                for (const f of sec.fields) {
                    if (f.groupKey && f.subFieldKey) {
                        // Sub-field: keep the sheet's "Cột riêng" setting for fields inside group/block.
                        fieldConfigs[`${f.groupKey}.${f.subFieldKey}`] = {
                            label: f.fieldLabel,
                            separateColumn: f.separateColumn,
                        };
                        fieldConfigs[f.subFieldKey] = {
                            label: f.fieldLabel,
                            separateColumn: f.separateColumn,
                        };
                    } else {
                        fieldConfigs[f.fieldKey] = {
                            label: f.fieldLabel,
                            separateColumn: f.fieldType === 'group' || f.fieldType === 'block' ? false : f.separateColumn,
                        };
                    }
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
