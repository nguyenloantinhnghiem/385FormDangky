import type { DraftState } from '@/types';

const DRAFT_PREFIX = 'reg_draft_';
const REREGISTER_PREFIX = 'reregister_data_';
const LEGACY_REREGISTER_KEY = 'reregister_data';
const DRAFT_VERSION = 2;

export interface FormScope {
    registrationKey?: string | null;
    formType?: string | null;
}

function normalizeStoragePart(value?: string | null): string {
    return (value || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export function makeFormScopeKey(registrationKey?: string | null, formType?: string | null): string {
    const key = normalizeStoragePart(registrationKey);
    const type = normalizeStoragePart(formType);
    if (key && type) return `${key}__${type}`;
    return key || type || '_landing';
}

function draftKey(formScope?: string): string {
    return DRAFT_PREFIX + (formScope || '_landing');
}

export function saveDraft(state: DraftState, formScope?: string, scope?: FormScope): void {
    try {
        localStorage.setItem(draftKey(formScope), JSON.stringify({
            ...state,
            draftVersion: DRAFT_VERSION,
            formScope: formScope || '_landing',
            registrationKey: scope?.registrationKey || '',
            formType: scope?.formType || '',
        }));
    } catch {
        // silent
    }
}

export function loadDraft(formScope?: string, scope?: FormScope): DraftState | null {
    try {
        const key = draftKey(formScope);
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const draft = JSON.parse(raw) as DraftState & Partial<FormScope> & { draftVersion?: number; formScope?: string };
        if (scope) {
            const expectedScope = makeFormScopeKey(scope.registrationKey, scope.formType);
            const matchesScope = draft.formScope === expectedScope;
            const matchesKey = !scope.registrationKey || draft.registrationKey === scope.registrationKey;
            const matchesType = !scope.formType || draft.formType === scope.formType;
            if (!matchesScope || !matchesKey || !matchesType) {
                localStorage.removeItem(key);
                return null;
            }
        }
        return draft;
    } catch {
        return null;
    }
}

export function clearDraft(formKey?: string): void {
    try {
        localStorage.removeItem(draftKey(formKey));
    } catch {
        // silent
    }
}

export function hasDraft(formKey?: string): boolean {
    try {
        return !!localStorage.getItem(draftKey(formKey));
    } catch {
        return false;
    }
}

/** Clear all drafts (used when starting completely fresh) */
export function clearAllDrafts(): void {
    try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(DRAFT_PREFIX));
        keys.forEach(k => localStorage.removeItem(k));
        // Also clear old format key
        localStorage.removeItem('registration_draft_v1');
    } catch {
        // silent
    }
}

export function clearDraftsExcept(formScope?: string): void {
    try {
        const keepKey = formScope ? draftKey(formScope) : '';
        const keys = Object.keys(localStorage).filter(k => k.startsWith(DRAFT_PREFIX));
        keys.forEach((key) => {
            if (key !== keepKey) localStorage.removeItem(key);
        });
        localStorage.removeItem('registration_draft_v1');
    } catch {
        // silent
    }
}

export function saveReregisterData<T extends object>(formScope: string, data: T): void {
    try {
        localStorage.setItem(`${REREGISTER_PREFIX}${formScope}`, JSON.stringify({
            ...data,
            formScope,
            savedAt: new Date().toISOString(),
        }));
    } catch {
        // silent
    }
}

export function consumeReregisterData<T extends object>(formScope: string): T | null {
    try {
        const key = `${REREGISTER_PREFIX}${formScope}`;
        const raw = localStorage.getItem(key);
        localStorage.removeItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function clearReregisterDataExcept(formScope?: string): void {
    try {
        const keepKey = formScope ? `${REREGISTER_PREFIX}${formScope}` : '';
        Object.keys(localStorage)
            .filter((key) => key.startsWith(REREGISTER_PREFIX))
            .forEach((key) => {
                if (key !== keepKey) localStorage.removeItem(key);
            });
        localStorage.removeItem(LEGACY_REREGISTER_KEY);
    } catch {
        // silent
    }
}

export function clearAllReregisterData(): void {
    try {
        Object.keys(localStorage)
            .filter((key) => key.startsWith(REREGISTER_PREFIX))
            .forEach((key) => localStorage.removeItem(key));
        localStorage.removeItem(LEGACY_REREGISTER_KEY);
    } catch {
        // silent
    }
}

// ── Smart Profile ──
// Saves basic user info permanently so it auto-fills across all forms

const PROFILE_KEY = 'user_profile';

export interface UserProfile {
    tinChu: string;
    phone: string;
    to: string;
}

export function saveProfile(profile: UserProfile): void {
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
        // silent
    }
}

export function loadProfile(): UserProfile | null {
    try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as UserProfile;
    } catch {
        return null;
    }
}

export function hasProfile(): boolean {
    try {
        return !!localStorage.getItem(PROFILE_KEY);
    } catch {
        return false;
    }
}
