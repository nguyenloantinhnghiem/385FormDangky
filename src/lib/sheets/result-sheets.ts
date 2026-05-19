import { getSheetsClient } from './client';

export interface FormSheetFieldConfig {
    label: string;
    separateColumn?: boolean;
    blockKey?: string;
    blockLabel?: string;
    order?: number;
    fieldType?: string;
}

interface AppendFormSheetMeta {
    submissionCode?: string;
    registrationKey?: string;
    registrationType?: string;
    registrationLabel?: string;
    submittedAtIso?: string;
}

interface ApplicantSummary {
    tinChu: string;
    phone: string;
    daoTrang?: string;
    to?: string;
    notes?: string;
}

interface ResultColumn {
    id: string;
    key: string;
    blockKey: string;
    blockLabel: string;
    label: string;
    order: number;
    value: unknown;
}

interface SheetInfo {
    sheetId: number;
    title: string;
    columnCount: number;
}

const FIXED_BLOCK_KEY = '__registration';
const FIXED_BLOCK_LABEL = 'THÔNG TIN ĐĂNG KÝ';
const DEFAULT_BLOCK_KEY = '__form';
const DEFAULT_BLOCK_LABEL = 'THÔNG TIN BIỂU MẪU';
const BLOCK_SUFFIX = '_block';
const ITEMS_SUFFIX = '_items';

const FIXED_COLUMNS: Array<{ key: string; label: string; order: number }> = [
    { key: '__stt', label: 'STT', order: 1 },
    { key: '__submission_code', label: 'Mã đăng ký', order: 2 },
    { key: '__created_at', label: 'Ngày gửi', order: 3 },
    { key: '__registration_label', label: 'Loại đăng ký', order: 4 },
    { key: '__applicant_name', label: 'Tín chủ', order: 5 },
    { key: '__applicant_phone', label: 'SĐT', order: 6 },
    { key: '__applicant_to', label: 'Tổ', order: 7 },
    { key: '__applicant_dao_trang', label: 'Đạo tràng/Nhóm', order: 8 },
    { key: '__applicant_notes', label: 'Ghi chú người đăng ký', order: 9 },
];

const ITEM_HEADERS = [
    'Mã đăng ký',
    'Ngày gửi',
    'Loại đăng ký',
    'Mã form',
    'Mã loại',
    'Tín chủ',
    'SĐT',
    'Tổ',
    'Đạo tràng/Nhóm',
    'Block',
    'Group',
    'STT mục',
    'Mã trường',
    'Tên trường',
    'Giá trị',
];

function normalizeTitlePart(value: string): string {
    return value
        .trim()
        .replace(/[\[\]*?/\\:]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^'+|'+$/g, '') || 'ket_qua';
}

function makeSheetTitle(base: string, suffix: string): string {
    const normalized = normalizeTitlePart(base);
    const maxBaseLength = 95 - suffix.length;
    return `${normalized.slice(0, maxBaseLength)}${suffix}`;
}

function quoteSheetName(title: string): string {
    return `'${title.replace(/'/g, "''")}'`;
}

