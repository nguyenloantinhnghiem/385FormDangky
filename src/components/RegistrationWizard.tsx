'use client';

import { useState, useCallback, useEffect } from 'react';
import { CEREMONY_MAP } from '@/config/categories';
import { submitRegistration } from '@/actions/submit';
import { saveDraft, loadDraft, clearDraft, hasDraft } from '@/lib/utils/draft';
import type { Applicant, CeremonyType, ScreenName } from '@/types';
import type { AllInOneFormData } from '@/components/screens/RegistrationFormScreen';

import LandingScreen from '@/components/screens/LandingScreen';
import CeremonySelectScreen from '@/components/screens/CeremonySelectScreen';
import ApplicantScreen from '@/components/screens/ApplicantScreen';
import RegistrationFormScreen from '@/components/screens/RegistrationFormScreen';
import SummaryScreen from '@/components/screens/SummaryScreen';
import SuccessScreen from '@/components/screens/SuccessScreen';
import { Badge } from '@/components/ui/badge';

export default function RegistrationWizard() {
    const [screen, setScreen] = useState<ScreenName>('landing');
    const [ceremonyType, setCeremonyType] = useState<CeremonyType | null>(null);
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
                setCeremonyType(draft.ceremonyType);
                setApplicant(draft.applicant);
                if (draft.items && draft.items.length > 0) {
                    // Legacy draft — ignore items, start fresh
                }
                setScreen(draft.currentScreen || 'landing');
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
                        <h1 className="text-sm font-bold text-amber-600">Đăng Ký Cầu Siêu</h1>
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
                    <LandingScreen onStart={() => goTo('ceremony_select')} />
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
