import { z } from 'zod';

export const applicantSchema = z.object({
    tinChu: z
        .string()
        .min(1, 'Vui lòng nhập Tín chủ / Pháp danh'),
    phone: z
        .string()
        .min(1, 'Vui lòng nhập số điện thoại')
        .regex(/^(0|\+84)[0-9]{8,10}$/, 'Số điện thoại không hợp lệ'),
    daoTrang: z.string().default(''),
    to: z.string().default(''),
    notes: z.string().default(''),
});

export type ApplicantFormData = z.infer<typeof applicantSchema>;
