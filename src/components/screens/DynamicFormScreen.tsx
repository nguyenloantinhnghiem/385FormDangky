'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getFormFields, type FormSection, type FormFieldDef } from '@/actions/form-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Loader2, FileText, Plus, Trash2, RotateCcw, User, Info, AlertTriangle, CheckCircle2, Sparkles, PlayCircle } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import SignaturePad from '@/components/ui/SignaturePad';
import type { Applicant } from '@/types';

interface DynamicFormScreenProps {
    formType: string;
    formLabel: string;
    videoUrl?: string;
    defaultValues?: Record<string, unknown>;
    applicant?: Applicant | null;
    isReregistering?: boolean;
    onEditApplicant?: () => void;
    onNext: (data: Record<string, unknown>, fieldLabels: Record<string, string>) => void;
    onBack: () => void;
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

function hasMeaningfulValue(value: unknown): boolean {
    if (value === undefined || value === null || value === false) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) {
        return value.some((item) => {
            if (typeof item === 'object' && item !== null) {
                return Object.values(item).some(hasMeaningfulValue);
            }
            return hasMeaningfulValue(item);
        });
    }
    if (typeof value === 'object') return Object.values(value).some(hasMeaningfulValue);
    return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function conditionMatches(depValue: unknown, expected: string): boolean {
    if (Array.isArray(depValue)) return depValue.map(String).includes(expected);
    if (typeof depValue === 'boolean') {
        const normalizedExpected = normalizeKey(expected);
        return depValue
            ? ['true', 'co', 'yes', '1'].includes(normalizedExpected)
            : ['false', 'khong', 'no', '0'].includes(normalizedExpected);
    }
    return String(depValue || '') === expected;
}

function getHistoricalDetail(values: Record<string, unknown>): string {
    for (const key of ['chi_tiet', 'chiTiet', 'detail', 'noi_dung_cu']) {
        const value = values[key];
        if (typeof value === 'string' && value.trim()) return value;
    }
    return '';
}

function getApplicantDefault(field: FormFieldDef, applicant?: Applicant | null): string | undefined {
    if (!applicant) return undefined;
    if (!['text', 'textarea', 'number', 'select'].includes(field.fieldType)) return undefined;

    const key = normalizeKey(field.fieldKey);
    const label = normalizeKey(field.fieldLabel);

    const keyMatches = (signals: string[]) => signals.some((signal) =>
        key === signal || key === `ma_${signal}` || key.endsWith(`_${signal}`)
    );
    const labelMatches = (signals: string[]) => signals.some((signal) => label.includes(signal));

    const nameKeySignals = [
        'tin_chu', 'ten_tin_chu', 'phat_tu', 'ten_phat_tu', 'phap_danh',
        'ho_ten', 'ho_va_ten', 'nguoi_dang_ky', 'ten_nguoi_dang_ky', 'applicant_name',
    ];
    const nameLabelSignals = [
        'ten_tin_chu', 'ten_phat_tu', 'phap_danh', 'ho_ten', 'ho_va_ten',
        'nguoi_dang_ky', 'ten_nguoi_dang_ky',
    ];
    const phoneSignals = [
        'sdt', 'so_dien_thoai', 'dien_thoai', 'phone', 'applicant_phone',
    ];
    const groupSignals = [
        'thuoc_to', 'to_nhom', 'to_dang_ky', 'to_nao', 'applicant_to',
    ];

    if (keyMatches(nameKeySignals) || labelMatches(nameLabelSignals)) return applicant.tinChu || undefined;
    if (keyMatches(phoneSignals) || labelMatches(phoneSignals)) return applicant.phone || undefined;
    if (keyMatches(groupSignals) || labelMatches(groupSignals)) return applicant.to || undefined;
    return undefined;
}

const TONE_STYLES = {
    amber: {
        card: 'border-amber-200',
        header: 'bg-gradient-to-r from-amber-50 to-white',
        accent: 'bg-amber-500',
        title: 'text-amber-900',
        label: 'text-amber-700',
        icon: 'bg-amber-100 text-amber-700',
        panel: 'border-amber-200 bg-amber-50/60',
        panelStrong: 'border-amber-300 bg-amber-50/80',
        notice: 'border-amber-300 bg-amber-50 text-amber-900',
        item: 'border-l-amber-400 bg-amber-50/40',
    },
    blue: {
        card: 'border-blue-200',
        header: 'bg-gradient-to-r from-blue-50 to-white',
        accent: 'bg-blue-500',
        title: 'text-blue-900',
        label: 'text-blue-700',
        icon: 'bg-blue-100 text-blue-700',
        panel: 'border-blue-200 bg-blue-50/60',
        panelStrong: 'border-blue-300 bg-blue-50/80',
        notice: 'border-blue-300 bg-blue-50 text-blue-900',
        item: 'border-l-blue-400 bg-blue-50/40',
    },
    emerald: {
        card: 'border-emerald-200',
        header: 'bg-gradient-to-r from-emerald-50 to-white',
        accent: 'bg-emerald-500',
        title: 'text-emerald-900',
        label: 'text-emerald-700',
        icon: 'bg-emerald-100 text-emerald-700',
        panel: 'border-emerald-200 bg-emerald-50/60',
        panelStrong: 'border-emerald-300 bg-emerald-50/80',
        notice: 'border-emerald-300 bg-emerald-50 text-emerald-900',
        item: 'border-l-emerald-400 bg-emerald-50/40',
    },
    purple: {
        card: 'border-purple-200',
        header: 'bg-gradient-to-r from-purple-50 to-white',
        accent: 'bg-purple-500',
        title: 'text-purple-900',
        label: 'text-purple-700',
        icon: 'bg-purple-100 text-purple-700',
        panel: 'border-purple-200 bg-purple-50/60',
        panelStrong: 'border-purple-300 bg-purple-50/80',
        notice: 'border-purple-300 bg-purple-50 text-purple-900',
        item: 'border-l-purple-400 bg-purple-50/40',
    },
    rose: {
        card: 'border-rose-200',
        header: 'bg-gradient-to-r from-rose-50 to-white',
        accent: 'bg-rose-500',
        title: 'text-rose-900',
        label: 'text-rose-700',
        icon: 'bg-rose-100 text-rose-700',
        panel: 'border-rose-200 bg-rose-50/60',
        panelStrong: 'border-rose-300 bg-rose-50/80',
        notice: 'border-rose-300 bg-rose-50 text-rose-900',
        item: 'border-l-rose-400 bg-rose-50/40',
    },
    teal: {
        card: 'border-teal-200',
        header: 'bg-gradient-to-r from-teal-50 to-white',
        accent: 'bg-teal-500',
        title: 'text-teal-900',
        label: 'text-teal-700',
        icon: 'bg-teal-100 text-teal-700',
        panel: 'border-teal-200 bg-teal-50/60',
        panelStrong: 'border-teal-300 bg-teal-50/80',
        notice: 'border-teal-300 bg-teal-50 text-teal-900',
        item: 'border-l-teal-400 bg-teal-50/40',
    },
    stone: {
        card: 'border-stone-200',
        header: 'bg-gradient-to-r from-stone-50 to-white',
        accent: 'bg-stone-500',
        title: 'text-stone-900',
        label: 'text-stone-700',
        icon: 'bg-stone-100 text-stone-700',
        panel: 'border-stone-200 bg-stone-50/70',
        panelStrong: 'border-stone-300 bg-stone-50',
        notice: 'border-stone-300 bg-stone-50 text-stone-900',
        item: 'border-l-stone-400 bg-stone-50/70',
    },
} as const;

type ToneName = keyof typeof TONE_STYLES;

const TONE_ORDER: ToneName[] = ['amber', 'blue', 'emerald', 'purple', 'rose', 'teal'];

const TONE_ALIASES: Record<string, ToneName> = {
    vang: 'amber',
    amber: 'amber',
    warning: 'amber',
    canh_bao: 'amber',
    blue: 'blue',
    xanh_duong: 'blue',
    info: 'blue',
    emerald: 'emerald',
    green: 'emerald',
    xanh_la: 'emerald',
    success: 'emerald',
    purple: 'purple',
    tim: 'purple',
    rose: 'rose',
    red: 'rose',
    do: 'rose',
    danger: 'rose',
    teal: 'teal',
    cyan: 'teal',
    ngoc: 'teal',
    stone: 'stone',
    gray: 'stone',
    xam: 'stone',
};

function getToneName(rawTone: string | undefined, seed: string): ToneName {
    const normalizedTone = normalizeKey(rawTone || '');
    if (normalizedTone && TONE_ALIASES[normalizedTone]) return TONE_ALIASES[normalizedTone];

    let hash = 0;
    for (const char of seed) hash = (hash + char.charCodeAt(0)) % 997;
    return TONE_ORDER[hash % TONE_ORDER.length];
}

function getTone(rawTone: string | undefined, seed: string) {
    return TONE_STYLES[getToneName(rawTone, seed)];
}

function getOptionalTone(rawTone: string | undefined, seed: string) {
    return rawTone?.trim() ? getTone(rawTone, seed) : null;
}

function isReadingField(field: FormFieldDef): boolean {
    return field.fieldType === 'reading';
}

function isVideoField(field: FormFieldDef): boolean {
    return field.fieldType === 'video';
}

function isPresentationField(field: FormFieldDef): boolean {
    return field.fieldType === 'notice' || field.fieldType === 'heading' || isReadingField(field) || isVideoField(field);
}

function compareFieldsByOrder(a: FormFieldDef, b: FormFieldDef): number {
    return a.order - b.order || (a.sourceIndex ?? 0) - (b.sourceIndex ?? 0);
}

const INLINE_MARKDOWN_PATTERN = /(\*\*\*[^*\n]+?\*\*\*|___[^_\n]+?___|\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\n]+?\*|_[^_\n]+?_)/g;

