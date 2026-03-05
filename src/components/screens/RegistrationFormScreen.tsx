'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface NguoiMat { hoTen: string; ngayMat: string; tho: string; anTangTai: string; }
interface NghiepItem { moTa: string; }

export interface AllInOneFormData {
    hlTrong49: NguoiMat[];
    hlNgoai49: NguoiMat[];
    bai8_cungDuong: string;
    bai8_hlGiaTien: boolean;
    bai8_hlTrenDat: boolean;
    bai8_danhSachNghiep: NghiepItem[];
    bai8_ghiChu: string;
    tamLinhKhac: NghiepItem[];
}

interface RegistrationFormScreenProps {
    defaultValues?: AllInOneFormData;
    onNext: (data: AllInOneFormData) => void;
    onBack: () => void;
}

const EMPTY_NGUOI_MAT: NguoiMat = { hoTen: '', ngayMat: '', tho: '', anTangTai: '' };
const EMPTY_NGHIEP: NghiepItem = { moTa: '' };

const DEFAULT_VALUES: AllInOneFormData = {
    hlTrong49: [],
    hlNgoai49: [],
    bai8_cungDuong: 'khong',
    bai8_hlGiaTien: false,
    bai8_hlTrenDat: false,
    bai8_danhSachNghiep: [],
    bai8_ghiChu: '',
    tamLinhKhac: [],
};

// ============================================================
// Collapsible Section
// ============================================================
function Section({ icon, title, subtitle, count, children }: {
    icon: string; title: string; subtitle: string; count: number;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(count > 0);

    return (
        <Card className={`transition-all ${count > 0 ? 'ring-1 ring-amber-300 bg-amber-50/30' : ''}`}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full p-4 flex items-center gap-3 text-left"
            >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-stone-800 text-sm">{title}</h3>
                        {count > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {count}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-stone-500">{subtitle}</p>
                </div>
                {open ? (
                    <ChevronUp className="w-5 h-5 text-stone-400 flex-shrink-0" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400 flex-shrink-0" />
                )}
            </button>
            {open && (
                <CardContent className="pt-0 pb-4 px-4 animate-fade-in">
                    <Separator className="mb-4" />
                    {children}
                </CardContent>
            )}
        </Card>
    );
}

// ============================================================
// Repeatable person card (HL trong/ngoài 49)
// ============================================================
function PersonCards({ fieldArrayName, control, register }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fieldArrayName: string; control: any; register: any;
}) {
    const { fields, append, remove } = useFieldArray({ control, name: fieldArrayName });

    return (
        <div className="space-y-3">
            {fields.map((field, index) => (
                <Card key={field.id} className="bg-white border-stone-200">
                    <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-500">Hương linh {index + 1}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}
                                className="text-red-400 h-6 text-xs px-2">
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                        <Input placeholder="Họ tên người mất *" {...register(`${fieldArrayName}.${index}.hoTen`)} />
                        <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Mất ngày (âm lịch)" {...register(`${fieldArrayName}.${index}.ngayMat`)} className="text-sm" />
                            <Input placeholder="Thọ (tuổi)" {...register(`${fieldArrayName}.${index}.tho`)} className="text-sm" />
                        </div>
                        <Input placeholder="An táng tại" {...register(`${fieldArrayName}.${index}.anTangTai`)} className="text-sm" />
                    </CardContent>
                </Card>
            ))}

            <Button type="button" variant="outline" onClick={() => append({ ...EMPTY_NGUOI_MAT })}
                className="w-full gap-2 border-dashed text-xs h-9">
                <Plus className="w-3.5 h-3.5" /> Thêm hương linh
            </Button>
        </div>
    );
}

// ============================================================
// Repeatable text items
// ============================================================
function TextItemCards({ fieldArrayName, control, register, placeholder, addLabel }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fieldArrayName: string; control: any; register: any; placeholder: string; addLabel: string;
}) {
    const { fields, append, remove } = useFieldArray({ control, name: fieldArrayName });

    return (
        <div className="space-y-3">
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                    <span className="text-xs text-stone-400 mt-2.5 flex-shrink-0">{index + 1}.</span>
                    <Textarea placeholder={placeholder} rows={2} {...register(`${fieldArrayName}.${index}.moTa`)}
                        className="text-sm flex-1" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}
                        className="text-red-400 h-8 w-8 p-0 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            ))}

            <Button type="button" variant="outline" onClick={() => append({ ...EMPTY_NGHIEP })}
                className="w-full gap-2 border-dashed text-xs h-9">
                <Plus className="w-3.5 h-3.5" /> {addLabel}
            </Button>
        </div>
    );
}

