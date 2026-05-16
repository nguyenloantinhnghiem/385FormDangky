'use server';

import { getSheetsClient } from '@/lib/sheets/client';

export interface FormFieldDef {
    formType: string;
    section: string;
    fieldKey: string;
    fieldLabel: string;
    fieldType: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'repeatable' | 'multichoice' | 'radio' | 'group' | 'block' | 'notice' | 'heading' | 'reading' | 'image' | 'signature';
    required: boolean;
    placeholder: string;
    options: string[]; // for select
    order: number;
    helperText: string;
    separateColumn: boolean;
    showWhen: { fieldKey: string; value: string } | null;
    tone: string;
    readingConfirmText: string;
    readingPendingText: string;
    readingAcceptedText: string;
    readingPromptText: string;
    sourceIndex?: number;
    // Group support
    groupKey?: string;      // for sub-fields: which group they belong to
    subFieldKey?: string;   // for sub-fields: the key within the group
}

export interface FormSection {
    name: string;
    fields: FormFieldDef[];
}

const COLUMN_FALLBACKS = {
    formType: 0,
    section: 1,
    fieldKey: 2,
    fieldLabel: 3,
    fieldType: 4,
    required: 5,
    placeholder: 6,
    options: 7,
    order: 8,
    helperText: 9,
    separateColumn: 10,
    showWhen: 11,
    tone: 12,
    readingConfirmText: 13,
    readingPendingText: 14,
    readingAcceptedText: 15,
    readingPromptText: 16,
} as const;

const HEADER_ALIASES = {
    formType: ['ma_form', 'form_type'],
    section: ['nhom', 'nhom_section', 'section'],
    fieldKey: ['ma_truong', 'field_key'],
    fieldLabel: ['ten_truong', 'field_label'],
    fieldType: ['loai_truong', 'field_type'],
    required: ['bat_buoc', 'required'],
    placeholder: ['goi_y_nhap', 'goi_y', 'placeholder'],
    options: ['cac_lua_chon', 'lua_chon', 'options'],
    order: ['thu_tu', 'order'],
    helperText: ['ghi_chu', 'ghi_chu_truong', 'helper_text'],
    separateColumn: ['cot_rieng', 'separate_column'],
    showWhen: ['dieu_kien_hien', 'show_when'],
    tone: ['mau_sac', 'mau', 'mau_hien_thi', 'tone', 'color'],
    readingConfirmText: ['nut_xac_nhan', 'van_ban_nut_xac_nhan', 'xac_nhan_text', 'confirm_text', 'reading_confirm_text'],
    readingPendingText: ['nut_khi_chua_cuon_het', 'nut_khi_chua_cuon', 'van_ban_chua_doc_xong', 'chua_doc_xong_text', 'pending_text', 'reading_pending_text'],
    readingAcceptedText: ['sau_khi_xac_nhan', 'van_ban_da_xac_nhan', 'da_doc_xong', 'da_doc_xong_text', 'accepted_text', 'reading_accepted_text'],
    readingPromptText: ['mo_ta_yeu_cau_doc', 'huong_dan_doc', 'mo_ta_doc', 'prompt_text', 'reading_prompt_text'],
} as const;

function normalizeKey(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function buildHeaderMap(headers: string[]): Map<string, number> {
    const map = new Map<string, number>();
    headers.forEach((header, index) => {
        const key = normalizeKey(header || '');
        if (key && !map.has(key)) map.set(key, index);
    });
    return map;
}

function getCell(
    row: string[],
    headerMap: Map<string, number>,
    field: keyof typeof COLUMN_FALLBACKS,
): string {
    for (const alias of HEADER_ALIASES[field]) {
        const index = headerMap.get(alias);
        if (index !== undefined) return row[index] || '';
    }
    return row[COLUMN_FALLBACKS[field]] || '';
}

function normalizeFieldType(value: string): FormFieldDef['fieldType'] {
    const raw = normalizeKey(value || 'text');
    if (['khoi', 'block'].includes(raw)) return 'block';
    if (['notice', 'notic', 'noti', 'info', 'note', 'thong_tin', 'thong_bao', 'nhan_manh', 'canh_bao', 'luu_y'].includes(raw)) return 'notice';
    if (['heading', 'title', 'tieu_de', 'de_muc'].includes(raw)) return 'heading';
    if (['reading', 'read_required', 'document', 'tai_lieu', 'tai_lieu_doc', 'yeu_cau_doc', 'doc_bat_buoc', 'quy_dinh', 'cam_ket', 'xac_nhan_cam_ket', 'yeu_cau_xac_nhan'].includes(raw)) return 'reading';

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
        'reading',
        'image',
        'signature',
    ]);

    return allowed.has(raw as FormFieldDef['fieldType']) ? raw as FormFieldDef['fieldType'] : 'text';
}

