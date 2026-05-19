'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CEREMONY_MAP } from '@/config/categories';
import { submitRegistration } from '@/actions/submit';
import { submitDynamicRegistration } from '@/actions/submit-dynamic';
import {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    clearAllDrafts,
    clearDraftsExcept,
    clearAllReregisterData,
    clearReregisterDataExcept,
    consumeReregisterData,
    saveReregisterData,
    makeFormScopeKey,
    saveProfile,
} from '@/lib/utils/draft';
import type { Applicant, CeremonyType, ScreenName } from '@/types';
import type { AllInOneFormData } from '@/components/screens/RegistrationFormScreen';
import type { LandingConfig, RegistrationType } from '@/actions/settings';
import type { FormSection } from '@/actions/form-fields';

import LandingScreen from '@/components/screens/LandingScreen';
import CeremonySelectScreen from '@/components/screens/CeremonySelectScreen';
import ApplicantScreen from '@/components/screens/ApplicantScreen';
import RegistrationFormScreen from '@/components/screens/RegistrationFormScreen';
import LookupScreen, { type PastSubmission } from '@/components/screens/LookupScreen';
import DynamicFormScreen from '@/components/screens/DynamicFormScreen';
import SummaryScreen from '@/components/screens/SummaryScreen';
import SuccessScreen from '@/components/screens/SuccessScreen';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Edit2, ArrowLeft, Send, Search } from 'lucide-react';