// ============================================================
// Main form
// ============================================================
export default function RegistrationFormScreen({ defaultValues, onNext, onBack }: RegistrationFormScreenProps) {
    const { register, handleSubmit, control, watch } = useForm<AllInOneFormData>({
        defaultValues: defaultValues || DEFAULT_VALUES,
    });

    const hlTrong49 = watch('hlTrong49');
    const hlNgoai49 = watch('hlNgoai49');
    const bai8Nghiep = watch('bai8_danhSachNghiep');
    const bai8GiaTien = watch('bai8_hlGiaTien');
    const bai8TrenDat = watch('bai8_hlTrenDat');
    const bai8CungDuong = watch('bai8_cungDuong');
    const tamLinhKhac = watch('tamLinhKhac');

    const bai8Count = (bai8Nghiep?.length || 0) + (bai8GiaTien ? 1 : 0) + (bai8TrenDat ? 1 : 0) + (bai8CungDuong === 'co' ? 1 : 0);

    const totalItems = (hlTrong49?.length || 0) + (hlNgoai49?.length || 0) + bai8Count + (tamLinhKhac?.length || 0);

    const onSubmit = (data: AllInOneFormData) => {
        // Filter out empty entries
        const cleaned: AllInOneFormData = {
            ...data,
            hlTrong49: (data.hlTrong49 || []).filter((n) => n.hoTen.trim()),
            hlNgoai49: (data.hlNgoai49 || []).filter((n) => n.hoTen.trim()),
            bai8_danhSachNghiep: (data.bai8_danhSachNghiep || []).filter((n) => n.moTa.trim()),
            tamLinhKhac: (data.tamLinhKhac || []).filter((n) => n.moTa.trim()),
        };

        const hasAnything = cleaned.hlTrong49.length > 0
            || cleaned.hlNgoai49.length > 0
            || cleaned.bai8_cungDuong === 'co'
            || cleaned.bai8_hlGiaTien
            || cleaned.bai8_hlTrenDat
            || cleaned.bai8_danhSachNghiep.length > 0
            || cleaned.tamLinhKhac.length > 0;

        if (!hasAnything) {
            alert('Vui lòng thêm ít nhất 1 mục đăng ký.');
            return;
        }

        onNext(cleaned);
    };

    return (
        <div className="animate-slide-in">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">
                    📋
                </div>
                <div>
                    <h2 className="text-xl font-bold text-stone-800">Đăng ký mục cầu siêu</h2>
                    <p className="text-sm text-stone-500">Bước 3 — Bấm vào mục cần đăng ký, bỏ qua mục không cần</p>
                </div>
            </div>

            <p className="text-xs text-stone-400 mb-4 px-1">
                💡 Mỗi mục có nút <strong>"+ Thêm"</strong> để thêm nhiều hương linh hoặc nhiều nội dung.
                Chỉ điền những mục bạn cần.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {/* Section A: HL trong 49 ngày */}
                <Section
                    icon="🕯️"
                    title="HL mới mất (trong 49 ngày)"
                    subtitle="Bấm vào đây nếu có hương linh mới mất"
                    count={hlTrong49?.filter((n: NguoiMat) => n.hoTen?.trim()).length || 0}
                >
                    <PersonCards fieldArrayName="hlTrong49" control={control} register={register} />
                </Section>

                {/* Section B: HL ngoài 49 ngày */}
                <Section
                    icon="🪔"
                    title="HL ngoài 49 ngày (rõ tên)"
                    subtitle="Bấm vào đây nếu có hương linh ngoài 49 ngày"
                    count={hlNgoai49?.filter((n: NguoiMat) => n.hoTen?.trim()).length || 0}
                >
                    <PersonCards fieldArrayName="hlNgoai49" control={control} register={register} />
                </Section>

                {/* Section C: Tâm linh bài 8 */}
                <Section
                    icon="📜"
                    title="Tâm linh bài số 8"
                    subtitle="Bao gồm cúng dường chư Thiên, HL gia tiên, HL trên nghiệp..."
                    count={bai8Count}
                >
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
                        <p className="text-[11px] text-amber-700">
                            ⚠️ Lưu ý: Không ghi các mục HL có oán kết chung, riêng
                        </p>
                    </div>

                    {/* Cúng dường */}
                    <div className="mb-4">
                        <Label className="text-sm">Cúng dường hồi hướng cho chư Thiên, chư Thần Linh, chư linh thần hộ trì</Label>
                        <p className="text-[11px] text-stone-400 mb-2">
                            Với PT đang/đã bạch bài phát nguyện 49 ngày: chư Thiên, chư Thần Linh, chư linh thần hộ trì.
                        </p>
                        <Controller
                            name="bai8_cungDuong"
                            control={control}
                            render={({ field }) => (
                                <div className="flex gap-2">
                                    {[{ v: 'co', l: 'Có' }, { v: 'khong', l: 'Không' }].map((o) => (
                                        <button key={o.v} type="button" onClick={() => field.onChange(o.v)}
                                            className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${field.value === o.v
                                                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                                                    : 'border-stone-200 text-stone-400'
                                                }`}>
                                            {o.l}
                                        </button>
                                    ))}
                                </div>
                            )}
                        />
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-3">
                            <Controller name="bai8_hlGiaTien" control={control}
                                render={({ field }) => (
                                    <Checkbox id="bai8_hlGiaTien" checked={field.value} onCheckedChange={field.onChange} />
                                )} />
                            <Label htmlFor="bai8_hlGiaTien" className="text-sm cursor-pointer">
                                HL gia tiên hợp duyên đã bạch thỉnh
                            </Label>
                        </div>
                        <div className="flex items-start gap-3">
                            <Controller name="bai8_hlTrenDat" control={control}
                                render={({ field }) => (
                                    <Checkbox id="bai8_hlTrenDat" checked={field.value} onCheckedChange={field.onChange} />
                                )} />
                            <Label htmlFor="bai8_hlTrenDat" className="text-sm cursor-pointer">
                                HL trên đất hợp duyên đã bạch thỉnh
                            </Label>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* HL trên nghiệp — repeatable */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">HL trên nghiệp / HL cản trở chữa bệnh</Label>
                        <p className="text-[11px] text-stone-400 mb-3">
                            Mỗi mục ghi: HL trên nghiệp gì, của ai. Bấm thêm nếu có nhiều mục.
                        </p>
                        <TextItemCards
                            fieldArrayName="bai8_danhSachNghiep"
                            control={control}
                            register={register}
                            placeholder="VD: HL trên nghiệp bệnh... của [tên người]"
                            addLabel="Thêm HL trên nghiệp"
                        />
                    </div>

                    <Separator className="my-4" />

                    <div>
                        <Label className="text-sm">Ghi chú thêm</Label>
                        <Textarea placeholder="Ghi chú bài 8 nếu có..." rows={2} {...register('bai8_ghiChu')} className="mt-1" />
                    </div>
                </Section>

                {/* Section D: Tâm linh khác */}
                <Section
                    icon="🔮"
                    title="Tâm linh khác (không tu bài 8)"
                    subtitle="HL thai nhi, HL trên nghiệp khác..."
                    count={tamLinhKhac?.filter((n: NghiepItem) => n.moTa?.trim()).length || 0}
                >
                    <TextItemCards
                        fieldArrayName="tamLinhKhac"
                        control={control}
                        register={register}
                        placeholder="VD: HL trên nghiệp thất thoát tài sản của... qua hiện tượng..."
                        addLabel="Thêm mục tâm linh khác"
                    />
                </Section>

                {/* Summary bar */}
                {totalItems > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                        <p className="text-sm text-emerald-700 font-medium">
                            Đã điền <strong>{totalItems}</strong> mục đăng ký
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
                    </Button>
                    <Button type="submit" className="flex-1 gap-2">
                        Xem lại <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
