// ============================================================
// Core types for Buddhist ceremony registration
// ============================================================

export type CeremonyType = 'trai_tang' | 'trai_vien' | 'tuy_duyen';

export type CategoryKey =
    | 'hl_trong_49_ngay'
    | 'hl_ngoai_49_ro_ten'
    | 'tam_linh_bai_8'
    | 'tam_linh_khac';

export type ScreenName =
    | 'landing'
    | 'ceremony_select'
    | 'applicant'
    | 'registration_form'
    | 'summary'
    | 'success';

// Applicant = person registering
export interface Applicant {
    tinChu: string;        // Tín chủ / Phật tử / Pháp danh
    phone: string;
    daoTrang: string;      // Đạo tràng / Nhóm
    to: string;            // Thuộc tổ nào (Tổ 1, Tổ 2, ...)
    notes: string;
}

// A single registered item
export interface SubmissionItem {
    id: string;
    categoryKey: CategoryKey;
    categoryLabel: string;
    data: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

// Full submission
export interface Submission {
    id: string;
    code: string;
    ceremonyType: CeremonyType;
    ceremonyLabel: string;
    applicant: Applicant;
    items: SubmissionItem[];
    createdAt: string;
}

// Category definition for config
export interface FieldDefinition {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
    required: boolean;
    placeholder?: string;
    helperText?: string;
    options?: { value: string; label: string }[];
}

export interface CategoryDefinition {
    key: CategoryKey;
    label: string;
    shortLabel: string;
    icon: string;
    helperText: string;
    noteText?: string;
    fields: FieldDefinition[];
    defaultValues: Record<string, unknown>;
}

export interface CeremonyDefinition {
    key: CeremonyType;
    label: string;
    shortLabel: string;
    icon: string;
    description: string;
}

// Draft state for localStorage
export interface DraftState {
    ceremonyType: CeremonyType | null;
    applicant: Applicant | null;
    items: SubmissionItem[];
    currentScreen: ScreenName;
    lastUpdated: string;
}

// Google Sheets row types
export interface SubmissionRow {
    submission_id: string;
    submission_code: string;
    created_at: string;
    updated_at: string;
    status: string;
    ceremony_type: string;
    ceremony_label: string;
    applicant_name: string;
    applicant_phone: string;
    applicant_dao_trang: string;
    applicant_to: string;
    total_items: string;
    categories_text: string;
    applicant_payload_json: string;
    source: string;
    notes: string;
}

export interface SubmissionItemRow {
    item_id: string;
    submission_id: string;
    item_index: string;
    category_key: string;
    category_label: string;
    created_at: string;
    updated_at: string;
    display_name: string;
    summary_text: string;
    subject_name: string;
    reference_value: string;
    item_payload_json: string;
    status: string;
}