function columnIdentity(blockLabel: string, label: string): string {
    return `${blockLabel}\u001f${label}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasValue(value: unknown): boolean {
    if (value === undefined || value === null || value === '' || value === false) return false;
    if (Array.isArray(value)) return value.some(hasValue);
    if (isRecord(value)) return Object.values(value).some(hasValue);
    return true;
}

function formatValue(value: unknown): string {
    if (value === true) return 'Có';
    if (value === false || value === undefined || value === null) return '';
    if (Array.isArray(value)) {
        if (value.every((item) => !isRecord(item))) {
            return value.filter(hasValue).map(String).join(', ');
        }
        return value
            .filter(isRecord)
            .map((item, index) => `${index + 1}. ${Object.values(item).filter(hasValue).map(formatValue).join(' | ')}`)
            .filter((line) => !line.endsWith('. '))
            .join('\n');
    }
    if (isRecord(value)) {
        return Object.values(value).filter(hasValue).map(formatValue).join(' | ');
    }
    return String(value);
}

function collectSubKeys(
    parentKey: string,
    value: unknown,
    fieldConfigs: Record<string, FormSheetFieldConfig>,
): string[] {
    const keys = new Set<string>();
    const prefix = `${parentKey}.`;

    Object.keys(fieldConfigs)
        .filter((key) => key.startsWith(prefix))
        .sort((a, b) => (fieldConfigs[a]?.order ?? 9999) - (fieldConfigs[b]?.order ?? 9999))
        .forEach((key) => keys.add(key.slice(prefix.length)));

    if (Array.isArray(value)) {
        value.forEach((item) => {
            if (isRecord(item)) Object.keys(item).forEach((key) => keys.add(key));
        });
    } else if (isRecord(value)) {
        Object.keys(value).forEach((key) => keys.add(key));
    }

    return Array.from(keys);
}

function getSubValue(value: unknown, subKey: string): unknown {
    if (Array.isArray(value)) {
        return value
            .filter(isRecord)
            .map((item, index) => {
                const itemValue = item[subKey];
                return hasValue(itemValue) ? `${index + 1}. ${formatValue(itemValue)}` : '';
            })
            .filter(Boolean)
            .join('\n');
    }

    if (isRecord(value)) return value[subKey];
    return undefined;
}

function makeColumn(
    key: string,
    blockKey: string,
    blockLabel: string,
    label: string,
    order: number,
    value: unknown,
): ResultColumn {
    return {
        id: columnIdentity(blockLabel, label),
        key,
        blockKey,
        blockLabel,
        label,
        order,
        value,
    };
}

function ensureUniqueLabels(columns: ResultColumn[]): ResultColumn[] {
    const seen = new Map<string, number>();

    return columns.map((column) => {
        const key = columnIdentity(column.blockLabel, column.label);
        const count = seen.get(key) || 0;
        seen.set(key, count + 1);
        if (count === 0) return column;

        const label = `${column.label} (${column.key.split('.').pop() || count + 1})`;
        return {
            ...column,
            label,
            id: columnIdentity(column.blockLabel, label),
        };
    });
}

function buildFixedColumns(
    stt: number,
    sheetLabel: string,
    applicant: ApplicantSummary,
    submittedAt: string,
    meta: AppendFormSheetMeta,
): ResultColumn[] {
    const values: Record<string, unknown> = {
        __stt: String(stt),
        __submission_code: meta.submissionCode || '',
        __created_at: submittedAt,
        __registration_label: meta.registrationLabel || sheetLabel,
        __applicant_name: applicant.tinChu,
        __applicant_phone: applicant.phone ? `'${applicant.phone}` : '',
        __applicant_to: applicant.to || '',
        __applicant_dao_trang: applicant.daoTrang || '',
        __applicant_notes: applicant.notes || '',
    };

    return FIXED_COLUMNS.map((column) =>
        makeColumn(
            column.key,
            FIXED_BLOCK_KEY,
            FIXED_BLOCK_LABEL,
            column.label,
            column.order,
            values[column.key],
        )
    );
}

function buildFormColumns(
    formData: Record<string, unknown>,
    fieldConfigs: Record<string, FormSheetFieldConfig>,
): ResultColumn[] {
    const columns: ResultColumn[] = [];
    const topLevelKeys = new Set<string>();

    Object.keys(fieldConfigs).forEach((key) => {
        if (!key.includes('.')) topLevelKeys.add(key);
    });
    Object.keys(formData).forEach((key) => topLevelKeys.add(key));

    Array.from(topLevelKeys)
        .sort((a, b) => (fieldConfigs[a]?.order ?? 9999) - (fieldConfigs[b]?.order ?? 9999))
        .forEach((key) => {
            const config = fieldConfigs[key] || { label: key };
            const value = formData[key];
            const blockKey = config.blockKey || key || DEFAULT_BLOCK_KEY;
            const blockLabel = config.blockLabel || config.label || DEFAULT_BLOCK_LABEL;
            const fieldType = config.fieldType || '';
            const isContainer = fieldType === 'group' || fieldType === 'block' || Array.isArray(value) || isRecord(value);
            const subKeys = collectSubKeys(key, value, fieldConfigs);

            if (isContainer && subKeys.length > 0) {
                subKeys.forEach((subKey) => {
                    const subConfig = fieldConfigs[`${key}.${subKey}`] || fieldConfigs[subKey] || { label: subKey };
                    columns.push(makeColumn(
                        `${key}.${subKey}`,
                        blockKey,
                        blockLabel,
                        subConfig.label || subKey,
                        subConfig.order ?? config.order ?? 9999,
                        getSubValue(value, subKey),
                    ));
                });
                return;
            }

            columns.push(makeColumn(
                key,
                config.blockKey || DEFAULT_BLOCK_KEY,
                config.blockLabel || DEFAULT_BLOCK_LABEL,
                config.label || key,
                config.order ?? 9999,
                value,
            ));
        });

    return ensureUniqueLabels(columns);
}

