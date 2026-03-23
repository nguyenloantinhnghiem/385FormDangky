import type { DraftState } from '@/types';

const DRAFT_PREFIX = 'reg_draft_';

function draftKey(formKey?: string): string {
    return DRAFT_PREFIX + (formKey || '_landing');
}

export function saveDraft(state: DraftState, formKey?: string): void {
    try {
        localStorage.setItem(draftKey(formKey), JSON.stringify(state));
    } catch {
        // silent
    }
}

export function loadDraft(formKey?: string): DraftState | null {
    try {
        const raw = localStorage.getItem(draftKey(formKey));
        if (!raw) return null;
        return JSON.parse(raw) as DraftState;
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
