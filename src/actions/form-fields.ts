'use server';

import { getSheetsClient } from '@/lib/sheets/client';

export interface FormFieldDef {
    formType: string;
    section: string;
    fieldKey: string;
    fieldLabel: string;
    fieldType: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'repeatable' | 'multichoice' | 'radio' | 'group';
    required: boolean;
    placeholder: string;
    options: string[]; // for select
    order: number;
    helperText: string;
    separateColumn: boolean;
    showWhen: { fieldKey: string; value: string } | null;
    // Group support
    groupKey?: string;      // for sub-fields: which group they belong to
    subFieldKey?: string;   // for sub-fields: the key within the group
}

export interface FormSection {
    name: string;
    fields: FormFieldDef[];
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

        // First pass: collect all group-type field keys
        const groupFieldKeys = new Set<string>();
        for (const row of rows.slice(1)) {
            if (row[0] === formType && (row[4] || '').toLowerCase() === 'group') {
                groupFieldKeys.add(row[2] || '');
            }
        }

        const allFields: FormFieldDef[] = rows.slice(1)
            .filter((row) => row[0] === formType)
            .map((row) => {
                const fieldKey = row[2] || '';
                const fieldType = (row[4] || 'text').toLowerCase();
                const optionsRaw = row[7] || '';

                // Determine groupKey: either dot-notation OR column H references a group field
                const isSubFieldDot = fieldKey.includes('.');
                let groupKey: string | undefined;
                let subFieldKey: string | undefined;

                if (isSubFieldDot) {
                    groupKey = fieldKey.split('.')[0];
                    subFieldKey = fieldKey.split('.').slice(1).join('.');
                } else if (fieldType !== 'group' && optionsRaw && groupFieldKeys.has(optionsRaw)) {
                    // Column H contains a group field key → this is a sub-field
                    groupKey = optionsRaw;
                    subFieldKey = fieldKey;
                }

                // Options: only parse as options if NOT used as groupKey reference
                const isGroupRef = groupKey && !isSubFieldDot;
                const options = (!isGroupRef && optionsRaw) ? optionsRaw.split('|').map((o) => o.trim()) : [];

                return {
                    formType: row[0] || '',
                    section: row[1] || 'Thông tin',
                    fieldKey: isSubFieldDot ? fieldKey : fieldKey,
                    fieldLabel: row[3] || '',
                    fieldType: fieldType as FormFieldDef['fieldType'],
                    required: (row[5] || 'FALSE').toUpperCase() === 'TRUE',
                    placeholder: row[6] || '',
                    options,
                    order: parseInt(row[8] || '99', 10),
                    helperText: row[9] || '',
                    separateColumn: (row[10] || 'FALSE').toUpperCase() === 'TRUE',
                    showWhen: row[11] && row[11].includes('=')
                        ? { fieldKey: row[11].split('=')[0].trim(), value: row[11].split('=').slice(1).join('=').trim() }
                        : null,
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
