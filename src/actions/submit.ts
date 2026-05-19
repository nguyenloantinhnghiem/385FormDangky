'use server';

import { v4 as uuidv4 } from 'uuid';
import { CEREMONY_MAP } from '@/config/categories';
import { generateSubmissionCode } from '@/lib/utils/submission-code';
import {
    appendSubmission,
    appendSubmissionItems,
    appendAuditLog,
    appendSummaryRow,
    getNextSTT,
    appendToFormSheet,
    type FormSheetFieldConfig,
} from '@/lib/sheets/helpers';

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
        to?: string;
        notes?: string;
    };
    formData: FormData;
}

interface SubmitResult {
    success: boolean;
    code?: string;
    error?: string;
}

// ============================================================
// Build the formatted text block matching the sample output
// ============================================================
function buildFormattedText(applicant: SubmitPayload['applicant'], formData: FormData): string {
    const lines: string[] = [];

    const hlTrong49 = (formData.hlTrong49 || []).filter((n) => n.hoTen?.trim());
    const hlNgoai49 = (formData.hlNgoai49 || []).filter((n) => n.hoTen?.trim());
    const bai8Nghiep = (formData.bai8_danhSachNghiep || []).filter((n) => n.moTa?.trim());
    const tamLinhKhac = (formData.tamLinhKhac || []).filter((n) => n.moTa?.trim());
    const hasBai8 = formData.bai8_cungDuong === 'co'
        || formData.bai8_hlGiaTien
        || formData.bai8_hlTrenDat
        || bai8Nghiep.length > 0;

    lines.push(`Tín chủ/Phật tử: ${applicant.tinChu}`);
    if (applicant.daoTrang) {
        lines.push(`Đạo tràng/Nhóm: ${applicant.daoTrang}`);
    }
    lines.push(`SĐT: ${applicant.phone}`);
    lines.push('- Mục hương linh:');

    // a. HL trong 49 ngày
    if (hlTrong49.length > 0) {
        lines.push('a. Danh sách cầu siêu hương linh mới mất (trong vòng 49 ngày)');
        lines.push(`Số lượng: ${hlTrong49.length}`);
        hlTrong49.forEach((nm, i) => {
            lines.push(`${i + 1}. Tín chủ/Phật tử: ${applicant.tinChu} SĐT: ${applicant.phone}`);
            lines.push(`+ Họ tên người mất: ${nm.hoTen}. Mất ngày: ${nm.ngayMat || 'Không rõ'}. Thọ: ${nm.tho || 'Không rõ'} tuổi`);
            lines.push(`+ An táng tại: ${nm.anTangTai || 'Không rõ'}`);
        });
    }

    // b. HL ngoài 49 ngày (rõ tên) — nếu không có HL trong 49 thì dùng letter "a."
    if (hlNgoai49.length > 0) {
        const letter = hlTrong49.length > 0 ? 'b' : 'a';
        lines.push(`${letter}. Có rõ tên hương linh (HL ngoài 49 ngày)`);
        hlNgoai49.forEach((nm) => {
            lines.push(`+ Họ tên người mất: ${nm.hoTen}. Mất ngày: ${nm.ngayMat || 'Không rõ'}. Thọ: ${nm.tho || 'Không rõ'} tuổi`);
            lines.push(`+ An táng tại: ${nm.anTangTai || 'Không rõ'}`);
        });
    }

    // c. Tâm linh bài 8
    if (hasBai8) {
        const usedLetters: string[] = [];
        if (hlTrong49.length > 0) usedLetters.push('a');
        if (hlNgoai49.length > 0) usedLetters.push(usedLetters.length === 0 ? 'a' : 'b');
        const nextLetter = String.fromCharCode(97 + usedLetters.length); // a=97

        lines.push(`${nextLetter}. Các mục tâm linh bài số 8:`);
        if (formData.bai8_cungDuong === 'co') {
            lines.push('+ Cúng dường hồi hướng cho chư Thiên, chư Thần Linh, chư linh thần hộ trì: Có');
        }
        if (formData.bai8_hlGiaTien) {
            lines.push('+ HL gia tiên hợp duyên đã bạch thỉnh');
        }
        if (formData.bai8_hlTrenDat) {
            lines.push('+ HL trên đất hợp duyên đã bạch thỉnh');
        }
        bai8Nghiep.forEach((n) => {
            lines.push(`+ ${n.moTa}`);
        });
        if (formData.bai8_ghiChu?.trim()) {
            lines.push(`Ghi chú: ${formData.bai8_ghiChu}`);
        }
    }

    // d. Tâm linh khác
    if (tamLinhKhac.length > 0) {
        let sectionCount = 0;
        if (hlTrong49.length > 0) sectionCount++;
        if (hlNgoai49.length > 0) sectionCount++;
        if (hasBai8) sectionCount++;
        const nextLetter = String.fromCharCode(97 + sectionCount);

        lines.push(`${nextLetter}. Các mục tâm linh khác (không tu bài số 8)`);
        tamLinhKhac.forEach((n) => {
            lines.push(`+ ${n.moTa}`);
        });
    }

    if (applicant.notes?.trim()) {
        lines.push('');
        lines.push(`Ghi chú: ${applicant.notes}`);
    }

    return lines.join('\n');
}

