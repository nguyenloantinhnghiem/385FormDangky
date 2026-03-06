'use client';

import { useState, useCallback, useEffect } from 'react';
import { CEREMONY_MAP } from '@/config/categories';
import { submitRegistration } from '@/actions/submit';
import { saveDraft, loadDraft, clearDraft, hasDraft } from '@/lib/utils/draft';
import type { Applicant, CeremonyType, ScreenName } from '@/types';
import type { AllInOneFormData } from '@/components/screens/RegistrationFormScreen';
import type { RegistrationType } from '@/actions/settings';

import LandingScreen from '@/components/screens/LandingScreen';
import CeremonySelectScreen from '@/components/screens/CeremonySelectScreen';
import ApplicantScreen from '@/components/screens/ApplicantScreen';
import RegistrationFormScreen from '@/components/screens/RegistrationFormScreen';
import LookupScreen, { type PastSubmission } from '@/components/screens/LookupScreen';
import SummaryScreen from '@/components/screens/SummaryScreen';
import SuccessScreen from '@/components/screens/SuccessScreen';
import { Badge } from '@/components/ui/badge';

export default function RegistrationWizard() {
    const [screen, setScreen] = useState<ScreenName>('landing');
    const [ceremonyType, setCeremonyType] = useState<CeremonyType | null>(null);
    const [registrationType, setRegistrationType] = useState<RegistrationType | null>(null);
    const [applicant, setApplicant] = useState<Applicant | null>(null);
    const [formData, setFormData] = useState<AllInOneFormData | null>(null);
    const [submissionCode, setSubmissionCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [draftLoaded, setDraftLoaded] = useState(false);

    // Load draft
    useEffect(() => {
        if (typeof window !== 'undefined' && hasDraft()) {
            const draft = loadDraft();
            if (draft) {
                const validScreens: ScreenName[] = ['landing', 'ceremony_select', 'applicant', 'registration_form', 'lookup', 'summary', 'success'];
                const savedScreen = draft.currentScreen || 'landing';

                if (!validScreens.includes(savedScreen)) {
                    clearDraft();
                    return;
                }

                setCeremonyType(draft.ceremonyType);
                setApplicant(draft.applicant);
                setScreen(savedScreen);
                setDraftLoaded(true);
            }
        }
    }, []);

    // Auto-save draft
    const persistDraft = useCallback(() => {
        saveDraft({
            ceremonyType,
            applicant,
            items: [],
            currentScreen: screen,
            lastUpdated: new Date().toISOString(),
        });
    }, [ceremonyType, applicant, screen]);

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
            // Cầu Siêu flow → ceremony select
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
        if (!applicant || !ceremonyType || !formData) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const result = await submitRegistration({
                ceremonyType,
                applicant,
                formData,
            });

            if (result.success && result.code) {
                setSubmissionCode(result.code);
                clearDraft();
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
        setSubmissionCode('');
        clearDraft();
        goTo('landing');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-stone-50 to-blue-50/30">
            {screen !== 'landing' && screen !== 'success' && (
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-stone-200 px-4 py-3">
                    <div className="max-w-lg mx-auto flex items-center justify-between">
                        <h1 className="text-sm font-bold text-amber-600">
                            {registrationType?.label || 'Đăng Ký Cầu Siêu'}
                        </h1>
                        {ceremonyType && (
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
                        onBack={() => goTo('landing')}
                    />
                )}
                {screen === 'ceremony_select' && (
                    <CeremonySelectScreen
                        selected={ceremonyType}
                        onSelect={handleCeremonySelect}
                        onBack={() => goTo('landing')}
                    />
                )}
                {screen === 'applicant' && (
                    <ApplicantScreen
                        defaultValues={applicant}
                        onNext={handleApplicantNext}
                        onBack={() => goTo('ceremony_select')}
                    />
                )}
                {screen === 'registration_form' && (
                    <RegistrationFormScreen
                        defaultValues={formData || undefined}
                        onNext={handleFormNext}
                        onBack={() => goTo('applicant')}
                    />
                )}
                {screen === 'summary' && applicant && ceremonyType && formData && (
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
