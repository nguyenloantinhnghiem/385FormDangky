'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CEREMONY_MAP } from '@/config/categories';
import { submitRegistration } from '@/actions/submit';
import { submitDynamicRegistration } from '@/actions/submit-dynamic';
import { saveDraft, loadDraft, clearDraft, hasDraft, clearAllDrafts } from '@/lib/utils/draft';
import type { Applicant, CeremonyType, ScreenName } from '@/types';
import type { AllInOneFormData } from '@/components/screens/RegistrationFormScreen';
import type { RegistrationType } from '@/actions/settings';

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
import { Loader2, CheckCircle, AlertCircle, Edit2, ArrowLeft, Send } from 'lucide-react';

// Inline Dynamic Summary component
function DynamicSummary({ registrationLabel, applicant, formData, fieldLabels, isSubmitting, submitError, onEdit, onSubmit, onBack }: {
    registrationLabel: string;
    applicant: Applicant;
    formData: Record<string, unknown>;
    fieldLabels: Record<string, string>;
    isSubmitting: boolean;
    submitError: string | null;
    onEdit: () => void;
    onSubmit: () => void;
    onBack: () => void;
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

    return (
        <div className="animate-slide-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-stone-800">Xem lại đăng ký</h2>
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
                        if (value === undefined || value === null || value === '' || value === false) return null;
                        if (Array.isArray(value) && value.length === 0) return null;
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
}

export default function RegistrationWizard({ initialRegType }: WizardProps) {
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

    // Form key for draft isolation
    const formKey = registrationType?.key;

    // Navigate home: if direct link → go to /, else show landing
    const goHome = useCallback(() => {
        if (initialRegType) {
            router.push('/');
        } else {
            setScreen('landing');
        }
    }, [initialRegType, router]);

    // On direct link: clear old draft for this form to start fresh
    useEffect(() => {
        if (initialRegType) {
            clearDraft(initialRegType.key);
            // Also clear legacy shared draft
            clearAllDrafts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load draft only when on landing page (no initialRegType)
    useEffect(() => {
        if (initialRegType) return; // Direct link — always fresh
        if (typeof window !== 'undefined' && hasDraft()) {
            const draft = loadDraft();
            if (draft) {
                const validScreens: ScreenName[] = ['landing', 'ceremony_select', 'applicant', 'registration_form', 'lookup', 'summary', 'success'];
                const savedScreen = draft.currentScreen || 'landing';

                if (!validScreens.includes(savedScreen)) {
                    clearDraft(formKey);
                    return;
                }

                setCeremonyType(draft.ceremonyType);
                setApplicant(draft.applicant);
                setScreen(savedScreen);
                setDraftLoaded(true);
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
        }, formKey);
    }, [ceremonyType, applicant, screen, formKey]);

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

    // Handle start from landing — receives registration type
    const handleStart = (regType?: RegistrationType) => {
        if (regType) setRegistrationType(regType);
        if (regType?.formType === 'cau_sieu') {
            // Legacy cau_sieu flow → ceremony select
            goTo('ceremony_select');
        } else {
            // Other types → skip ceremony select (use reg type label as ceremony)
            goTo('applicant');
        }
    };

    const handleCeremonySelect = (type: CeremonyType) => {
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
        // Set ceremony type
        const ct = sub.ceremonyType as CeremonyType;
        setCeremonyType(ct);

        // Set applicant
        setApplicant({
            tinChu: sub.applicantName,
            phone: sub.applicantPhone,
            daoTrang: '',
            to: sub.applicantTo || '',
            notes: '',
        });

        // Rebuild form data from items
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
    };

    const handleSubmit = async () => {
        if (!applicant) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            let result;
            if (isDynamic && dynamicFormData) {
                result = await submitDynamicRegistration({
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
                clearDraft(formKey);
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
        clearDraft(formKey);
        goTo('landing');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50 to-blue-50/30">
            {screen !== 'landing' && screen !== 'success' && (
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-stone-200 px-4 py-3">
                    <div className="max-w-lg mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <a
                                href="/"
                                className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600 hover:bg-amber-100 hover:border-amber-300 transition-colors"
                                title="Về trang chủ"
                            >
                                🏠
                            </a>
                            <h1 className="text-sm font-bold text-amber-600">
                                {registrationType?.label || 'Đăng Ký'}
                            </h1>
                        </div>
                        {ceremonyType && !isDynamic && (
                            <Badge variant="outline" className="text-xs">
                                {CEREMONY_MAP.get(ceremonyType)?.shortLabel}
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-lg mx-auto px-4 py-6">
                {draftLoaded && screen !== 'landing' && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs mb-4 animate-fade-in">
                        ✨ Đã khôi phục bản nháp trước đó
                    </div>
                )}

                {screen === 'landing' && (
                    <LandingScreen
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
                        defaultValues={dynamicFormData || undefined}
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
