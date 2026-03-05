'use server';

import { v4 as uuidv4 } from 'uuid';
import { CEREMONY_MAP } from '@/config/categories';
import { generateSubmissionCode } from '@/lib/utils/submission-code';
import { appendSubmission, appendSubmissionItems, appendAuditLog } from '@/lib/sheets/helpers';

interface NguoiMat { hoTen: string; ngayMat?: string; tho?: string; anTangTai?: string; }
interface NghiepItem { moTa: string; }

interface FormData {
    hlTrong49?: NguoiMat[];
    hlNgoai49?: NguoiMat[];
    bai8_cungDuong?: string;
    bai8_hlGiaTien?: boolean;
    bai8_hlTrenDat?: boolean;
    bai8_danhSachNghiep?: NghiepItem[];
    bai8_ghiChu?: string;
    tamLinhKhac?: NghiepItem[];
}

interface SubmitPayload {
    ceremonyType: string;
    applicant: {
        tinChu: string;
        phone: string;
        daoTrang?: string;
        notes?: string;
    };
    formData: FormData;
}

interface SubmitResult {
    success: boolean;
    code?: string;
    error?: string;
}

export async function submitRegistration(payload: SubmitPayload): Promise<SubmitResult> {
    try {
        const { ceremonyType, applicant, formData } = payload;
        const ceremony = CEREMONY_MAP.get(ceremonyType as 'trai_tang' | 'trai_vien' | 'tuy_duyen');

        const submissionId = uuidv4();
        const submissionCode = generateSubmissionCode();
        const now = new Date().toISOString();

        // Build item rows from flat form data
        const itemRows: Parameters<typeof appendSubmissionItems>[0] = [];
        let itemIndex = 0;

        // HL trong 49
        for (const nm of formData.hlTrong49 || []) {
            if (!nm.hoTen?.trim()) continue;
            itemIndex++;
            const parts = [];
            if (nm.ngayMat) parts.push(`Mất: ${nm.ngayMat}`);
            if (nm.tho) parts.push(`Thọ: ${nm.tho}`);
            if (nm.anTangTai) parts.push(`An táng: ${nm.anTangTai}`);
            itemRows.push({
                item_id: uuidv4(),
                submission_id: submissionId,
                item_index: String(itemIndex),
                category_key: 'hl_trong_49_ngay',
                category_label: 'HL mới mất (trong 49 ngày)',
                created_at: now,
                updated_at: now,
                display_name: nm.hoTen,
                summary_text: parts.join(' • '),
                subject_name: nm.hoTen,
                reference_value: '',
                item_payload_json: JSON.stringify(nm),
                status: 'active',
            });
        }

        // HL ngoài 49
        for (const nm of formData.hlNgoai49 || []) {
            if (!nm.hoTen?.trim()) continue;
            itemIndex++;
            const parts = [];
            if (nm.ngayMat) parts.push(`Mất: ${nm.ngayMat}`);
            if (nm.tho) parts.push(`Thọ: ${nm.tho}`);
            if (nm.anTangTai) parts.push(`An táng: ${nm.anTangTai}`);
            itemRows.push({
                item_id: uuidv4(),
                submission_id: submissionId,
                item_index: String(itemIndex),
                category_key: 'hl_ngoai_49_ro_ten',
                category_label: 'HL ngoài 49 ngày (rõ tên)',
                created_at: now,
                updated_at: now,
                display_name: nm.hoTen,
                summary_text: parts.join(' • '),
                subject_name: nm.hoTen,
                reference_value: '',
                item_payload_json: JSON.stringify(nm),
                status: 'active',
            });
        }

        // Bài 8
        const hasBai8 = formData.bai8_cungDuong === 'co'
            || formData.bai8_hlGiaTien
            || formData.bai8_hlTrenDat
            || (formData.bai8_danhSachNghiep && formData.bai8_danhSachNghiep.length > 0);

        if (hasBai8) {
            itemIndex++;
            const parts = [];
            if (formData.bai8_cungDuong === 'co') parts.push('Cúng dường chư Thiên');
            if (formData.bai8_hlGiaTien) parts.push('HL gia tiên');
            if (formData.bai8_hlTrenDat) parts.push('HL trên đất');
            for (const n of formData.bai8_danhSachNghiep || []) {
                if (n.moTa?.trim()) parts.push(n.moTa);
            }
            itemRows.push({
                item_id: uuidv4(),
                submission_id: submissionId,
                item_index: String(itemIndex),
                category_key: 'tam_linh_bai_8',
                category_label: 'Tâm linh bài số 8',
                created_at: now,
                updated_at: now,
                display_name: 'Tâm linh bài số 8',
                summary_text: parts.join(' • '),
                subject_name: applicant.tinChu,
                reference_value: '',
                item_payload_json: JSON.stringify({
                    cungDuong: formData.bai8_cungDuong,
                    hlGiaTien: formData.bai8_hlGiaTien,
                    hlTrenDat: formData.bai8_hlTrenDat,
                    danhSachNghiep: formData.bai8_danhSachNghiep,
                    ghiChu: formData.bai8_ghiChu,
                }),
                status: 'active',
            });
        }

        // Tâm linh khác
        for (const n of formData.tamLinhKhac || []) {
            if (!n.moTa?.trim()) continue;
            itemIndex++;
            itemRows.push({
                item_id: uuidv4(),
                submission_id: submissionId,
                item_index: String(itemIndex),
                category_key: 'tam_linh_khac',
                category_label: 'Tâm linh khác',
                created_at: now,
                updated_at: now,
                display_name: n.moTa.slice(0, 80),
                summary_text: n.moTa,
                subject_name: applicant.tinChu,
                reference_value: '',
                item_payload_json: JSON.stringify(n),
                status: 'active',
            });
        }

        if (itemRows.length === 0) {
            return { success: false, error: 'Không có mục đăng ký nào.' };
        }

        // Categories summary
        const categorySet = new Set(itemRows.map((r) => r.category_label));
        const categoriesText = [...categorySet].join(', ');

        // Write submission
        await appendSubmission({
            submission_id: submissionId,
            submission_code: submissionCode,
            created_at: now,
            updated_at: now,
            status: 'submitted',
            ceremony_type: ceremonyType,
            ceremony_label: ceremony?.label || ceremonyType,
            applicant_name: applicant.tinChu,
            applicant_phone: applicant.phone,
            applicant_dao_trang: applicant.daoTrang || '',
            total_items: String(itemRows.length),
            categories_text: categoriesText,
            applicant_payload_json: JSON.stringify(applicant),
            source: 'webapp',
            notes: applicant.notes || '',
        });

        await appendSubmissionItems(itemRows);

        await appendAuditLog({
            log_id: uuidv4(),
            submission_id: submissionId,
            action: 'submit',
            created_at: now,
            detail: `Submitted ${itemRows.length} items via webapp. Ceremony: ${ceremony?.label}`,
        });

        return { success: true, code: submissionCode };
    } catch (err) {
        console.error('Submit error:', err);
        return { success: false, error: 'Đã có lỗi khi gửi đăng ký. Vui lòng thử lại sau.' };
    }
}
