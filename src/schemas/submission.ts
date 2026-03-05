import { z } from 'zod';
import type { CategoryKey } from '@/types';

// ============================================================
// Category-specific Zod schemas
// ============================================================

// HL mới mất (trong 49 ngày) — supports MULTIPLE deceased
export const hlTrong49Schema = z.object({
    nguoiMat: z.array(z.object({
        hoTen: z.string().min(1, 'Vui lòng nhập họ tên'),
        ngayMat: z.string().default(''),
        tho: z.string().default(''),
        anTangTai: z.string().default(''),
    })).min(1, 'Cần ít nhất 1 hương linh'),
});

// HL ngoài 49 ngày (rõ tên) — supports MULTIPLE deceased
export const hlNgoai49Schema = z.object({
    nguoiMat: z.array(z.object({
        hoTen: z.string().min(1, 'Vui lòng nhập họ tên'),
        ngayMat: z.string().default(''),
        tho: z.string().default(''),
        anTangTai: z.string().default(''),
    })).min(1, 'Cần ít nhất 1 hương linh'),
});

// Tâm linh bài số 8 — one-time fields + MULTIPLE HL trên nghiệp entries
export const tamLinhBai8Schema = z.object({
    cungDuongChuThien: z.string().default('khong'),
    hlGiaTien: z.boolean().default(false),
    hlTrenDat: z.boolean().default(false),
    danhSachNghiep: z.array(z.object({
        moTa: z.string().min(1, 'Vui lòng nhập mô tả'),
    })).default([]),
    ghiChu: z.string().default(''),
});

// Tâm linh khác (không tu bài số 8) — MULTIPLE entries
export const tamLinhKhacSchema = z.object({
    danhSach: z.array(z.object({
        moTa: z.string().min(1, 'Vui lòng nhập nội dung'),
    })).min(1, 'Cần ít nhất 1 mục'),
});

// Map category key → schema
export const categorySchemas: Record<CategoryKey, z.ZodObject<z.ZodRawShape>> = {
    hl_trong_49_ngay: hlTrong49Schema as unknown as z.ZodObject<z.ZodRawShape>,
    hl_ngoai_49_ro_ten: hlNgoai49Schema as unknown as z.ZodObject<z.ZodRawShape>,
    tam_linh_bai_8: tamLinhBai8Schema as unknown as z.ZodObject<z.ZodRawShape>,
    tam_linh_khac: tamLinhKhacSchema as unknown as z.ZodObject<z.ZodRawShape>,
};

// Full submission schema for server-side validation
export const submissionPayloadSchema = z.object({
    ceremonyType: z.enum(['trai_tang', 'trai_vien', 'tuy_duyen']),
    applicant: z.object({
        tinChu: z.string().min(1),
        phone: z.string().min(1),
        daoTrang: z.string().optional(),
        notes: z.string().optional(),
    }),
    items: z.array(z.object({
        id: z.string(),
        categoryKey: z.string(),
        categoryLabel: z.string(),
        data: z.record(z.string(), z.unknown()),
        createdAt: z.string(),
        updatedAt: z.string(),
    })).min(1, 'Cần ít nhất 1 mục đăng ký'),
});
