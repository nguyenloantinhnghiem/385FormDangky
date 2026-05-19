import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRegistrationTypes, getLandingConfig } from '@/actions/settings';
import { getFormFields } from '@/actions/form-fields';
import RegistrationWizard from '@/components/RegistrationWizard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface PageProps {
    params: Promise<{ key: string }>;
}

function ClosedMessage({ label, message }: { label: string; message?: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-stone-100 flex items-center justify-center">
                    <span className="text-4xl">🔒</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">{label}</h1>
                    <p className="text-stone-600">
                        {message || 'Đăng ký đã đóng hoặc hết hạn. Vui lòng quay lại sau.'}
                    </p>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                >
                    ← Về trang chủ
                </Link>
            </div>
        </div>
    );
}

export default async function FormPage({ params }: PageProps) {
    const { key } = await params;
    const [types, config] = await Promise.all([
        getRegistrationTypes(),
        getLandingConfig(),
    ]);
    const regType = types.find((t) => t.key === key);

    if (!regType) {
        notFound();
    }

    // Check if this specific form type is closed
    if (!regType.open) {
        return <ClosedMessage label={regType.label} />;
    }

    if (!config.registrationOpen) {
        return (
            <ClosedMessage
                label={regType.label}
                message={config.closeMessage || 'Hệ thống đăng ký hiện đang đóng. Vui lòng quay lại sau.'}
            />
        );
    }

    const initialFormSections = regType.formType === 'cau_sieu'
        ? []
        : await getFormFields(regType.formType);

    return (
        <RegistrationWizard
            key={regType.key}
            initialRegType={regType}
            initialFormSections={initialFormSections}
            initialLandingConfig={config}
            initialRegistrationTypes={types}
        />
    );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
    const { key } = await params;
    const types = await getRegistrationTypes();
    const regType = types.find((t) => t.key === key);

    return {
        title: regType ? `${regType.label} - Đăng ký` : 'Đăng ký',
        description: regType?.description || 'Form đăng ký',
    };
}
