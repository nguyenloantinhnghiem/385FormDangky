'use server';

import { getRegistrationTypes } from '@/actions/settings';
import type { RegistrationType } from '@/actions/settings';

export async function findRegistrationType(key: string): Promise<RegistrationType | null> {
    const types = await getRegistrationTypes();
    return types.find((t) => t.key === key) || null;
}
