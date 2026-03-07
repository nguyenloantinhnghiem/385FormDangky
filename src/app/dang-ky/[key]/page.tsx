import { notFound } from 'next/navigation';
import { getRegistrationTypes } from '@/actions/settings';
import RegistrationWizard from '@/components/RegistrationWizard';

interface PageProps {
    params: Promise<{ key: string }>;
}

export default async function FormPage({ params }: PageProps) {
    const { key } = await params;
    const types = await getRegistrationTypes();
    const regType = types.find((t) => t.key === key);

    if (!regType) {
        notFound();
    }

    return <RegistrationWizard initialRegType={regType} />;
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