function mergeColumns(existingColumns: ResultColumn[], currentColumns: ResultColumn[]): ResultColumn[] {
    const result = [...existingColumns];
    const existingIds = new Set(result.map((column) => column.id));

    currentColumns.forEach((column) => {
        if (existingIds.has(column.id)) return;

        let insertIndex = -1;
        for (let index = result.length - 1; index >= 0; index--) {
            if (result[index].blockLabel === column.blockLabel) {
                insertIndex = index + 1;
                break;
            }
        }

        if (insertIndex >= 0) {
            result.splice(insertIndex, 0, column);
        } else {
            result.push(column);
        }
        existingIds.add(column.id);
    });

    return result;
}

async function getSheetInfo(title: string): Promise<SheetInfo | null> {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = (meta.data.sheets || []).find((item) => item.properties?.title === title);
    const properties = sheet?.properties;
    if (properties?.sheetId === undefined || properties.sheetId === null || !properties.title) return null;

    return {
        sheetId: properties.sheetId,
        title: properties.title,
        columnCount: properties.gridProperties?.columnCount || 26,
    };
}

async function ensureSheet(title: string): Promise<SheetInfo> {
    const existing = await getSheetInfo(title);
    if (existing) return existing;

    const { sheets, spreadsheetId } = await getSheetsClient();
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{ addSheet: { properties: { title } } }],
        },
    });

    const created = await getSheetInfo(title);
    if (!created) throw new Error(`Không tạo được sheet "${title}"`);
    return created;
}

async function readBlockColumns(title: string): Promise<ResultColumn[]> {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${quoteSheetName(title)}!1:2`,
    });
    const rows = (res.data.values as string[][] | undefined) || [];
    const blockRow = rows[0] || [];
    const labelRow = rows[1] || [];
    const columns: ResultColumn[] = [];
    let currentBlock = '';

    labelRow.forEach((label, index) => {
        currentBlock = blockRow[index] || currentBlock;
        if (!label || !currentBlock) return;
        columns.push(makeColumn(
            `existing_${index}`,
            currentBlock,
            currentBlock,
            label,
            index,
            '',
        ));
    });

    return columns;
}

function buildHeaderRows(columns: ResultColumn[]): string[][] {
    const blockRow: string[] = [];
    const labelRow: string[] = [];
    let previousBlock = '';

    columns.forEach((column) => {
        blockRow.push(column.blockLabel === previousBlock ? '' : column.blockLabel);
        labelRow.push(column.label);
        previousBlock = column.blockLabel;
    });

    return [blockRow, labelRow];
}

function getMergeRanges(columns: ResultColumn[]): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
    let start = 0;

    for (let index = 1; index <= columns.length; index++) {
        if (index < columns.length && columns[index].blockLabel === columns[start].blockLabel) continue;
        if (index - start > 1) ranges.push({ start, end: index });
        start = index;
    }

    return ranges;
}

async function formatBlockSheet(sheet: SheetInfo, columns: ResultColumn[]) {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const columnCount = Math.max(columns.length, sheet.columnCount, 26);
    const requests: object[] = [
        {
            updateSheetProperties: {
                properties: {
                    sheetId: sheet.sheetId,
                    gridProperties: {
                        frozenRowCount: 2,
                        columnCount,
                    },
                },
                fields: 'gridProperties.frozenRowCount,gridProperties.columnCount',
            },
        },
        {
            unmergeCells: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: columns.length,
                },
            },
        },
        {
            repeatCell: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: columns.length,
                },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: { red: 0.09, green: 0.24, blue: 0.45 },
                        horizontalAlignment: 'CENTER',
                        verticalAlignment: 'MIDDLE',
                        textFormat: {
                            foregroundColor: { red: 1, green: 1, blue: 1 },
                            bold: true,
                        },
                    },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
            },
        },
        {
            repeatCell: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: columns.length,
                },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: { red: 0.89, green: 0.95, blue: 1 },
                        horizontalAlignment: 'CENTER',
                        verticalAlignment: 'MIDDLE',
                        wrapStrategy: 'WRAP',
                        textFormat: {
                            foregroundColor: { red: 0.07, green: 0.19, blue: 0.34 },
                            bold: true,
                        },
                    },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
            },
        },
        {
            repeatCell: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 2,
                    startColumnIndex: 0,
                    endColumnIndex: columns.length,
                },
                cell: {
                    userEnteredFormat: {
                        verticalAlignment: 'TOP',
                        wrapStrategy: 'WRAP',
                    },
                },
                fields: 'userEnteredFormat(verticalAlignment,wrapStrategy)',
            },
        },
        {
            setBasicFilter: {
                filter: {
                    range: {
                        sheetId: sheet.sheetId,
                        startRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: columns.length,
                    },
                },
            },
        },
        {
            autoResizeDimensions: {
                dimensions: {
                    sheetId: sheet.sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: columns.length,
                },
            },
        },
    ];

    getMergeRanges(columns).forEach((range) => {
        requests.push({
            mergeCells: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: range.start,
                    endColumnIndex: range.end,
                },
                mergeType: 'MERGE_ALL',
            },
        });
    });

    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests },
        });
    } catch (error) {
        console.error('formatBlockSheet error (non-fatal):', error);
    }
}

async function writeBlockHeaders(sheet: SheetInfo, columns: ResultColumn[]) {
    const { sheets, spreadsheetId } = await getSheetsClient();
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${quoteSheetName(sheet.title)}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: buildHeaderRows(columns) },
    });
    await formatBlockSheet(sheet, columns);
}

async function getNextBlockStt(title: string): Promise<number> {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${quoteSheetName(title)}!A:A`,
    });
    const rowCount = res.data.values?.length || 2;
    return Math.max(rowCount - 2, 0) + 1;
}