function renderInlineMarkdown(text: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    const matches = [...text.matchAll(INLINE_MARKDOWN_PATTERN)];
    let cursor = 0;

    matches.forEach((match, index) => {
        const token = match[0];
        const start = match.index ?? 0;
        if (start > cursor) nodes.push(text.slice(cursor, start));

        if (
            (token.startsWith('***') && token.endsWith('***'))
            || (token.startsWith('___') && token.endsWith('___'))
        ) {
            nodes.push(
                <strong key={`md-${index}`}>
                    <em>{token.slice(3, -3)}</em>
                </strong>
            );
        } else if (
            (token.startsWith('**') && token.endsWith('**'))
            || (token.startsWith('__') && token.endsWith('__'))
        ) {
            nodes.push(<strong key={`md-${index}`}>{token.slice(2, -2)}</strong>);
        } else {
            nodes.push(<em key={`md-${index}`}>{token.slice(1, -1)}</em>);
        }

        cursor = start + token.length;
    });

    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
}

function MarkdownText({ text, className }: { text: string; className?: string }) {
    const blocks: ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = (key: string) => {
        if (listItems.length === 0) return;
        const items = listItems;
        listItems = [];
        blocks.push(
            <ul key={key} className="list-disc space-y-0.5 pl-5">
                {items.map((item, index) => (
                    <li key={`${key}-${index}`}>{renderInlineMarkdown(item)}</li>
                ))}
            </ul>
        );
    };

    text.split(/\r?\n/).forEach((line, index) => {
        const bullet = line.match(/^\s*(?:[-*•])\s+(.+)$/);
        if (bullet) {
            listItems.push(bullet[1]);
            return;
        }

        flushList(`list-${index}`);
        if (!line.trim()) {
            blocks.push(<div key={`space-${index}`} className="h-1" />);
            return;
        }

        blocks.push(<p key={`p-${index}`}>{renderInlineMarkdown(line)}</p>);
    });

    flushList('list-last');
    return <div className={className}>{blocks}</div>;
}

