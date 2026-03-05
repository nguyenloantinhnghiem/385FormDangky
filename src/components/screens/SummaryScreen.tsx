'use client';

import { useState } from 'react';
import { CEREMONY_MAP } from '@/config/categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Edit2, Send, User, Loader2, Check } from 'lucide-react';
import type { Applicant, CeremonyType } from '@/types';
import type { AllInOneFormData } from './RegistrationFormScreen';

interface NguoiMat { hoTen: string; ngayMat?: string; tho?: string; anTangTai?: string; }
interface NghiepItem { moTa: string; }

interface SummaryScreenProps {
    ceremonyType: CeremonyType;
    applicant: Applicant;
    formData: AllInOneFormData;
    isSubmitting: boolean;
    submitError: string | null;
    onEditApplicant: () => void;
    onEditForm: () => void;
    onSubmit: () => void;
    onBack: () => void;
}

export default function SummaryScreen({
    ceremonyType, applicant, formData, isSubmitting, submitError,
    onEditApplicant, onEditForm, onSubmit, onBack,
}: SummaryScreenProps) {
    const [confirmed, setConfirmed] = useState(false);
    const ceremony = CEREMONY_MAP.get(ceremonyType);

    const hlTrong49 = formData.hlTrong49 || [];
    const hlNgoai49 = formData.hlNgoai49 || [];
    const bai8Nghiep = formData.bai8_danhSachNghiep || [];
    const tamLinhKhac = formData.tamLinhKhac || [];
    const hasBai8 = formData.bai8_cungDuong === 'co' || formData.bai8_hlGiaTien || formData.bai8_hlTrenDat || bai8Nghiep.length > 0;

    const totalItems = hlTrong49.length + hlNgoai49.length + (hasBai8 ? 1 : 0) + tamLinhKhac.length;

    return (
        <div className="animate-slide-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">📝</div>
                <div>
                    <h2 className="text-xl font-bold text-stone-800">Xem lại đăng ký</h2>
                    <p className="text-sm text-stone-500">Kiểm tra lại toàn bộ trước khi gửi</p>
                </div>
            </div>

            {/* Ceremony */}
            <Card className="mb-3">
                <CardContent className="p-3 flex items-center gap-2">
                    <span className="text-lg">{ceremony?.icon}</span>
                    <span className="font-medium text-stone-800 text-sm">{ceremony?.label}</span>
                </CardContent>
            </Card>

            {/* Applicant */}
            <Card className="mb-3">
                <CardHeader className="pb-1 pt-3 px-3 flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-stone-500" />
                        <CardTitle className="text-xs text-stone-500">Thông tin chung</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onEditApplicant} className="text-amber-600 h-6 text-xs">
                        <Edit2 className="w-3 h-3 mr-1" /> Sửa
                    </Button>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-1">
                    <p className="text-sm font-medium">{applicant.tinChu} • {applicant.phone}</p>
                    {applicant.daoTrang && <p className="text-xs text-stone-500">{applicant.daoTrang}</p>}
                </CardContent>
            </Card>

            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone-800 text-sm">Chi tiết đăng ký</h3>
                <Button variant="ghost" size="sm" onClick={onEditForm} className="text-amber-600 h-6 text-xs">
                    <Edit2 className="w-3 h-3 mr-1" /> Sửa
                </Button>
            </div>

            {/* HL trong 49 */}
            {hlTrong49.length > 0 && (
                <Card className="mb-3">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span>🕯️</span>
                            <span className="text-xs font-semibold text-stone-600">HL mới mất — trong 49 ngày ({hlTrong49.length})</span>
                        </div>
                        <div className="space-y-1.5">
                            {hlTrong49.map((nm: NguoiMat, i: number) => (
                                <div key={i} className="text-sm bg-stone-50 rounded px-2 py-1.5">
                                    <span className="font-medium">{nm.hoTen}</span>
                                    {nm.ngayMat && <span className="text-stone-500"> — Mất: {nm.ngayMat}</span>}
                                    {nm.tho && <span className="text-stone-500">, Thọ: {nm.tho}</span>}
                                    {nm.anTangTai && <p className="text-xs text-stone-400">An táng: {nm.anTangTai}</p>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* HL ngoài 49 */}
            {hlNgoai49.length > 0 && (
                <Card className="mb-3">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span>🪔</span>
                            <span className="text-xs font-semibold text-stone-600">HL ngoài 49 ngày — rõ tên ({hlNgoai49.length})</span>
                        </div>
                        <div className="space-y-1.5">
                            {hlNgoai49.map((nm: NguoiMat, i: number) => (
                                <div key={i} className="text-sm bg-stone-50 rounded px-2 py-1.5">
                                    <span className="font-medium">{nm.hoTen}</span>
                                    {nm.ngayMat && <span className="text-stone-500"> — Mất: {nm.ngayMat}</span>}
                                    {nm.tho && <span className="text-stone-500">, Thọ: {nm.tho}</span>}
                                    {nm.anTangTai && <p className="text-xs text-stone-400">An táng: {nm.anTangTai}</p>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bài 8 */}
            {hasBai8 && (
                <Card className="mb-3">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span>📜</span>
                            <span className="text-xs font-semibold text-stone-600">Tâm linh bài số 8</span>
                        </div>
                        <div className="space-y-1 text-sm">
                            {formData.bai8_cungDuong === 'co' && (
                                <p className="text-emerald-600 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Cúng dường chư Thiên, chư Thần Linh
                                </p>
                            )}
                            {formData.bai8_hlGiaTien && (
                                <p className="text-emerald-600 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> HL gia tiên hợp duyên đã bạch thỉnh
                                </p>
                            )}
                            {formData.bai8_hlTrenDat && (
                                <p className="text-emerald-600 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> HL trên đất hợp duyên đã bạch thỉnh
                                </p>
                            )}
                            {bai8Nghiep.map((n: NghiepItem, i: number) => (
                                <p key={i} className="text-stone-600 bg-stone-50 rounded px-2 py-1">• {n.moTa}</p>
                            ))}
                            {formData.bai8_ghiChu && (
                                <p className="text-xs text-stone-400 italic">Ghi chú: {formData.bai8_ghiChu}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tâm linh khác */}
            {tamLinhKhac.length > 0 && (
                <Card className="mb-3">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span>🔮</span>
                            <span className="text-xs font-semibold text-stone-600">Tâm linh khác ({tamLinhKhac.length})</span>
                        </div>
                        <div className="space-y-1">
                            {tamLinhKhac.map((n: NghiepItem, i: number) => (
                                <p key={i} className="text-sm text-stone-600 bg-stone-50 rounded px-2 py-1.5">• {n.moTa}</p>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Separator className="my-4" />

            {/* Confirm */}
            <Card className="mb-4">
                <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                        <Checkbox id="confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(v as boolean)} />
                        <Label htmlFor="confirm" className="text-sm text-stone-600 leading-snug cursor-pointer">
                            Tôi đã kiểm tra lại toàn bộ thông tin và xác nhận gửi đăng ký.
                        </Label>
                    </div>
                </CardContent>
            </Card>

            {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600">{submitError}</p>
                </div>
            )}

            <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">Quay lại</Button>
                <Button onClick={onSubmit} disabled={!confirmed || isSubmitting} className="flex-1 gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
                </Button>
            </div>
        </div>
    );
}