function buildBlockRow(columns: ResultColumn[], currentColumns: ResultColumn[]): string[] {
    const valueById = new Map(currentColumns.map((column) => [column.id, formatValue(column.value)]));
    return columns.map((column) => valueById.get(column.id) || '');
}

async function appendBlockRow(title: string, row: string[]) {
    const { sheets, spreadsheetId } = await getSheetsClient();
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${quoteSheetName(title)}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
    });
}

function buildItemRows(
    sheetLabel: string,
    applicant: ApplicantSummary,
    formData: Record<string, unknown>,
    fieldConfigs: Record<string, FormSheetFieldConfig>,
    submittedAt: string,
    meta: AppendFormSheetMeta,
): string[][] {
    const rows: string[][] = [];
    const addRow = (
        blockLabel: string,
        groupLabel: string,
        itemIndex: string,
        fieldKey: string,
        fieldLabel: string,
        value: unknown,
    ) => {
        if (!hasValue(value)) return;
        rows.push([
            meta.submissionCode || '',
            submittedAt,
            meta.registrationLabel || sheetLabel,
            meta.registrationKey || '',
            meta.registrationType || '',
            applicant.tinChu,
            applicant.phone ? `'${applicant.phone}` : '',
            applicant.to || '',
            applicant.daoTrang || '',
            blockLabel,
            groupLabel,
            itemIndex,
            fieldKey,
            fieldLabel,
            formatValue(value),
        ]);
    };

    Object.entries(formData).forEach(([key, value]) => {
        const config = fieldConfigs[key] || { label: key };
        const blockLabel = config.blockLabel || config.label || DEFAULT_BLOCK_LABEL;
        const groupLabel = config.fieldType === 'group' ? config.label : '';
        const subKeys = collectSubKeys(key, value, fieldConfigs);

        if (Array.isArray(value) && value.some(isRecord)) {
            value.filter(isRecord).forEach((item, index) => {
                subKeys.forEach((subKey) => {
                    const subConfig = fieldConfigs[`${key}.${subKey}`] || fieldConfigs[subKey] || { label: subKey };
                    addRow(blockLabel, config.label || key, String(index + 1), `${key}.${subKey}`, subConfig.label || subKey, item[subKey]);
                });
            });
            return;
        }

        if (isRecord(value)) {
            subKeys.forEach((subKey) => {
                const subConfig = fieldConfigs[`${key}.${subKey}`] || fieldConfigs[subKey] || { label: subKey };
                addRow(blockLabel, groupLabel, '', `${key}.${subKey}`, subConfig.label || subKey, value[subKey]);
            });
            return;
        }

        addRow(config.blockLabel || DEFAULT_BLOCK_LABEL, groupLabel, '', key, config.label || key, value);
    });

    return rows;
}

