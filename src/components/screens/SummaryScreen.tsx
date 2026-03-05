'use client';

import { useState } from 'react';
import { CATEGORY_MAP, CEREMONY_MAP } from '@/config/categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Edit2, Copy, Trash2, Plus, Send, User, Loader2, Check } from 'lucide-react';
import type { Applicant, SubmissionItem, CeremonyType } from '@/types';

interface SummaryScreenProps {
    ceremonyType: CeremonyType;
    applicant: Applicant;
    items: SubmissionItem[];
    isSubmitting: boolean;
    submitError: string | null;
    onEditApplicant: () => void;
    onEditItem: (itemId: string) => void;
    onDeleteItem: (itemId: string) => void;
    onCloneItem: (itemId: string) => void;
    onAddMore: () => void;
    onSubmit: () => void;
    onBack: () => void;
}

interface NguoiMat { hoTen: string; ngayMat?: string; tho?: string; anTangTai?: string; }
interface NghiepItem { moTa: string; }

function getItemDisplayParts(item: SubmissionItem): string[] {
    const d = item.data as Record<string, unknown>;
    const parts: string[] = [];

    // HL forms — list all deceased
    const nguoiMat = d.nguoiMat as NguoiMat[] | undefined;
    if (nguoiMat && nguoiMat.length > 0) {
        nguoiMat.forEach((nm) => {
            let s = nm.hoTen;
            if (nm.ngayMat) s += ` — Mất: ${nm.ngayMat}`;
            if (nm.tho) s += `, Thọ: ${nm.tho}`;
            if (nm.anTangTai) s += `, An táng: ${nm.anTangTai}`;
            parts.push(s);
        });
        return parts;
    }

    // Tâm linh bài 8
    if (d.cungDuongChuThien !== undefined) {
        if (d.cungDuongChuThien === 'co') parts.push('✓ Cúng dường chư Thiên');
        if (d.hlGiaTien) parts.push('✓ HL gia tiên');
        if (d.hlTrenDat) parts.push('✓ HL trên đất');
        const nghiep = d.danhSachNghiep as NghiepItem[] | undefined;
        if (nghiep) nghiep.forEach((n) => parts.push(`• ${n.moTa}`));
        if (d.ghiChu) parts.push(`Ghi chú: ${d.ghiChu}`);
        return parts;
    }

    // Tâm linh khác
    const danhSach = d.danhSach as NghiepItem[] | undefined;
    if (danhSach) {
        danhSach.forEach((n) => parts.push(`• ${n.moTa}`));
        return parts;
    }

    return ['—'];
}

function getItemTitle(item: SubmissionItem): string {
    const d = item.data as Record<string, unknown>;
    const nguoiMat = d.nguoiMat as NguoiMat[] | undefined;
    if (nguoiMat && nguoiMat.length > 0) {
        if (nguoiMat.length === 1) return nguoiMat[0].hoTen;
        return `${nguoiMat[0].hoTen} (+${nguoiMat.length - 1} hương linh)`;
    }
    const danhSach = d.danhSach as NghiepItem[] | undefined;
    if (danhSach && danhSach.length > 0) {
        const first = danhSach[0].moTa.slice(0, 50);
        return danhSach.length === 1 ? first : `${first}... (+${danhSach.length - 1})`;
    }
    if (d.cungDuongChuThien !== undefined) {
        const nghiep = d.danhSachNghiep as NghiepItem[] | undefined;
        const count = (nghiep?.length || 0) + (d.hlGiaTien ? 1 : 0) + (d.hlTrenDat ? 1 : 0) + (d.cungDuongChuThien === 'co' ? 1 : 0);
        return `${count} mục tâm linh bài 8`;
    }
    return item.categoryLabel;
}

function getSubItemCount(item: SubmissionItem): number {
    const d = item.data as Record<string, unknown>;
    const nguoiMat = d.nguoiMat as NguoiMat[] | undefined;
    if (nguoiMat) return nguoiMat.length;
    const danhSach = d.danhSach as NghiepItem[] | undefined;
    if (danhSach) return danhSach.length;
    const nghiep = d.danhSachNghiep as NghiepItem[] | undefined;
    let count = nghiep?.length || 0;
    if (d.hlGiaTien) count++;
    if (d.hlTrenDat) count++;
    if (d.cungDuongChuThien === 'co') count++;
    return count;
}

