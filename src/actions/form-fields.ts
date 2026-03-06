'use server';

import { getSheetsClient } from '@/lib/sheets/client';

export interface FormFieldDef {
    formType: string;
    section: string;
    fieldKey: string;
    fieldLabel: string;
    fieldType: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'repeatable';
    required: boolean;
    placeholder: string;
    options: string[]; // for select
    order: number;
    helperText: string;
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
            range: "'form_fields'!A:J",
        });
        const rows = (res.data.values as string[][]) || [];
        if (rows.length < 2) return [];

        const allFields: FormFieldDef[] = rows.slice(1)
            .filter((row) => row[0] === formType)
            .map((row) => ({
                formType: row[0] || '',
                section: row[1] || 'Thông tin',
                fieldKey: row[2] || '',
                fieldLabel: row[3] || '',
                fieldType: (row[4] || 'text') as FormFieldDef['fieldType'],
                required: (row[5] || 'FALSE').toUpperCase() === 'TRUE',
                placeholder: row[6] || '',
                options: row[7] ? row[7].split('|').map((o) => o.trim()) : [],
                order: parseInt(row[8] || '99', 10),
                helperText: row[9] || '',
            }))
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
