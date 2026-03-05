import type { CategoryDefinition, CeremonyDefinition } from '@/types';

// ============================================================
// Ceremony Types (Loại cầu siêu)
// ============================================================

export const CEREMONY_TYPES: CeremonyDefinition[] = [
    {
        key: 'trai_tang',
        label: 'Cầu siêu trai Tăng',
        shortLabel: 'Trai Tăng',
        icon: '🙏',
        description: 'Cầu siêu trai Tăng — có Chư Tăng bạch lễ',
    },
    {
        key: 'trai_vien',
        label: 'Cầu siêu trai Viên',
        shortLabel: 'Trai Viên',
        icon: '📿',
        description: 'Cầu siêu trai Viên',
    },
    {
        key: 'tuy_duyen',
        label: 'Cầu siêu cúng dường tùy duyên',
        shortLabel: 'Tùy duyên',
        icon: '🪷',
        description: 'Cầu siêu cúng dường tùy duyên',
    },
];

export const CEREMONY_MAP = new Map(CEREMONY_TYPES.map((c) => [c.key, c]));

// ============================================================
// Registration Item Categories
// ============================================================

export const CATEGORIES: CategoryDefinition[] = [
    {
        key: 'hl_trong_49_ngay',
        label: 'Hương linh mới mất (trong 49 ngày)',
        shortLabel: 'HL trong 49 ngày',
        icon: '🕯️',
        helperText: 'Dành cho hương linh mới qua đời, còn trong giai đoạn 49 ngày. Có thể thêm nhiều người.',
        fields: [],
        defaultValues: {
            nguoiMat: [{ hoTen: '', ngayMat: '', tho: '', anTangTai: '' }],
        },
    },
    {
        key: 'hl_ngoai_49_ro_ten',
        label: 'Hương linh ngoài 49 ngày (rõ tên)',
        shortLabel: 'HL ngoài 49 ngày',
        icon: '🪔',
        helperText: 'Dành cho hương linh đã quá 49 ngày, biết rõ tên. Có thể thêm nhiều người.',
        fields: [],
        defaultValues: {
            nguoiMat: [{ hoTen: '', ngayMat: '', tho: '', anTangTai: '' }],
        },
    },
    {
        key: 'tam_linh_bai_8',
        label: 'Các mục tâm linh bài số 8',
        shortLabel: 'Tâm linh bài 8',
        icon: '📜',
        helperText: 'Các mục tâm linh theo bài số 8. Có thể thêm nhiều mục HL trên nghiệp.',
        noteText: 'Lưu ý: Không ghi các mục hương linh có oán kết chung, riêng như viết mục HL bạch chư Tăng.',
        fields: [],
        defaultValues: {
            cungDuongChuThien: 'khong',
            hlGiaTien: false,
            hlTrenDat: false,
            danhSachNghiep: [],
            ghiChu: '',
        },
    },
    {
        key: 'tam_linh_khac',
        label: 'Các mục tâm linh khác (không tu bài số 8)',
        shortLabel: 'Tâm linh khác',
        icon: '🔮',
        helperText: 'Dành cho các mục tâm linh khác. Có thể thêm nhiều mục.',
        fields: [],
        defaultValues: {
            danhSach: [{ moTa: '' }],
        },
    },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.key, c]));