export default function SummaryScreen({
    ceremonyType, applicant, items, isSubmitting, submitError,
    onEditApplicant, onEditItem, onDeleteItem, onCloneItem, onAddMore, onSubmit, onBack,
}: SummaryScreenProps) {
    const [confirmed, setConfirmed] = useState(false);
    const ceremony = CEREMONY_MAP.get(ceremonyType);

    const totalSubItems = items.reduce((sum, item) => sum + getSubItemCount(item), 0);

    return (
        <div className="animate-slide-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">
                    📝
                </div>
                <div>
                    <h2 className="text-xl font-bold text-stone-800">Xem lại đăng ký</h2>
                    <p className="text-sm text-stone-500">
                        {items.length} mục • {totalSubItems} chi tiết
                    </p>
                </div>
            </div>

            {/* Ceremony type */}
            <Card className="mb-4">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{ceremony?.icon}</span>
                        <span className="font-medium text-stone-800">{ceremony?.label}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Applicant info */}
            <Card className="mb-4">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-stone-500" />
                        <CardTitle className="text-sm">Thông tin chung</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onEditApplicant} className="text-amber-600 h-7 text-xs">
                        <Edit2 className="w-3 h-3 mr-1" /> Sửa
                    </Button>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-y-1 text-sm">
                        <span className="text-stone-500">Tín chủ:</span>
                        <span className="font-medium">{applicant.tinChu}</span>
                        <span className="text-stone-500">SĐT:</span>
                        <span>{applicant.phone}</span>
                        {applicant.daoTrang && (
                            <>
                                <span className="text-stone-500">Đạo tràng:</span>
                                <span>{applicant.daoTrang}</span>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Separator className="mb-4" />

            {/* Items list */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-stone-800">
                    Danh sách mục ({items.length})
                </h3>
                <Button variant="outline" size="sm" onClick={onAddMore} className="h-7 text-xs gap-1">
                    <Plus className="w-3 h-3" /> Thêm
                </Button>
            </div>

            <div className="space-y-3 mb-6">
                {items.map((item, idx) => {
                    const cat = CATEGORY_MAP.get(item.categoryKey);
                    const parts = getItemDisplayParts(item);
                    return (
                        <Card key={item.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3 mb-2">
                                    <span className="text-lg">{cat?.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="default" className="text-[10px]">
                                                Mục {idx + 1}
                                            </Badge>
                                            <span className="text-xs text-stone-400">{cat?.shortLabel}</span>
                                        </div>
                                        <p className="font-medium text-stone-800 text-sm">
                                            {getItemTitle(item)}
                                        </p>
                                        <div className="mt-1 space-y-0.5">
                                            {parts.map((p, i) => (
                                                <p key={i} className="text-xs text-stone-500 leading-snug">
                                                    {p.startsWith('✓') ? (
                                                        <span className="text-emerald-600">{p}</span>
                                                    ) : p}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-stone-100">
                                    <Button variant="ghost" size="sm" onClick={() => onEditItem(item.id)} className="text-amber-600 h-7 text-xs">
                                        <Edit2 className="w-3 h-3 mr-1" /> Sửa
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onCloneItem(item.id)} className="text-blue-600 h-7 text-xs">
                                        <Copy className="w-3 h-3 mr-1" /> Nhân bản
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onDeleteItem(item.id)} className="text-red-500 h-7 text-xs">
                                        <Trash2 className="w-3 h-3 mr-1" /> Xoá
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Confirm */}
            <Card className="mb-4">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="confirm"
                            checked={confirmed}
                            onCheckedChange={(v) => setConfirmed(v as boolean)}
                        />
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
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                    Quay lại
                </Button>
                <Button
                    onClick={onSubmit}
                    disabled={!confirmed || isSubmitting || items.length === 0}
                    className="flex-1 gap-2"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
                </Button>
            </div>
        </div>
    );
}