function parseOrder(value: string): number {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return 99;
    const order = Number(normalized);
    return Number.isFinite(order) ? order : 99;
}

function compareFields(a: FormFieldDef, b: FormFieldDef): number {
    return a.order - b.order || (a.sourceIndex ?? 0) - (b.sourceIndex ?? 0);
}

export async function getFormFields(formType: string): Promise<FormSection[]> {
    try {
        const { sheets, spreadsheetId } = await getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'trường_biểu_mẫu'!A:Z",
        });
        const rows = (res.data.values as string[][]) || [];
        if (rows.length < 2) return [];
        const headerMap = buildHeaderMap(rows[0] || []);

        // First pass: collect all container-type field keys (group/block)
        const containerFieldKeys = new Set<string>();
        for (const row of rows.slice(1)) {
            const rowFormType = getCell(row, headerMap, 'formType');
            const fieldType = normalizeFieldType(getCell(row, headerMap, 'fieldType') || 'text');
            if (rowFormType === formType && (fieldType === 'group' || fieldType === 'block')) {
                containerFieldKeys.add(getCell(row, headerMap, 'fieldKey') || '');
            }
        }

        const allFields: FormFieldDef[] = rows.slice(1)
            .filter((row) => getCell(row, headerMap, 'formType') === formType)
            .map((row, sourceIndex) => {
                const fieldKey = getCell(row, headerMap, 'fieldKey');
                const fieldType = normalizeFieldType(getCell(row, headerMap, 'fieldType') || 'text');
                const optionsRaw = getCell(row, headerMap, 'options');
                const toneRaw = getCell(row, headerMap, 'tone');

                // Determine groupKey: either dot-notation OR column H references a group/block field
                const dotParentKey = fieldKey.split('.')[0];
                const isSubFieldDot = fieldKey.includes('.') && containerFieldKeys.has(dotParentKey);
                let groupKey: string | undefined;
                let subFieldKey: string | undefined;

                if (isSubFieldDot) {
                    groupKey = dotParentKey;
                    subFieldKey = fieldKey.split('.').slice(1).join('.');
                } else if (fieldType !== 'group' && fieldType !== 'block' && optionsRaw && containerFieldKeys.has(optionsRaw)) {
                    // Column H contains a group/block field key → this is a sub-field
                    groupKey = optionsRaw;
                    subFieldKey = fieldKey;
                }

                // Options: only parse as options if NOT used as container reference
                const isContainerRef = groupKey && !isSubFieldDot;
                const supportsOptions = fieldType === 'select' || fieldType === 'radio' || fieldType === 'multichoice';
                const options = (supportsOptions && !isContainerRef && optionsRaw) ? optionsRaw.split('|').map((o) => o.trim()) : [];

                return {
                    formType: getCell(row, headerMap, 'formType') || '',
                    section: getCell(row, headerMap, 'section') || 'Thông tin',
                    fieldKey: isSubFieldDot ? fieldKey : fieldKey,
                    fieldLabel: getCell(row, headerMap, 'fieldLabel') || '',
                    fieldType,
                    required: (getCell(row, headerMap, 'required') || 'FALSE').toUpperCase() === 'TRUE',
                    placeholder: getCell(row, headerMap, 'placeholder') || '',
                    options,
                    order: parseOrder(getCell(row, headerMap, 'order')),
                    helperText: getCell(row, headerMap, 'helperText') || '',
                    separateColumn: (getCell(row, headerMap, 'separateColumn') || 'FALSE').toUpperCase() === 'TRUE',
                    showWhen: getCell(row, headerMap, 'showWhen') && getCell(row, headerMap, 'showWhen').includes('=')
                        ? {
                            fieldKey: getCell(row, headerMap, 'showWhen').split('=')[0].trim(),
                            value: getCell(row, headerMap, 'showWhen').split('=').slice(1).join('=').trim(),
                        }
                        : null,
                    tone: toneRaw.trim(),
                    readingConfirmText: getCell(row, headerMap, 'readingConfirmText').trim(),
                    readingPendingText: getCell(row, headerMap, 'readingPendingText').trim(),
                    readingAcceptedText: getCell(row, headerMap, 'readingAcceptedText').trim(),
                    readingPromptText: getCell(row, headerMap, 'readingPromptText').trim(),
                    sourceIndex,
                    groupKey,
                    subFieldKey,
                };
            })
            .filter((f) => f.fieldKey)
            .sort(compareFields);

        // Group into sections
        const sectionMap = new Map<string, FormFieldDef[]>();
        for (const f of allFields) {
            if (!sectionMap.has(f.section)) sectionMap.set(f.section, []);
            sectionMap.get(f.section)!.push(f);
        }

        return Array.from(sectionMap.entries()).map(([name, fields]) => ({ name, fields: fields.sort(compareFields) }));
    } catch (err) {
        console.error('getFormFields error:', err);
        return [];
    }
}