export async function submitRegistration(payload: SubmitPayload): Promise<SubmitResult> {
    try {
        const { ceremonyType, applicant, formData } = payload;
        const ceremony = CEREMONY_MAP.get(ceremonyType as 'trai_tang' | 'trai_vien' | 'tuy_duyen');

        const submissionId = uuidv4();
        const submissionCode = generateSubmissionCode();
        const now = new Date().toISOString();

        // Build formatted text for sample output
        const formattedText = buildFormattedText(applicant, formData);

        // Build item rows for structured data
        const itemRows: Parameters<typeof appendSubmissionItems>[0] = [];
        let itemIndex = 0;

        for (const nm of formData.hlTrong49 || []) {
            if (!nm.hoTen?.trim()) continue;
            itemIndex++;
            itemRows.push({
                item_id: uuidv4(), submission_id: submissionId,
                item_index: String(itemIndex), category_key: 'hl_trong_49_ngay',
                category_label: 'HL mới mất (trong 49 ngày)',
                created_at: now, updated_at: now,
                display_name: nm.hoTen,
                summary_text: [nm.ngayMat && `Mất: ${nm.ngayMat}`, nm.tho && `Thọ: ${nm.tho}`, nm.anTangTai && `An táng: ${nm.anTangTai}`].filter(Boolean).join(' • '),
                subject_name: nm.hoTen, reference_value: '',
                item_payload_json: JSON.stringify(nm), status: 'active',
            });
        }

        for (const nm of formData.hlNgoai49 || []) {
            if (!nm.hoTen?.trim()) continue;
            itemIndex++;
            itemRows.push({
                item_id: uuidv4(), submission_id: submissionId,
                item_index: String(itemIndex), category_key: 'hl_ngoai_49_ro_ten',
                category_label: 'HL ngoài 49 ngày (rõ tên)',
                created_at: now, updated_at: now,
                display_name: nm.hoTen,
                summary_text: [nm.ngayMat && `Mất: ${nm.ngayMat}`, nm.tho && `Thọ: ${nm.tho}`, nm.anTangTai && `An táng: ${nm.anTangTai}`].filter(Boolean).join(' • '),
                subject_name: nm.hoTen, reference_value: '',
                item_payload_json: JSON.stringify(nm), status: 'active',
            });
        }

        const hasBai8 = formData.bai8_cungDuong === 'co' || formData.bai8_hlGiaTien || formData.bai8_hlTrenDat
            || (formData.bai8_danhSachNghiep && formData.bai8_danhSachNghiep.filter(n => n.moTa?.trim()).length > 0);
        if (hasBai8) {
            itemIndex++;
            const parts = [];
            if (formData.bai8_cungDuong === 'co') parts.push('Cúng dường chư Thiên');
            if (formData.bai8_hlGiaTien) parts.push('HL gia tiên');
            if (formData.bai8_hlTrenDat) parts.push('HL trên đất');
            for (const n of formData.bai8_danhSachNghiep || []) { if (n.moTa?.trim()) parts.push(n.moTa); }
            itemRows.push({
                item_id: uuidv4(), submission_id: submissionId,
                item_index: String(itemIndex), category_key: 'tam_linh_bai_8',
                category_label: 'Tâm linh bài số 8',
                created_at: now, updated_at: now,
                display_name: 'Tâm linh bài số 8', summary_text: parts.join(' • '),
                subject_name: applicant.tinChu, reference_value: '',
                item_payload_json: JSON.stringify({ cungDuong: formData.bai8_cungDuong, hlGiaTien: formData.bai8_hlGiaTien, hlTrenDat: formData.bai8_hlTrenDat, danhSachNghiep: formData.bai8_danhSachNghiep, ghiChu: formData.bai8_ghiChu }),
                status: 'active',
            });
        }

        for (const n of formData.tamLinhKhac || []) {
            if (!n.moTa?.trim()) continue;
            itemIndex++;
            itemRows.push({
                item_id: uuidv4(), submission_id: submissionId,
                item_index: String(itemIndex), category_key: 'tam_linh_khac',
                category_label: 'Tâm linh khác',
                created_at: now, updated_at: now,
                display_name: n.moTa.slice(0, 80), summary_text: n.moTa,
                subject_name: applicant.tinChu, reference_value: '',
                item_payload_json: JSON.stringify(n), status: 'active',
            });
        }

        if (itemRows.length === 0) {
            return { success: false, error: 'Không có mục đăng ký nào.' };
        }

        const categorySet = new Set(itemRows.map((r) => r.category_label));

        const ceremonyLabel = ceremony?.label || ceremonyType;

        // 1. Write to Tổng hợp đăng ký (master summary)
        const stt = await getNextSTT();
        await appendSummaryRow([
            String(stt),
            ceremonyLabel,
            applicant.tinChu,
            "'" + applicant.phone,
            applicant.to || '',
            formattedText,
        ]);

        // 2. Write to formatted result sheets for Cầu Siêu
        const cauSieuData: Record<string, unknown> = {};
        const cauSieuConfigs: Record<string, FormSheetFieldConfig> = {};

        cauSieuData['loai_le'] = ceremonyLabel;
        cauSieuConfigs['loai_le'] = {
            label: 'Loại lễ',
            blockKey: 'thong_tin_le',
            blockLabel: 'Thông tin lễ',
            order: 1,
            fieldType: 'text',
        };

        const hlTrong = (formData.hlTrong49 || []).filter((n) => n.hoTen?.trim());
        cauSieuData['hl_trong_49'] = hlTrong;
        cauSieuConfigs['hl_trong_49'] = {
            label: 'HL mới mất (trong 49 ngày)',
            blockKey: 'hl_trong_49',
            blockLabel: 'HL mới mất (trong 49 ngày)',
            order: 10,
            fieldType: 'group',
        };
        [
            ['hoTen', 'Họ tên người mất'],
            ['ngayMat', 'Ngày mất'],
            ['tho', 'Thọ'],
            ['anTangTai', 'An táng tại'],
        ].forEach(([key, label], index) => {
            cauSieuConfigs[`hl_trong_49.${key}`] = {
                label,
                blockKey: 'hl_trong_49',
                blockLabel: 'HL mới mất (trong 49 ngày)',
                order: 10000 + index,
                fieldType: 'text',
            };
        });

        const hlNgoai = (formData.hlNgoai49 || []).filter((n) => n.hoTen?.trim());
        cauSieuData['hl_ngoai_49'] = hlNgoai;
        cauSieuConfigs['hl_ngoai_49'] = {
            label: 'HL ngoài 49 ngày (rõ tên)',
            blockKey: 'hl_ngoai_49',
            blockLabel: 'HL ngoài 49 ngày (rõ tên)',
            order: 20,
            fieldType: 'group',
        };
        [
            ['hoTen', 'Họ tên người mất'],
            ['ngayMat', 'Ngày mất'],
            ['tho', 'Thọ'],
            ['anTangTai', 'An táng tại'],
        ].forEach(([key, label], index) => {
            cauSieuConfigs[`hl_ngoai_49.${key}`] = {
                label,
                blockKey: 'hl_ngoai_49',
                blockLabel: 'HL ngoài 49 ngày (rõ tên)',
                order: 20000 + index,
                fieldType: 'text',
            };
        });

        const bai8NghiepItems = (formData.bai8_danhSachNghiep || []).filter((n) => n.moTa?.trim());
        const hasBai8Data = formData.bai8_cungDuong === 'co' || formData.bai8_hlGiaTien || formData.bai8_hlTrenDat || bai8NghiepItems.length > 0;
        if (hasBai8Data) {
            cauSieuData['bai_8'] = {
                cung_duong: formData.bai8_cungDuong === 'co',
                hl_gia_tien: formData.bai8_hlGiaTien || false,
                hl_tren_dat: formData.bai8_hlTrenDat || false,
                danh_sach_nghiep: bai8NghiepItems.map((item) => item.moTa).join('\n'),
                ghi_chu: formData.bai8_ghiChu || '',
            };
        }
        cauSieuConfigs['bai_8'] = {
            label: 'Tâm linh bài 8',
            blockKey: 'bai_8',
            blockLabel: 'Tâm linh bài 8',
            order: 30,
            fieldType: 'block',
        };
        [
            ['cung_duong', 'Cúng dường chư Thiên'],
            ['hl_gia_tien', 'HL gia tiên'],
            ['hl_tren_dat', 'HL trên đất'],
            ['danh_sach_nghiep', 'HL trên nghiệp'],
            ['ghi_chu', 'Ghi chú bài 8'],
        ].forEach(([key, label], index) => {
            cauSieuConfigs[`bai_8.${key}`] = {
                label,
                blockKey: 'bai_8',
                blockLabel: 'Tâm linh bài 8',
                order: 30000 + index,
                fieldType: 'text',
            };
        });

        const tlKhac = (formData.tamLinhKhac || []).filter((n) => n.moTa?.trim());
        cauSieuData['tam_linh_khac'] = tlKhac;
        cauSieuConfigs['tam_linh_khac'] = {
            label: 'Tâm linh khác',
            blockKey: 'tam_linh_khac',
            blockLabel: 'Tâm linh khác',
            order: 40,
            fieldType: 'group',
        };
        cauSieuConfigs['tam_linh_khac.moTa'] = {
            label: 'Nội dung',
            blockKey: 'tam_linh_khac',
            blockLabel: 'Tâm linh khác',
            order: 40000,
            fieldType: 'textarea',
        };

        if (applicant.notes?.trim()) {
            cauSieuData['ghi_chu'] = applicant.notes;
        }
        cauSieuConfigs['ghi_chu'] = {
            label: 'Ghi chú',
            blockKey: 'ghi_chu',
            blockLabel: 'Ghi chú',
            order: 50,
            fieldType: 'textarea',
        };

        try {
            await appendToFormSheet('Cầu Siêu', applicant, cauSieuData, cauSieuConfigs, {
                submissionCode,
                registrationType: ceremonyType,
                registrationLabel: ceremonyLabel,
                submittedAtIso: now,
            });
        } catch (e) {
            console.error('appendToFormSheet error (non-fatal):', e);
        }

        // 3. Write structured submission row
        await appendSubmission({
            submission_id: submissionId, submission_code: submissionCode,
            created_at: now, updated_at: now, status: 'submitted',
            ceremony_type: ceremonyType,
            ceremony_label: ceremonyLabel,
            applicant_name: applicant.tinChu, applicant_phone: applicant.phone,
            applicant_dao_trang: applicant.daoTrang || '',
            applicant_to: applicant.to || '',
            total_items: String(itemRows.length),
            categories_text: [...categorySet].join(', '),
            applicant_payload_json: JSON.stringify(applicant),
            source: 'webapp', notes: applicant.notes || '',
        });

        // 4. Write structured item rows
        await appendSubmissionItems(itemRows);

        // 5. Audit log
        await appendAuditLog({
            log_id: uuidv4(), submission_id: submissionId,
            action: 'submit', created_at: now,
            detail: `Đăng ký ${itemRows.length} mục — ${ceremonyLabel}`,
        });

        return { success: true, code: submissionCode };
    } catch (err) {
        console.error('Submit error:', err);
        return { success: false, error: 'Đã có lỗi khi gửi đăng ký. Vui lòng thử lại sau.' };
    }
}
