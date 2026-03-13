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

        const allFields: FormFieldDef[] = rows.slice(1)
            .filter((row) => row[0] === formType)
            .map((row) => {
                const fieldKey = row[2] || '';
                const isSubField = fieldKey.includes('.');

                return {
                    formType: row[0] || '',
                    section: row[1] || 'Thông tin',
                    fieldKey,
                    fieldLabel: row[3] || '',
                    fieldType: (row[4] || 'text') as FormFieldDef['fieldType'],
                    required: (row[5] || 'FALSE').toUpperCase() === 'TRUE',
                    placeholder: row[6] || '',
                    options: row[7] ? row[7].split('|').map((o) => o.trim()) : [],
                    order: parseInt(row[8] || '99', 10),
                    helperText: row[9] || '',
                    separateColumn: (row[10] || 'FALSE').toUpperCase() === 'TRUE',
                    showWhen: row[11] && row[11].includes('=')
                        ? { fieldKey: row[11].split('=')[0].trim(), value: row[11].split('=').slice(1).join('=').trim() }
                        : null,
                    // Parse group info from dot notation
                    groupKey: isSubField ? fieldKey.split('.')[0] : undefined,
                    subFieldKey: isSubField ? fieldKey.split('.').slice(1).join('.') : undefined,
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