// Inline Dynamic Summary component
function DynamicSummary({ registrationLabel, applicant, formData, fieldLabels, isSubmitting, submitError, onEditApplicant, onEdit, onSubmit, onBack, isReregistering = false }: {
    registrationLabel: string;
    applicant: Applicant;
    formData: Record<string, unknown>;
    fieldLabels: Record<string, string>;
    isSubmitting: boolean;
    submitError: string | null;
    onEditApplicant: () => void;
    onEdit: () => void;
    onSubmit: () => void;
    onBack: () => void;
    isReregistering?: boolean;
}) {
    const [confirmed, setConfirmed] = useState(false);

    // Format display value
    const fmt = (val: unknown): string => {
        if (val === true) return 'Có';
        if (val === false) return 'Không';
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return (val as string[]).join(', ');
        return String(val || '');
    };

    // Get label, never show raw key
    const getLabel = (key: string) => fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const hasDisplayValue = (val: unknown): boolean => {
        if (val === undefined || val === null || val === '' || val === false) return false;
        if (Array.isArray(val)) return val.some(hasDisplayValue);
        if (typeof val === 'object') return Object.values(val).some(hasDisplayValue);
        return true;
    };

    return (
        <div className="animate-slide-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-stone-800">
                        {isReregistering ? 'Kiểm tra lại đăng ký' : 'Xem lại đăng ký'}
                    </h2>
                    <p className="text-sm text-stone-500">Kiểm tra thông tin trước khi gửi</p>
                </div>
            </div>

            {/* Registration type */}
            <Card className="mb-3 border-amber-200 bg-amber-50/30">
                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <span className="text-xl">📋</span>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-amber-500 font-medium">Loại đăng ký</p>
                        <p className="text-sm font-semibold text-amber-800">{registrationLabel}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Applicant info */}
            <Card className="mb-3">
                <CardHeader className="pb-1 pt-3 px-3 sm:px-4 flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">👤</span>
                        <CardTitle className="text-xs text-stone-400 uppercase tracking-wide">Người đăng ký</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onEditApplicant} className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                        <Edit2 className="w-3 h-3" /> Sửa
                    </Button>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 pt-1">
                    <p className="text-sm font-semibold text-stone-800">{applicant.tinChu}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        <span className="text-xs text-stone-500">📱 {applicant.phone}</span>
                        {applicant.to && <span className="text-xs text-stone-500">🏠 {applicant.to}</span>}
                    </div>
                </CardContent>
            </Card>

            {/* Form details */}
            <Card className="mb-3">
                <CardHeader className="pb-1 pt-3 px-3 sm:px-4 flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">📝</span>
                        <CardTitle className="text-xs text-stone-400 uppercase tracking-wide">Chi tiết đăng ký</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                        <Edit2 className="w-3 h-3" /> Chỉnh sửa
                    </Button>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 pt-2 space-y-3">
                    {Object.entries(formData).map(([key, value]) => {
                        if (!hasDisplayValue(value)) return null;
                        const label = getLabel(key);

                        // Group data: array of objects → render as numbered cards
                        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                            const items = value as Record<string, unknown>[];
                            return (
                                <div key={key} className="space-y-2">
                                    <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                                        {label}
                                        <span className="text-[10px] font-normal text-stone-400">({items.length})</span>
                                    </p>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="bg-stone-50 rounded-lg p-3 border border-stone-100">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-xs text-stone-400">{label} #{idx + 1}</span>
                                            </div>
                                            <div className="space-y-1 ml-7">
                                                {Object.entries(item).map(([subKey, subVal]) => {
                                                    if (!subVal || subVal === '') return null;
                                                    const subLabel = fieldLabels[`${key}.${subKey}`] || getLabel(subKey);
                                                    return (
                                                        <div key={subKey} className="text-sm">
                                                            <span className="text-stone-500 text-xs">{subLabel}</span>
                                                            <p className="text-stone-800 font-medium leading-snug break-words">
                                                                {fmt(subVal)}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        }

                        // Block data: single object with nested fields
                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            const item = value as Record<string, unknown>;
                            const visibleEntries = Object.entries(item).filter(([, subVal]) => hasDisplayValue(subVal));
                            if (visibleEntries.length === 0) return null;

                            return (
                                <div key={key} className="space-y-2">
                                    <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                                        {label}
                                    </p>
                                    <div className="bg-stone-50 rounded-lg p-3 border border-stone-100 space-y-1">
                                        {visibleEntries.map(([subKey, subVal]) => {
                                            const subLabel = fieldLabels[`${key}.${subKey}`] || getLabel(subKey);
                                            return (
                                                <div key={subKey} className="text-sm">
                                                    <span className="text-stone-500 text-xs">{subLabel}</span>
                                                    <p className="text-stone-800 font-medium leading-snug break-words whitespace-pre-line">
                                                        {fmt(subVal)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }

                        // Multichoice: array of strings
                        if (Array.isArray(value)) {
                            return (
                                <div key={key}>
                                    <p className="text-xs text-stone-500 mb-1">{label}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(value as string[]).map((v, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5">
                                                ✓ {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        // Boolean
                        if (value === true) {
                            return (
                                <div key={key} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-stone-700">{label}</span>
                                </div>
                            );
                        }

                        // Regular field
                        return (
                            <div key={key} className="text-sm">
                                <p className="text-xs text-stone-500">{label}</p>
                                <p className="text-stone-800 font-medium break-words whitespace-pre-line">{fmt(value)}</p>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Confirm checkbox */}
            <Card className="mb-4 border-green-200 bg-green-50/30">
                <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="dynamic-confirm"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-green-600 focus:ring-green-500 mt-0.5 flex-shrink-0"
                        />
                        <label htmlFor="dynamic-confirm" className="text-sm text-stone-600 leading-snug cursor-pointer">
                            Tôi đã kiểm tra lại toàn bộ thông tin và xác nhận gửi đăng ký.
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Error */}
            {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600 flex gap-2 items-start mb-4">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{submitError}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onBack} className="flex-1 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>
                <Button onClick={onSubmit} disabled={!confirmed || isSubmitting} className="flex-1 gap-2">
                    {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
                    ) : (
                        <><Send className="w-4 h-4" /> Gửi đăng ký</>
                    )}
                </Button>
            </div>
        </div>
    );
}


interface WizardProps {
    initialRegType?: RegistrationType;
    initialFormSections?: FormSection[];
    initialLandingConfig?: LandingConfig;
    initialRegistrationTypes?: RegistrationType[];
}

interface ReregisterData {
    applicant: Applicant;
    formData?: Record<string, unknown> | null;
    registrationKey?: string;
    formType?: string;
    formScope?: string;
    savedAt?: string;
}

const LEGACY_CAU_SIEU_TYPES = new Set(['trai_tang', 'trai_vien', 'tuy_duyen', 'cau_sieu']);

function parsePayloadObject(raw: string): Record<string, unknown> | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
    } catch {
        // ignore malformed historical data
    }
    return null;
}

function getPastDynamicFormData(sub: PastSubmission): Record<string, unknown> | null {
    if (sub.formData && Object.keys(sub.formData).length > 0) {
        return sub.formData;
    }

    const preferredItem = sub.itemsData.find((item) =>
        item.categoryKey === sub.formType
        || item.categoryKey === sub.registrationKey
        || item.categoryLabel === sub.registrationLabel
    );

    return preferredItem ? parsePayloadObject(preferredItem.payloadJson) : null;
}

export default function RegistrationWizard({
    initialRegType,
    initialFormSections,
    initialLandingConfig,
    initialRegistrationTypes,
}: WizardProps) {
    const router = useRouter();

    // Determine the starting screen based on initialRegType
    const getInitialScreen = (): ScreenName => {
        if (!initialRegType) return 'landing';
        if (initialRegType.formType === 'cau_sieu') return 'ceremony_select';
        return 'applicant';
    };

    const [screen, setScreen] = useState<ScreenName>(getInitialScreen());
    const [ceremonyType, setCeremonyType] = useState<CeremonyType | null>(null);
    const [registrationType, setRegistrationType] = useState<RegistrationType | null>(initialRegType || null);
    const [applicant, setApplicant] = useState<Applicant | null>(null);
    const [formData, setFormData] = useState<AllInOneFormData | null>(null);
    const [dynamicFormData, setDynamicFormData] = useState<Record<string, unknown> | null>(null);
    const [dynamicFieldLabels, setDynamicFieldLabels] = useState<Record<string, string>>({});
    const [submissionCode, setSubmissionCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [isReregistering, setIsReregistering] = useState(false);

    // Form key for draft isolation
    const formScope = registrationType
        ? makeFormScopeKey(registrationType.key, registrationType.formType)
        : undefined;

    // Navigate home: clear all state and go to landing
    const goHome = useCallback(() => {
        // Clear all drafts so user starts fresh
        clearAllDrafts();
        clearAllReregisterData();
        // Reset all state
        setRegistrationType(null);
        setCeremonyType(null);
        setApplicant(null);
        setFormData(null);
        setDynamicFormData(null);
        setDynamicFieldLabels({});
        setSubmissionCode('');
        setSubmitError(null);
        setDraftLoaded(false);
        setIsReregistering(false);
        if (initialRegType) {
            // Direct link → full page navigation to home
            window.location.href = '/';
        } else {
            setScreen('landing');
        }
    }, [initialRegType]);

    // On direct link: check for re-register data first, or clear old draft
    useEffect(() => {
        if (initialRegType) {
            // Check for reregister data (saved by lookup flow)
            try {
                const currentScope = makeFormScopeKey(initialRegType.key, initialRegType.formType);
                clearDraftsExcept(currentScope);
                clearReregisterDataExcept(currentScope);

                const reregData = consumeReregisterData<Partial<ReregisterData>>(currentScope);
                if (reregData) {
                    const matchesCurrentForm = reregData.registrationKey === initialRegType.key
                        && reregData.formType === initialRegType.formType;

                    if (!matchesCurrentForm) {
                        clearDraft(currentScope);
                        return;
                    }

                    if (reregData.applicant) {
                        setApplicant(reregData.applicant);
                        setIsReregistering(true);
                        if (initialRegType.formType !== 'cau_sieu') {
                            setCeremonyType(null);
                            setFormData(null);
                            setDynamicFormData(reregData.formData || {});
                            setScreen('registration_form');
                            return; // Don't clear drafts — we want the data
                        }
                        setScreen('applicant');
                        return; // Don't clear drafts — we want the data
                    }
                }
            } catch {
                // ignore
            }
            const currentScope = makeFormScopeKey(initialRegType.key, initialRegType.formType);
            clearDraft(currentScope);
            clearDraftsExcept(currentScope);
            clearReregisterDataExcept(currentScope);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load draft: only restore applicant data, NOT the screen position
    // This prevents "going home" from jumping back to old forms
    useEffect(() => {
        if (initialRegType) return; // Direct link — always fresh
        if (typeof window !== 'undefined' && hasDraft()) {
            const draft = loadDraft();
            if (draft && draft.applicant) {
                // Only restore applicant info for convenience
                // Do NOT restore screen — always start at landing
                setCeremonyType(draft.ceremonyType || null);
                setApplicant(draft.applicant);
                // Keep screen as 'landing' — user decides where to go
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-save draft
    const persistDraft = useCallback(() => {
        saveDraft({
            ceremonyType,
            applicant,
            items: [],
            currentScreen: screen,
            lastUpdated: new Date().toISOString(),
        }, formScope, {
            registrationKey: registrationType?.key || '',
            formType: registrationType?.formType || '',
        });
    }, [ceremonyType, applicant, screen, formScope, registrationType]);

    useEffect(() => {
        if (screen !== 'landing' && screen !== 'success') {
            persistDraft();
        }
    }, [screen, ceremonyType, applicant, persistDraft]);

    useEffect(() => {
        if (draftLoaded) {
            const timer = setTimeout(() => setDraftLoaded(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [draftLoaded]);

    const goTo = (s: ScreenName) => setScreen(s);

    // Handle start from landing — navigate to the form's dedicated URL
    const handleStart = (regType?: RegistrationType) => {
        if (!regType) return;
        setIsReregistering(false);
        // Navigate to the form's own page so URL changes
        router.push(`/dang-ky/${encodeURIComponent(regType.key)}`);
    };

    const handleCeremonySelect = (type: CeremonyType) => {
        setIsReregistering(false);
        setCeremonyType(type);
        goTo('applicant');
    };

    const handleApplicantNext = (data: Applicant) => {
        setApplicant(data);
        goTo('registration_form');
    };

    const handleFormNext = (data: AllInOneFormData) => {
        setFormData(data);
        goTo('summary');
    };

    // Dynamic form next
    const handleDynamicFormNext = (data: Record<string, unknown>, labels: Record<string, string>) => {
        setDynamicFormData(data);
        setDynamicFieldLabels(labels);
        goTo('summary');
    };

    // Is this a dynamic (non-cau_sieu) flow?
    const isDynamic = registrationType && registrationType.formType !== 'cau_sieu';

    // Handle re-registration from lookup
    const handleSelectPast = (sub: PastSubmission) => {
        const pastApplicant: Applicant = {
            tinChu: sub.applicantName,
            phone: sub.applicantPhone,
            daoTrang: '',
            to: sub.applicantTo || '',
            notes: '',
        };

        // Set applicant info (always pre-fill)
        setApplicant(pastApplicant);

        // Check if this is a legacy Cầu Siêu submission
        const isCauSieu = LEGACY_CAU_SIEU_TYPES.has(sub.formType)
            || LEGACY_CAU_SIEU_TYPES.has(sub.ceremonyType);

        if (isCauSieu) {
            // Legacy Cầu Siêu flow → rebuild form data
            const ct = sub.ceremonyType as CeremonyType;
            setRegistrationType(null);
            setDynamicFormData(null);
            setDynamicFieldLabels({});
            setIsReregistering(true);
            setCeremonyType(ct);

            const rebuilt: AllInOneFormData = {
                hlTrong49: [],
                hlNgoai49: [],
                bai8_cungDuong: 'khong',
                bai8_hlGiaTien: false,
                bai8_hlTrenDat: false,
                bai8_danhSachNghiep: [],
                bai8_ghiChu: '',
                tamLinhKhac: [],
            };

            for (const item of sub.itemsData) {
                try {
                    const payload = item.payloadJson ? JSON.parse(item.payloadJson) : {};

                    if (item.categoryKey === 'hl_trong_49_ngay') {
                        rebuilt.hlTrong49!.push({
                            hoTen: payload.hoTen || item.displayName || '',
                            ngayMat: payload.ngayMat || '',
                            tho: payload.tho || '',
                            anTangTai: payload.anTangTai || '',
                        });
                    } else if (item.categoryKey === 'hl_ngoai_49_ro_ten') {
                        rebuilt.hlNgoai49!.push({
                            hoTen: payload.hoTen || item.displayName || '',
                            ngayMat: payload.ngayMat || '',
                            tho: payload.tho || '',
                            anTangTai: payload.anTangTai || '',
                        });
                    } else if (item.categoryKey === 'tam_linh_bai_8') {
                        rebuilt.bai8_cungDuong = payload.cungDuong || 'khong';
                        rebuilt.bai8_hlGiaTien = payload.hlGiaTien || false;
                        rebuilt.bai8_hlTrenDat = payload.hlTrenDat || false;
                        rebuilt.bai8_danhSachNghiep = (payload.danhSachNghiep || []).map((n: { moTa?: string }) => ({ moTa: n.moTa || '' }));
                        rebuilt.bai8_ghiChu = payload.ghiChu || '';
                    } else if (item.categoryKey === 'tam_linh_khac') {
                        rebuilt.tamLinhKhac!.push({ moTa: item.summaryText || payload.moTa || '' });
                    }
                } catch {
                    // Skip malformed items
                }
            }

            setFormData(rebuilt);
            goTo('registration_form');
        } else {
            // Dynamic form (AVLH, SHCT, B8, etc.) → navigate to the form page
            // Save applicant + form data so both can be restored on the form page.
            const targetKey = sub.registrationKey || sub.formType || sub.ceremonyType || sub.registrationLabel;
            const pastFormData = getPastDynamicFormData(sub);
            if (!targetKey.trim()) {
                alert('Không xác định được đường dẫn của form đăng ký cũ. Vui lòng chọn loại đăng ký từ trang chủ.');
                return;
            }

            const targetScope = makeFormScopeKey(targetKey, sub.formType);
            const currentScope = initialRegType
                ? makeFormScopeKey(initialRegType.key, initialRegType.formType)
                : '';

            if (initialRegType && targetScope === currentScope) {
                setCeremonyType(null);
                setFormData(null);
                setDynamicFormData(pastFormData || {});
                setDynamicFieldLabels({});
                setSubmitError(null);
                setIsReregistering(true);
                goTo('registration_form');
                return;
            }

            clearReregisterDataExcept(targetScope);
            saveReregisterData(targetScope, {
                applicant: pastApplicant,
                formData: pastFormData,
                registrationKey: targetKey,
                formType: sub.formType,
            });
            // Use window.location for full page navigation to the direct form link
            window.location.href = `/dang-ky/${encodeURIComponent(targetKey)}`;
        }
    };

    const handleSubmit = async () => {
        if (!applicant) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            let result;
            if (isDynamic && dynamicFormData) {
                result = await submitDynamicRegistration({
                    registrationKey: registrationType!.key,
                    registrationType: registrationType!.formType,
                    registrationLabel: registrationType!.label,
                    applicant,
                    formData: dynamicFormData,
                });
            } else if (ceremonyType && formData) {
                result = await submitRegistration({
                    ceremonyType,
                    applicant,
                    formData,
                });
            } else {
                setSubmitError('Thiếu dữ liệu. Vui lòng điền lại form.');
                setIsSubmitting(false);
                return;
            }

            if (result.success && result.code) {
                setSubmissionCode(result.code);
                clearDraft(formScope);
                // Auto-save profile for future forms
                if (applicant) {
                    saveProfile({ tinChu: applicant.tinChu, phone: applicant.phone, to: applicant.to || '' });
                }
                goTo('success');
            } else {
                setSubmitError(result.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
        } catch {
            setSubmitError('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewRegistration = () => {
        setCeremonyType(null);
        setRegistrationType(null);
        setApplicant(null);
        setFormData(null);
        setDynamicFormData(null);
        setDynamicFieldLabels({});
        setSubmissionCode('');
        setIsReregistering(false);
        clearDraft(formScope);
        goTo('landing');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50 to-blue-50/30">
            {screen !== 'landing' && screen !== 'success' && (
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-stone-200 px-4 md:px-8 py-3">
                    <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link
                                href="/"
                                className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600 hover:bg-amber-100 hover:border-amber-300 transition-colors"
                                title="Về trang chủ"
                            >
                                🏠
                            </Link>
                            <h1 className="text-sm font-bold text-amber-600">
                                {registrationType?.label || 'Đăng Ký'}
                            </h1>
                            {isReregistering && (
                                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                    Đăng ký lại
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {ceremonyType && !isDynamic && (
                                <Badge variant="outline" className="text-xs">
                                    {CEREMONY_MAP.get(ceremonyType)?.shortLabel}
                                </Badge>
                            )}
                            {screen !== 'lookup' && (
                                <button
                                    onClick={() => goTo('lookup')}
                                    className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/50 flex items-center justify-center text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                                    title="Tra cứu đăng ký cũ"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={`mx-auto px-4 md:px-6 py-6 ${screen === 'landing' ? '' : 'max-w-lg md:max-w-xl lg:max-w-2xl'}`}>
                {draftLoaded && screen !== 'landing' && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs mb-4 animate-fade-in">
                        ✨ Đã khôi phục bản nháp trước đó
                    </div>
                )}

                {screen === 'landing' && (
                    <LandingScreen
                        initialConfig={initialLandingConfig}
                        initialTypes={initialRegistrationTypes}
                        onStart={handleStart}
                        onLookup={() => goTo('lookup')}
                    />
                )}
                {screen === 'lookup' && (
                    <LookupScreen
                        onSelectPast={handleSelectPast}
                        onBack={goHome}
                    />
                )}
                {screen === 'ceremony_select' && (
                    <CeremonySelectScreen
                        selected={ceremonyType}
                        onSelect={handleCeremonySelect}
                        onBack={goHome}
                    />
                )}
                {screen === 'applicant' && (
                    <ApplicantScreen
                        defaultValues={applicant}
                        onNext={handleApplicantNext}
                        onBack={() => isDynamic ? goHome() : goTo('ceremony_select')}
                    />
                )}
                {screen === 'registration_form' && !isDynamic && (
                    <RegistrationFormScreen
                        defaultValues={formData || undefined}
                        onNext={handleFormNext}
                        onBack={() => goTo('applicant')}
                    />
                )}
                {screen === 'registration_form' && isDynamic && registrationType && (
                    <DynamicFormScreen
                        formType={registrationType.formType}
                        formLabel={registrationType.label}
                        videoUrl={registrationType.videoUrl}
                        initialSections={initialRegType?.formType === registrationType.formType ? initialFormSections : undefined}
                        defaultValues={dynamicFormData || undefined}
                        applicant={applicant}
                        isReregistering={isReregistering}
                        onEditApplicant={() => goTo('applicant')}
                        onNext={handleDynamicFormNext}
                        onBack={() => goTo('applicant')}
                    />
                )}
                {screen === 'summary' && applicant && !isDynamic && ceremonyType && formData && (
                    <SummaryScreen
                        ceremonyType={ceremonyType}
                        applicant={applicant}
                        formData={formData}
                        isSubmitting={isSubmitting}
                        submitError={submitError}
                        onEditApplicant={() => goTo('applicant')}
                        onEditForm={() => goTo('registration_form')}
                        onSubmit={handleSubmit}
                        onBack={() => goTo('registration_form')}
                    />
                )}
                {screen === 'summary' && applicant && isDynamic && dynamicFormData && (
                    <DynamicSummary
                        registrationLabel={registrationType!.label}
                        applicant={applicant}
                        formData={dynamicFormData}
                        fieldLabels={dynamicFieldLabels}
                        isSubmitting={isSubmitting}
                        submitError={submitError}
                        isReregistering={isReregistering}
                        onEditApplicant={() => goTo('applicant')}
                        onEdit={() => goTo('registration_form')}
                        onSubmit={handleSubmit}
                        onBack={() => goTo('registration_form')}
                    />
                )}
                {screen === 'success' && (
                    <SuccessScreen
                        submissionCode={submissionCode}
                        onNewRegistration={handleNewRegistration}
                    />
                )}
            </div>
        </div>
    );
}
