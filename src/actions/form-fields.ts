'use server';

import { getSheetsClient } from '@/lib/sheets/client';

export interface FormFieldDef {
    formType: string;
    section: string;
    fieldKey: string;
    fieldLabel: string;
    fieldType: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'repeatable' | 'multichoice' | 'radio' | 'group' | 'block' | 'notice' | 'heading' | 'image' | 'signature';
    required: boolean;
    placeholder: string;
    options: string[]; // for select
    order: number;
    helperText: string;
    separateColumn: boolean;
    showWhen: { fieldKey: string; value: string } | null;
    tone: string;
    // Group support
    groupKey?: string;      // for sub-fields: which group they belong to
    subFieldKey?: string;   // for sub-fields: the key within the group
}

export interface FormSection {
    name: string;
    fields: FormFieldDef[];
}

function normalizeKey(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function normalizeFieldType(value: string): FormFieldDef['fieldType'] {
    const raw = normalizeKey(value || 'text');
    if (['khoi', 'block'].includes(raw)) return 'block';
    if (['notice', 'info', 'note', 'thong_tin', 'nhan_manh', 'canh_bao', 'luu_y'].includes(raw)) return 'notice';
    if (['heading', 'title', 'tieu_de', 'de_muc'].includes(raw)) return 'heading';

    const allowed = new Set<FormFieldDef['fieldType']>([
        'text',
        'textarea',
        'select',
        'checkbox',
        'number',
        'repeatable',
        'multichoice',
        'radio',
        'group',
        'block',
        'notice',
        'heading',
        'image',
        'signature',
    ]);

    return allowed.has(raw as FormFieldDef['fieldType']) ? raw as FormFieldDef['fieldType'] : 'text';
}

export async function getFormFields(formType: string): Promise<FormSection[]> {
    try {
        const { sheets, spreadsheetId } = await getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'trường_biểu_mẫu'!A:L",
        });
        const rows = (res.data.values as string[][]) || [];
        if (rows.length < 2) return [];

        // First pass: collect all container-type field keys (group/block)
        const containerFieldKeys = new Set<string>();
        for (const row of rows.slice(1)) {
            const fieldType = normalizeFieldType(row[4] || 'text');
            if (row[0] === formType && (fieldType === 'group' || fieldType === 'block')) {
                containerFieldKeys.add(row[2] || '');
            }
        }

        const allFields: FormFieldDef[] = rows.slice(1)
            .filter((row) => row[0] === formType)
            .map((row) => {
                const fieldKey = row[2] || '';
                const fieldType = normalizeFieldType(row[4] || 'text');
                const optionsRaw = row[7] || '';

                // Determine groupKey: either dot-notation OR column H references a group/block field
                const isSubFieldDot = fieldKey.includes('.');
                let groupKey: string | undefined;
                let subFieldKey: string | undefined;

                if (isSubFieldDot) {
                    groupKey = fieldKey.split('.')[0];
                    subFieldKey = fieldKey.split('.').slice(1).join('.');
                } else if (fieldType !== 'group' && fieldType !== 'block' && optionsRaw && containerFieldKeys.has(optionsRaw)) {
                    // Column H contains a group/block field key → this is a sub-field
                    groupKey = optionsRaw;
                    subFieldKey = fieldKey;
                }

                // Options: only parse as options if NOT used as container reference
                const isContainerRef = groupKey && !isSubFieldDot;
                const supportsOptions = fieldType === 'select' || fieldType === 'radio' || fieldType === 'multichoice';
                const supportsTone = fieldType === 'group' || fieldType === 'block' || fieldType === 'notice' || fieldType === 'heading';
                const options = (supportsOptions && !isContainerRef && optionsRaw) ? optionsRaw.split('|').map((o) => o.trim()) : [];

                return {
                    formType: row[0] || '',
                    section: row[1] || 'Thông tin',
                    fieldKey: isSubFieldDot ? fieldKey : fieldKey,
                    fieldLabel: row[3] || '',
                    fieldType,
                    required: (row[5] || 'FALSE').toUpperCase() === 'TRUE',
                    placeholder: row[6] || '',
                    options,
                    order: parseInt(row[8] || '99', 10),
                    helperText: row[9] || '',
                    separateColumn: (row[10] || 'FALSE').toUpperCase() === 'TRUE',
                    showWhen: row[11] && row[11].includes('=')
                        ? { fieldKey: row[11].split('=')[0].trim(), value: row[11].split('=').slice(1).join('=').trim() }
                        : null,
                    tone: supportsTone && !isContainerRef ? optionsRaw.trim() : '',
                    groupKey,
                    subFieldKey,
                };
            })
            .filter((f) => f.fieldKey)
            .sort((a, b) => a.order - b.order);

        // Group into sections
        const sectionMap = new Map<string, FormFieldDef[]>();
        for (const f of allFields) {
            if (!sectionMap.has(f.section)) sectionMap.set(f.section, []);
            sectionMap.get(f.section)!.push(f);
        }

        return Array.from(sectionMap.entries()).map(([name, fields]) => ({ name, fields }));
    } catch (err) {
        console.error('getFormFields error:', err);
        return [];
    }
}