function getVideoEmbedUrl(rawUrl: string): string {
    const url = rawUrl.trim();
    if (!url) return '';

    const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
    if (youtubeMatch?.[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch?.[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return /^https?:\/\//.test(url) ? url : '';
}

function getReadingFieldTitle(field: FormFieldDef): string {
    return field.fieldLabel.trim() || 'Xác nhận cam kết';
}

function ReadingGateField({
    field,
    accepted,
    onAccept,
    error,
}: {
    field: FormFieldDef;
    accepted: boolean;
    onAccept: () => void;
    error?: string;
}) {
    const content = [field.placeholder, field.helperText].filter(Boolean).join('\n');
    const toneName = getToneName(field.tone, `${field.section}_${field.fieldKey}_${field.fieldLabel}`);
    const tone = TONE_STYLES[toneName];
    const contentRef = useRef<HTMLDivElement>(null);
    const [canAccept, setCanAccept] = useState(!content.trim());
    const fieldTitle = getReadingFieldTitle(field);
    const promptText = field.readingPromptText || 'Vui lòng đọc hết nội dung và xác nhận cam kết trước khi điền các mục tiếp theo.';
    const confirmText = field.readingConfirmText || 'Tôi xác nhận đã đọc xong và cam kết thực hiện';
    const pendingText = field.readingPendingText || 'Cuộn xuống cuối nội dung để xác nhận';
    const acceptedText = field.readingAcceptedText || 'Đã đọc xong';

    useEffect(() => {
        const checkScrollableContent = () => {
            const element = contentRef.current;
            if (!element || !content.trim()) {
                setCanAccept(true);
                return;
            }

            const hasReachedEnd = element.scrollHeight - element.scrollTop - element.clientHeight <= 12;
            const isNotScrollable = element.scrollHeight <= element.clientHeight + 12;
            setCanAccept(hasReachedEnd || isNotScrollable);
        };

        const frame = window.requestAnimationFrame(checkScrollableContent);
        window.addEventListener('resize', checkScrollableContent);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('resize', checkScrollableContent);
        };
    }, [content]);

    return (
        <div className={`w-full rounded-lg border ${accepted ? tone.panelStrong : tone.notice} px-3 py-4 sm:px-5`}>
            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accepted ? 'bg-emerald-100 text-emerald-700' : tone.icon}`}>
                        {accepted ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className={`text-base font-semibold ${tone.title}`}>{fieldTitle}</p>
                        <p className="mt-1 text-sm leading-relaxed text-stone-600">
                            {promptText}
                        </p>
                    </div>
                </div>
                {content && (
                    <div
                        ref={contentRef}
                        onScroll={() => {
                            const element = contentRef.current;
                            if (!element) return;
                            setCanAccept(element.scrollHeight - element.scrollTop - element.clientHeight <= 12);
                        }}
                        className="h-[62vh] min-h-[16rem] max-h-[34rem] w-full overflow-y-auto overscroll-auto rounded-md border border-white/70 bg-white/80 px-3 py-3 text-sm leading-relaxed text-stone-700 shadow-inner touch-pan-y sm:h-[58vh] sm:min-h-[22rem] sm:px-4 md:min-h-[26rem]"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        <MarkdownText text={content} className="space-y-1.5" />
                    </div>
                )}
                <div className="sticky bottom-3 z-10 rounded-lg border border-white/80 bg-white/95 p-2 shadow-lg shadow-stone-200/70 backdrop-blur supports-[backdrop-filter]:bg-white/85">
                    {accepted ? (
                        <div className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold leading-snug text-emerald-800 sm:text-base">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            <span>{acceptedText}</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Button
                                type="button"
                                size="lg"
                                variant={canAccept ? 'default' : 'outline'}
                                disabled={!canAccept}
                                onClick={onAccept}
                                className={`min-h-14 w-full whitespace-normal rounded-lg px-4 py-3 text-center text-base font-bold leading-snug shadow-sm transition-all sm:min-h-12 sm:text-base ${canAccept
                                    ? 'animate-confirm-attention border-emerald-600 bg-emerald-600 text-white shadow-emerald-200/80 hover:border-emerald-700 hover:bg-emerald-700 focus-visible:ring-4 focus-visible:ring-emerald-200'
                                    : 'border-amber-300 bg-amber-50 text-amber-900 disabled:cursor-not-allowed disabled:opacity-100'
                                    }`}
                            >
                                <span className="flex w-full items-center justify-center gap-2">
                                    {canAccept ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <FileText className="h-5 w-5 shrink-0" />}
                                    <span>{canAccept ? confirmText : pendingText}</span>
                                </span>
                            </Button>
                            {!canAccept && (
                                <p className="text-center text-xs font-medium leading-relaxed text-amber-800 sm:text-sm">
                                    Nút xác nhận sẽ sáng lên sau khi đọc hết nội dung.
                                </p>
                            )}
                        </div>
                    )}
                </div>
                {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            </div>
        </div>
    );
}

export default function DynamicFormScreen({ formType, formLabel, videoUrl, defaultValues, applicant, isReregistering = false, onEditApplicant, onNext, onBack }: DynamicFormScreenProps) {
    const [sections, setSections] = useState<FormSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadedFormType, setLoadedFormType] = useState('');
    const [formData, setFormData] = useState<Record<string, unknown>>(defaultValues || {});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [acceptedReadings, setAcceptedReadings] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let active = true;

        getFormFields(formType).then((s) => {
            if (!active) return;
            setSections(s);
            setLoadedFormType(formType);
            setAcceptedReadings({});
            setErrors({});
            const defaults: Record<string, unknown> = { ...(defaultValues || {}) };
            const historicalDetail = getHistoricalDetail(defaults);
            const hasMappedData = Object.entries(defaults).some(([key, value]) =>
                !['chi_tiet', 'chiTiet', 'detail', 'noi_dung_cu'].includes(key) && hasMeaningfulValue(value)
            );
            let filledHistoricalDetail = false;

            for (const sec of s) {
                for (const f of sec.fields) {
                    if (f.groupKey) continue; // sub-fields init handled by group
                    if (isPresentationField(f)) continue;

                    if (f.fieldType === 'group' || f.fieldType === 'block') {
                        if (!hasMappedData && historicalDetail && !filledHistoricalDetail && !hasMeaningfulValue(defaults[f.fieldKey])) {
                            const subFields = s
                                .flatMap((section) => section.fields)
                                .filter((subField) => subField.groupKey === f.fieldKey);
                            const detailField = subFields.find((subField) => subField.fieldType === 'textarea')
                                || subFields.find((subField) => subField.fieldType === 'text')
                                || subFields[0];

                            if (detailField?.subFieldKey) {
                                defaults[f.fieldKey] = f.fieldType === 'group'
                                    ? [{ [detailField.subFieldKey]: historicalDetail }]
                                    : { [detailField.subFieldKey]: historicalDetail };
                                filledHistoricalDetail = true;
                            }
                        }

                        if (defaults[f.fieldKey] === undefined) {
                            defaults[f.fieldKey] = f.fieldType === 'group' ? [{}] : {};
                        }
                        continue;
                    }

                    const applicantDefault = getApplicantDefault(f, applicant);

                    if (!hasMeaningfulValue(defaults[f.fieldKey]) && applicantDefault !== undefined) {
                        defaults[f.fieldKey] = applicantDefault;
                    } else if (!hasMappedData && historicalDetail && !filledHistoricalDetail && f.fieldType === 'textarea') {
                        defaults[f.fieldKey] = historicalDetail;
                        filledHistoricalDetail = true;
                    } else if (defaults[f.fieldKey] === undefined) {
                        if (f.fieldType === 'checkbox') defaults[f.fieldKey] = false;
                        else if (f.fieldType === 'multichoice') defaults[f.fieldKey] = [];
                        else defaults[f.fieldKey] = '';
                    }
                }
            }
            setFormData(defaults);
        }).catch((error) => {
            if (!active) return;
            console.error('getFormFields client error:', error);
            setSections([]);
            setLoadedFormType(formType);
        }).finally(() => {
            if (active) setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [formType, defaultValues, applicant]);

    const handleChange = (key: string, value: unknown) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const acceptReading = (fieldKey: string) => {
        setAcceptedReadings((prev) => ({ ...prev, [fieldKey]: true }));
        if (errors[fieldKey]) setErrors((prev) => {
            const next = { ...prev };
            delete next[fieldKey];
            return next;
        });
    };

    // Check if a field should be visible based on its showWhen condition
    const isFieldVisible = (field: FormFieldDef): boolean => {
        if (!field.showWhen) return true;
        const depValue = formData[field.showWhen.fieldKey];
        return conditionMatches(depValue, field.showWhen.value);
    };

    // ========== CONTAINER HELPERS (GROUP/BLOCK) ==========
    const getContainerSubFields = (containerKey: string): FormFieldDef[] => {
        const subFields: FormFieldDef[] = [];
        for (const sec of sections) {
            for (const f of sec.fields) {
                if (f.groupKey === containerKey) subFields.push(f);
            }
        }
        return subFields.sort(compareFieldsByOrder);
    };

    const getGroupSubFields = getContainerSubFields;

    const getGroupItems = (groupKey: string): Record<string, unknown>[] => {
        const items = formData[groupKey];
        if (Array.isArray(items)) return items.filter(isRecord);
        return [{}];
    };

    const getBlockData = (blockKey: string): Record<string, unknown> => {
        const value = formData[blockKey];
        return isRecord(value) ? value : {};
    };

    const handleGroupItemChange = (groupKey: string, index: number, subKey: string, value: unknown) => {
        const items = [...getGroupItems(groupKey)];
        items[index] = { ...items[index], [subKey]: value };
        handleChange(groupKey, items);
    };

    const handleBlockFieldChange = (blockKey: string, subKey: string, value: unknown) => {
        handleChange(blockKey, { ...getBlockData(blockKey), [subKey]: value });
    };

    const addGroupItem = (groupKey: string) => {
        const items = [...getGroupItems(groupKey), {}];
        handleChange(groupKey, items);
    };

    const removeGroupItem = (groupKey: string, index: number) => {
        const items = getGroupItems(groupKey).filter((_, i) => i !== index);
        if (items.length === 0) items.push({});
        handleChange(groupKey, items);
    };

    const isContainerFieldVisible = (
        field: FormFieldDef,
        containerKey: string,
        itemData: Record<string, unknown>,
    ): boolean => {
        if (!field.showWhen) return true;

        const depKey = field.showWhen.fieldKey;
        const nestedPrefix = `${containerKey}.`;
        let depValue: unknown;

        if (depKey.startsWith(nestedPrefix)) {
            depValue = itemData[depKey.slice(nestedPrefix.length)];
        } else if (Object.prototype.hasOwnProperty.call(itemData, depKey)) {
            depValue = itemData[depKey];
        } else {
            depValue = formData[depKey];
        }

        return conditionMatches(depValue, field.showWhen.value);
    };

    const getUnlockedContainerSubFields = (
        containerKey: string,
        itemData: Record<string, unknown>,
    ): FormFieldDef[] => {
        const fields: FormFieldDef[] = [];
        for (const sf of getContainerSubFields(containerKey)) {
            if (!isContainerFieldVisible(sf, containerKey, itemData)) continue;
            fields.push(sf);
            if (isReadingField(sf) && !acceptedReadings[sf.fieldKey]) break;
        }
        return fields;
    };

    const hasLockedReadingInContainer = (
        containerKey: string,
        itemData: Record<string, unknown>,
    ): boolean => {
        return getContainerSubFields(containerKey).some((sf) =>
            isContainerFieldVisible(sf, containerKey, itemData)
            && isReadingField(sf)
            && !acceptedReadings[sf.fieldKey]
        );
    };

    const getVisibleContainerData = (
        containerKey: string,
        itemData: Record<string, unknown>,
    ): Record<string, unknown> => {
        const visibleData: Record<string, unknown> = {};
        for (const sf of getContainerSubFields(containerKey)) {
            if (!sf.subFieldKey || !isContainerFieldVisible(sf, containerKey, itemData)) continue;
            if (isReadingField(sf)) {
                if (!acceptedReadings[sf.fieldKey]) break;
                continue;
            }
            if (isPresentationField(sf)) continue;
            const value = itemData[sf.subFieldKey];
            if (hasMeaningfulValue(value)) visibleData[sf.subFieldKey] = value;
        }
        return visibleData;
    };

    // ========== VALIDATION ==========
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        let blockedByReading = false;
        for (const sec of sections) {
            if (blockedByReading) break;
            const fields = sec.fields.filter((f) => !f.groupKey).sort(compareFieldsByOrder);
            for (const f of fields) {
                if (f.groupKey) continue; // sub-fields validated within group
                if (!isFieldVisible(f)) continue;

                if (isReadingField(f)) {
                    if (!acceptedReadings[f.fieldKey]) {
                        newErrors[f.fieldKey] = `Vui lòng đọc xong ${getReadingFieldTitle(f)} trước khi tiếp tục`;
                        blockedByReading = true;
                        break;
                    }
                    continue;
                }

                if (isPresentationField(f)) continue;

                if (f.fieldType === 'group') {
                    // Validate group sub-fields
                    const subFields = getGroupSubFields(f.fieldKey);
                    const items = getGroupItems(f.fieldKey);
                    let groupBlockedByReading = false;
                    for (let i = 0; i < items.length; i++) {
                        for (const sf of subFields) {
                            if (!isContainerFieldVisible(sf, f.fieldKey, items[i])) continue;
                            if (isReadingField(sf)) {
                                if (!acceptedReadings[sf.fieldKey]) {
                                    newErrors[sf.fieldKey] = `Vui lòng đọc xong ${getReadingFieldTitle(sf)} trước khi tiếp tục`;
                                    groupBlockedByReading = true;
                                    break;
                                }
                                continue;
                            }
                            if (isPresentationField(sf)) continue;
                            if (sf.required) {
                                const val = items[i][sf.subFieldKey!];
                                if (
                                    val === undefined
                                    || val === null
                                    || val === ''
                                    || (sf.fieldType === 'multichoice' && Array.isArray(val) && val.length === 0)
                                ) {
                                    newErrors[`${f.fieldKey}.${i}.${sf.subFieldKey}`] =
                                        `Vui lòng nhập ${sf.fieldLabel} (mục ${i + 1})`;
                                }
                            }
                        }
                        if (groupBlockedByReading) break;
                    }
                    if (groupBlockedByReading) {
                        blockedByReading = true;
                        break;
                    }
                } else if (f.fieldType === 'block') {
                    const blockData = getBlockData(f.fieldKey);
                    let blockBlockedByReading = false;
                    for (const sf of getContainerSubFields(f.fieldKey)) {
                        if (!sf.subFieldKey || !isContainerFieldVisible(sf, f.fieldKey, blockData)) continue;
                        if (isReadingField(sf)) {
                            if (!acceptedReadings[sf.fieldKey]) {
                                newErrors[sf.fieldKey] = `Vui lòng đọc xong ${getReadingFieldTitle(sf)} trước khi tiếp tục`;
                                blockBlockedByReading = true;
                                break;
                            }
                            continue;
                        }
                        if (isPresentationField(sf)) continue;
                        if (sf.required) {
                            const val = blockData[sf.subFieldKey];
                            if (
                                val === undefined
                                || val === null
                                || val === ''
                                || (sf.fieldType === 'multichoice' && Array.isArray(val) && val.length === 0)
                            ) {
                                newErrors[`${f.fieldKey}.${sf.subFieldKey}`] = `Vui lòng nhập/chọn ${sf.fieldLabel}`;
                            }
                        }
                    }
                    if (blockBlockedByReading) {
                        blockedByReading = true;
                        break;
                    }
                } else if (f.required) {
                    const val = formData[f.fieldKey];
                    if (f.fieldType === 'multichoice') {
                        if (!Array.isArray(val) || val.length === 0) {
                            newErrors[f.fieldKey] = `Vui lòng chọn ít nhất 1 mục cho ${f.fieldLabel}`;
                        }
                    } else if (val === undefined || val === null || val === '') {
                        newErrors[f.fieldKey] = `Vui lòng nhập/chọn ${f.fieldLabel}`;
                    }
                }
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ========== SUBMIT ==========
    const handleSubmit = () => {
        if (validate()) {
            const labels: Record<string, string> = {};
            const visibleData: Record<string, unknown> = {};
            for (const sec of sections) {
                for (const f of sec.fields) {
                    if (f.groupKey) continue; // handled by group
                    if (isPresentationField(f)) continue;
                    if (isFieldVisible(f)) {
                        labels[f.fieldKey] = f.fieldLabel;
                        if (f.fieldType === 'group') {
                            // Also include sub-field labels
                            const subFields = getGroupSubFields(f.fieldKey);
                            for (const sf of subFields) {
                                if (isPresentationField(sf)) continue;
                                labels[`${f.fieldKey}.${sf.subFieldKey}`] = sf.fieldLabel;
                            }
                            visibleData[f.fieldKey] = getGroupItems(f.fieldKey)
                                .map((item) => getVisibleContainerData(f.fieldKey, item))
                                .filter(hasMeaningfulValue);
                        } else if (f.fieldType === 'block') {
                            for (const sf of getContainerSubFields(f.fieldKey)) {
                                if (isPresentationField(sf)) continue;
                                labels[`${f.fieldKey}.${sf.subFieldKey}`] = sf.fieldLabel;
                            }
                            const blockData = getVisibleContainerData(f.fieldKey, getBlockData(f.fieldKey));
                            if (hasMeaningfulValue(blockData) || f.required) {
                                visibleData[f.fieldKey] = blockData;
                            }
                        } else {
                            visibleData[f.fieldKey] = formData[f.fieldKey];
                        }
                    }
                }
            }
            onNext(visibleData, labels);
        }
    };

    const renderPresentationField = (field: FormFieldDef) => {
        const toneName = getToneName(field.tone, `${field.section}_${field.fieldKey}_${field.fieldLabel}`);
        const tone = TONE_STYLES[toneName];
        const content = [field.placeholder, field.helperText].filter(Boolean).join('\n');
        const Icon = toneName === 'rose' ? AlertTriangle : toneName === 'emerald' ? CheckCircle2 : field.fieldType === 'heading' ? Sparkles : Info;

        if (field.fieldType === 'video') {
            const videoUrl = getVideoEmbedUrl(field.placeholder);
            return (
                <div className={`rounded-lg border ${tone.panelStrong} px-3 py-3`}>
                    <div className="mb-2 flex items-start gap-2.5">
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
                            <PlayCircle className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className={`text-sm font-semibold ${tone.title}`}>{field.fieldLabel}</p>
                            {field.helperText && (
                                <MarkdownText text={field.helperText} className="mt-1 space-y-1 text-sm leading-relaxed text-stone-600" />
                            )}
                        </div>
                    </div>
                    {videoUrl ? (
                        <div className="overflow-hidden rounded-lg border border-white/70 bg-black shadow-sm">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    src={videoUrl}
                                    className="absolute inset-0 h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    title={field.fieldLabel || 'Video hướng dẫn'}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="rounded-md bg-white/70 px-3 py-2 text-xs text-rose-600">
                            Chưa có link video hợp lệ ở cột G.
                        </p>
                    )}
                </div>
            );
        }

        if (field.fieldType === 'heading') {
            return (
                <div className={`rounded-lg border ${tone.panelStrong} px-3 py-2.5`}>
                    <div className="flex items-start gap-2.5">
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
                            <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className={`text-sm font-semibold ${tone.title}`}>{field.fieldLabel}</p>
                            {content && (
                                <MarkdownText text={content} className="mt-0.5 space-y-1 text-xs leading-relaxed text-stone-600" />
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`rounded-lg border ${tone.notice} px-3 py-3`}>
                <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
                        <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold">{field.fieldLabel}</p>
                        {content && (
                            <MarkdownText text={content} className="mt-1 space-y-1 text-sm leading-relaxed opacity-85" />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ========== RENDER SUB-FIELD (for group/block items) ==========
    const renderSubFieldInput = (field: FormFieldDef, value: unknown, onChange: (val: unknown) => void) => {
        switch (field.fieldType) {
            case 'text':
            case 'number':
                return (
                    <Input
                        type={field.fieldType === 'number' ? 'number' : 'text'}
                        placeholder={field.placeholder}
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        placeholder={field.placeholder}
                        rows={2}
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );
            case 'select':
                return (
                    <select
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="">-- Chọn --</option>
                        {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'radio':
                return (
                    <div className="flex flex-col gap-1.5 mt-1">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`${field.fieldKey}_${Math.random()}`}
                                    checked={(value as string) === opt}
                                    onChange={() => onChange(opt)}
                                    className="w-4 h-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-stone-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'multichoice': {
                const selectedList = (Array.isArray(value) ? value : []) as string[];
                return (
                    <div className="flex flex-col gap-1.5 mt-1">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedList.includes(opt)}
                                    onChange={(e) => {
                                        let newList = [...selectedList];
                                        if (e.target.checked) newList.push(opt);
                                        else newList = newList.filter((i) => i !== opt);
                                        onChange(newList);
                                    }}
                                    className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-stone-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            }
            case 'image':
                return (
                    <FileUpload
                        value={(value as string) || ''}
                        onChange={(url) => onChange(url)}
                        hint={field.placeholder}
                    />
                );
            case 'signature':
                return (
                    <SignaturePad
                        value={(value as string) || ''}
                        onChange={(url) => onChange(url)}
                        hint={field.placeholder}
                    />
                );
            default:
                return <Input value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} />;
        }
    };

    // ========== RENDER GROUP ==========
    const renderGroup = (field: FormFieldDef) => {
        const subFields = getGroupSubFields(field.fieldKey);
        const items = getGroupItems(field.fieldKey);
        const tone = getTone(field.tone, `${field.section}_${field.fieldKey}_${field.fieldLabel}`);

        return (
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className={`relative rounded-lg border border-l-4 p-4 ${tone.item}`}>
                        <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-semibold ${tone.label}`}>
                                {field.fieldLabel} #{index + 1}
                            </span>
                            {items.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeGroupItem(field.fieldKey, index)}
                                    className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Xoá
                                </Button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {subFields.map((sf) => {
                                if (!getUnlockedContainerSubFields(field.fieldKey, item).includes(sf)) return null;
                                if (isReadingField(sf)) {
                                    return (
                                        <div key={sf.fieldKey}>
                                            <ReadingGateField
                                                field={sf}
                                                accepted={!!acceptedReadings[sf.fieldKey]}
                                                onAccept={() => acceptReading(sf.fieldKey)}
                                                error={errors[sf.fieldKey]}
                                            />
                                        </div>
                                    );
                                }
                                if (isPresentationField(sf)) {
                                    return <div key={sf.fieldKey}>{renderPresentationField(sf)}</div>;
                                }
                                const subFieldTone = getOptionalTone(sf.tone, `${sf.section}_${sf.fieldKey}_${sf.fieldLabel}`) || tone;
                                const errKey = `${field.fieldKey}.${index}.${sf.subFieldKey}`;
                                return (
                                    <div key={sf.subFieldKey} className="space-y-1">
                                        <Label className={`text-sm font-medium ${subFieldTone.label}`}>
                                            {sf.fieldLabel}
                                            {sf.required && <span className="text-red-500 ml-1">*</span>}
                                        </Label>
                                        {renderSubFieldInput(
                                            sf,
                                            item[sf.subFieldKey!],
                                            (val) => handleGroupItemChange(field.fieldKey, index, sf.subFieldKey!, val)
                                        )}
                                        {sf.helperText && (
                                            <MarkdownText text={sf.helperText} className="space-y-1 text-xs leading-relaxed text-stone-400" />
                                        )}
                                        {errors[errKey] && (
                                            <p className="text-xs text-red-500">{errors[errKey]}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addGroupItem(field.fieldKey)}
                    className={`w-full mt-2 gap-1 border-dashed ${tone.label} ${tone.panel}`}
                >
                    <Plus className="w-4 h-4" /> Thêm {field.fieldLabel.toLowerCase()}
                </Button>
            </div>
        );
    };

    // ========== RENDER BLOCK ==========
    const renderBlock = (field: FormFieldDef) => {
        const blockData = getBlockData(field.fieldKey);
        const tone = getTone(field.tone, `${field.section}_${field.fieldKey}_${field.fieldLabel}`);
        const visibleSubFields = getUnlockedContainerSubFields(field.fieldKey, blockData);

        if (visibleSubFields.length === 0) {
            return null;
        }

        return (
            <div className={`space-y-3 rounded-lg border border-l-4 p-4 ${tone.panelStrong} ${tone.item}`}>
                {visibleSubFields.map((sf) => {
                    if (isReadingField(sf)) {
                        return (
                            <div key={sf.fieldKey}>
                                <ReadingGateField
                                    field={sf}
                                    accepted={!!acceptedReadings[sf.fieldKey]}
                                    onAccept={() => acceptReading(sf.fieldKey)}
                                    error={errors[sf.fieldKey]}
                                />
                            </div>
                        );
                    }
                    if (isPresentationField(sf)) {
                        return <div key={sf.fieldKey}>{renderPresentationField(sf)}</div>;
                    }
                    const subFieldTone = getOptionalTone(sf.tone, `${sf.section}_${sf.fieldKey}_${sf.fieldLabel}`) || tone;
                    const errKey = `${field.fieldKey}.${sf.subFieldKey}`;
                    return (
                        <div key={sf.subFieldKey} className="space-y-1">
                            <Label className={`text-sm font-medium ${subFieldTone.label}`}>
                                {sf.fieldLabel}
                                {sf.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {renderSubFieldInput(
                                sf,
                                blockData[sf.subFieldKey!],
                                (val) => handleBlockFieldChange(field.fieldKey, sf.subFieldKey!, val)
                            )}
                            {sf.helperText && (
                                <MarkdownText text={sf.helperText} className="space-y-1 text-xs leading-relaxed text-stone-400" />
                            )}
                            {errors[errKey] && (
                                <p className="text-xs text-red-500">{errors[errKey]}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // ========== RENDER FIELD ==========
    const renderField = (field: FormFieldDef) => {
        const value = formData[field.fieldKey];

        switch (field.fieldType) {
            case 'notice':
            case 'heading':
            case 'video':
                return renderPresentationField(field);
            case 'reading':
                return (
                    <ReadingGateField
                        field={field}
                        accepted={!!acceptedReadings[field.fieldKey]}
                        onAccept={() => acceptReading(field.fieldKey)}
                        error={errors[field.fieldKey]}
                    />
                );
            case 'group':
                return renderGroup(field);
            case 'block':
                return renderBlock(field);
            case 'text':
            case 'number':
                return (
                    <Input
                        id={field.fieldKey}
                        type={field.fieldType === 'number' ? 'number' : 'text'}
                        placeholder={field.placeholder}
                        value={(value as string) || ''}
                        onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        id={field.fieldKey}
                        placeholder={field.placeholder}
                        rows={3}
                        value={(value as string) || ''}
                        onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    />
                );
            case 'select':
                return (
                    <select
                        id={field.fieldKey}
                        value={(value as string) || ''}
                        onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="">-- Chọn --</option>
                        {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'checkbox': {
                const checkboxTone = getOptionalTone(field.tone, `${field.section}_${field.fieldKey}_${field.fieldLabel}`);
                return (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleChange(field.fieldKey, e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300"
                        />
                        <span className={`text-sm ${checkboxTone?.label || 'text-stone-700'}`}>{field.fieldLabel}</span>
                    </label>
                );
            }
            case 'multichoice': {
                const selectedList = (Array.isArray(value) ? value : []) as string[];
                return (
                    <div className="flex flex-col gap-2 mt-1">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedList.includes(opt)}
                                    onChange={(e) => {
                                        let newList = [...selectedList];
                                        if (e.target.checked) newList.push(opt);
                                        else newList = newList.filter((i) => i !== opt);
                                        handleChange(field.fieldKey, newList);
                                    }}
                                    className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-stone-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            }
            case 'radio':
                return (
                    <div className="flex flex-col gap-2 mt-1">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={field.fieldKey}
                                    checked={(value as string) === opt}
                                    onChange={() => handleChange(field.fieldKey, opt)}
                                    className="w-4 h-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-stone-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'image':
                return (
                    <FileUpload
                        value={(value as string) || ''}
                        onChange={(url) => handleChange(field.fieldKey, url)}
                        hint={field.placeholder}
                    />
                );
            case 'signature':
                return (
                    <SignaturePad
                        value={(value as string) || ''}
                        onChange={(url) => handleChange(field.fieldKey, url)}
                        hint={field.placeholder}
                    />
                );
            default:
                return <Input value={(value as string) || ''} onChange={(e) => handleChange(field.fieldKey, e.target.value)} />;
        }
    };

    const getSectionVisibleFields = (section: FormSection): FormFieldDef[] => {
        return section.fields
            .filter((f) => !f.groupKey && isFieldVisible(f))
            .filter((f) => {
                if (f.fieldType !== 'block') return true;
                const blockData = getBlockData(f.fieldKey);
                return getContainerSubFields(f.fieldKey).some((sf) =>
                    isContainerFieldVisible(sf, f.fieldKey, blockData)
                );
            })
            .sort(compareFieldsByOrder);
    };

    const getDisplaySections = (): FormSection[] => {
        let blockedByReading = false;

        return sections
            .map((section) => {
                if (blockedByReading) return { name: section.name, fields: [] };

                const fields: FormFieldDef[] = [];
                for (const field of getSectionVisibleFields(section)) {
                    fields.push(field);
                    const hasLockedTopLevelReading = isReadingField(field) && !acceptedReadings[field.fieldKey];
                    const hasLockedBlockReading = field.fieldType === 'block'
                        && hasLockedReadingInContainer(field.fieldKey, getBlockData(field.fieldKey));
                    const hasLockedGroupReading = field.fieldType === 'group'
                        && getGroupItems(field.fieldKey).some((item) => hasLockedReadingInContainer(field.fieldKey, item));

                    if (hasLockedTopLevelReading || hasLockedBlockReading || hasLockedGroupReading) {
                        blockedByReading = true;
                        break;
                    }
                }

                return { name: section.name, fields };
            })
            .filter((section) => section.fields.length > 0);
    };

    if (loading || loadedFormType !== formType) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="ml-2 text-sm text-stone-400">Đang tải form...</span>
            </div>
        );
    }

    if (sections.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-stone-500">Chưa có trường nào cho form này.</p>
                <p className="text-xs text-stone-400 mt-1">Vui lòng liên hệ quản trị viên để cấu hình form này.</p>
                <Button variant="outline" onClick={onBack} className="mt-4">Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    {isReregistering ? (
                        <RotateCcw className="w-5 h-5 text-amber-600" />
                    ) : (
                        <FileText className="w-5 h-5 text-amber-600" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-stone-800">{formLabel}</h2>
                        {isReregistering && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                <RotateCcw className="w-3 h-3" />
                                Đăng ký lại
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-stone-500">
                        {isReregistering ? 'Kiểm tra và chỉnh sửa thông tin trước khi gửi lại' : 'Điền thông tin đăng ký'}
                    </p>
                </div>
            </div>

            {isReregistering && (
                <Card className="mb-4 border-blue-200 bg-blue-50/50">
                    <CardContent className="p-3 flex items-start gap-2.5">
                        <RotateCcw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800 leading-snug">
                            Dữ liệu đăng ký cũ đã được nạp vào form này. Vui lòng kiểm tra lại từng mục trước khi tiếp tục.
                        </p>
                    </CardContent>
                </Card>
            )}

            {isReregistering && applicant && (
                <Card className="mb-4 border-amber-200 bg-amber-50/40">
                    <CardHeader className="pb-1 pt-3 px-3 flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-amber-700" />
                            <CardTitle className="text-xs uppercase tracking-wide text-amber-700">
                                Thông tin người đăng ký
                            </CardTitle>
                        </div>
                        {onEditApplicant && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onEditApplicant}
                                className="h-7 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                            >
                                Sửa
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-1">
                        <p className="text-sm font-semibold text-stone-800">{applicant.tinChu || 'Chưa có tên'}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span className="text-xs text-stone-600">SĐT: {applicant.phone || 'Chưa có'}</span>
                            {applicant.to && <span className="text-xs text-stone-600">{applicant.to}</span>}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Per-form video guide */}
            {videoUrl && (
                <details className="mb-5 group">
                    <summary className="flex items-center gap-2 cursor-pointer text-sm text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors">
                        <span className="text-base">🎬</span>
                        Xem video hướng dẫn
                        <span className="ml-auto text-xs text-amber-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-2 rounded-lg overflow-hidden border border-stone-200 bg-black">
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                src={videoUrl}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={`Video hướng dẫn — ${formLabel}`}
                            />
                        </div>
                    </div>
                </details>
            )}

            <div className="space-y-4">
                {getDisplaySections().map((section, sectionIndex) => {
                    const sectionTone = getTone('', `${section.name}_${sectionIndex}`);
                    const visibleFields = section.fields;
                    if (visibleFields.length === 0) return null;
                    return (
                        <Card key={section.name} className={`overflow-hidden ${sectionTone.card}`}>
                            <CardHeader className={`pb-3 ${sectionTone.header}`}>
                                <div className="flex items-center gap-2.5">
                                    <span className={`h-7 w-1.5 rounded-full ${sectionTone.accent}`} />
                                    <CardTitle className={`text-base ${sectionTone.title}`}>{section.name}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {visibleFields.map((field) => {
                                    const fieldTone = field.fieldType === 'group' || field.fieldType === 'block'
                                        ? getTone(field.tone, `${field.section}_${field.fieldKey}_${field.fieldLabel}`)
                                        : getOptionalTone(field.tone, `${field.section}_${field.fieldKey}_${field.fieldLabel}`) || sectionTone;
                                    return (
                                        <div key={field.fieldKey} className="space-y-1.5">
                                            {!isPresentationField(field) && field.fieldType !== 'checkbox' && field.fieldType !== 'group' && field.fieldType !== 'block' && (
                                                <Label htmlFor={field.fieldKey} className={`inline-flex items-center gap-2 font-medium ${fieldTone.label}`}>
                                                    <span className={`h-2 w-2 rounded-full ${fieldTone.accent}`} />
                                                    {field.fieldLabel}
                                                    {field.required && <span className="text-red-500">*</span>}
                                                </Label>
                                            )}
                                            {(field.fieldType === 'group' || field.fieldType === 'block') && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-6 w-1.5 rounded-full ${fieldTone.accent}`} />
                                                    <Label className={`text-base font-semibold ${fieldTone.title}`}>
                                                        {field.fieldLabel}
                                                    </Label>
                                                </div>
                                            )}
                                            {renderField(field)}
                                            {!isPresentationField(field) && field.helperText && (
                                                <MarkdownText text={field.helperText} className="space-y-1 text-xs leading-relaxed text-stone-500" />
                                            )}
                                            {errors[field.fieldKey] && (
                                                <p className="text-xs text-red-500">{errors[field.fieldKey]}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="flex gap-3 pt-6">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>
                <Button onClick={handleSubmit} className="flex-1 gap-2">
                    {isReregistering ? 'Kiểm tra lại' : 'Tiếp tục'} <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