async function ensureItemsSheet(title: string) {
    const sheet = await ensureSheet(title);
    const { sheets, spreadsheetId } = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${quoteSheetName(title)}!1:1`,
    });
    const headers = (res.data.values?.[0] || []) as string[];

    if (headers.join('\u001f') !== ITEM_HEADERS.join('\u001f')) {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${quoteSheetName(title)}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [ITEM_HEADERS] },
        });
    }

    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        updateSheetProperties: {
                            properties: {
                                sheetId: sheet.sheetId,
                                gridProperties: {
                                    frozenRowCount: 1,
                                    columnCount: Math.max(ITEM_HEADERS.length, sheet.columnCount, 26),
                                },
                            },
                            fields: 'gridProperties.frozenRowCount,gridProperties.columnCount',
                        },
                    },
                    {
                        repeatCell: {
                            range: {
                                sheetId: sheet.sheetId,
                                startRowIndex: 0,
                                endRowIndex: 1,
                                startColumnIndex: 0,
                                endColumnIndex: ITEM_HEADERS.length,
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.93, green: 0.97, blue: 0.93 },
                                    horizontalAlignment: 'CENTER',
                                    verticalAlignment: 'MIDDLE',
                                    textFormat: {
                                        bold: true,
                                        foregroundColor: { red: 0.08, green: 0.25, blue: 0.12 },
                                    },
                                },
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
                        },
                    },
                    {
                        setBasicFilter: {
                            filter: {
                                range: {
                                    sheetId: sheet.sheetId,
                                    startRowIndex: 0,
                                    startColumnIndex: 0,
                                    endColumnIndex: ITEM_HEADERS.length,
                                },
                            },
                        },
                    },
                    {
                        autoResizeDimensions: {
                            dimensions: {
                                sheetId: sheet.sheetId,
                                dimension: 'COLUMNS',
                                startIndex: 0,
                                endIndex: ITEM_HEADERS.length,
                            },
                        },
                    },
                ],
            },
        });
    } catch (error) {
        console.error('formatItemsSheet error (non-fatal):', error);
    }
}

async function appendItemRows(title: string, rows: string[][]) {
    if (rows.length === 0) return;
    const { sheets, spreadsheetId } = await getSheetsClient();
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${quoteSheetName(title)}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rows },
    });
}

export async function appendToFormSheet(
    sheetLabel: string,
    applicant: ApplicantSummary,
    formData: Record<string, unknown>,
    fieldConfigs: Record<string, FormSheetFieldConfig>,
    meta: AppendFormSheetMeta = {},
) {
    const submittedAt = meta.submittedAtIso
        ? new Date(meta.submittedAtIso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const baseTitle = `KQ_${sheetLabel}`;
    const blockTitle = makeSheetTitle(baseTitle, BLOCK_SUFFIX);
    const itemsTitle = makeSheetTitle(baseTitle, ITEMS_SUFFIX);

    const blockSheet = await ensureSheet(blockTitle);
    const stt = await getNextBlockStt(blockTitle);
    const currentColumns = [
        ...buildFixedColumns(stt, sheetLabel, applicant, submittedAt, meta),
        ...buildFormColumns(formData, fieldConfigs),
    ];
    const existingColumns = await readBlockColumns(blockTitle);
    const columns = mergeColumns(existingColumns, currentColumns);
    await writeBlockHeaders(blockSheet, columns);
    await appendBlockRow(blockTitle, buildBlockRow(columns, currentColumns));

    await ensureItemsSheet(itemsTitle);
    await appendItemRows(
        itemsTitle,
        buildItemRows(sheetLabel, applicant, formData, fieldConfigs, submittedAt, meta),
    );
}
