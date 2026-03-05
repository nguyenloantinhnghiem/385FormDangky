'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CATEGORY_MAP } from '@/config/categories';
import { categorySchemas } from '@/schemas/submission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import type { CategoryKey, SubmissionItem } from '@/types';

interface CategoryFormScreenProps {
    categoryKey: CategoryKey;
    editingItem: SubmissionItem | null;
    onSave: (data: Record<string, unknown>) => void;
    onBack: () => void;
}

// ============================================================
// HL trong 49 / ngoài 49 — Multiple deceased persons
// ============================================================
function HuongLinhForm({ control, register, errors }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: any; register: any; errors: any;
}) {
    const { fields, append, remove } = useFieldArray({ control, name: 'nguoiMat' });

    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                <Card key={field.id} className="bg-stone-50/50">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-stone-600">
                                Hương linh {index + 1}
                            </span>
                            {fields.length > 1 && (
                                <Button
                                    type="button" variant="ghost" size="sm"
                                    onClick={() => remove(index)}
                                    className="text-red-500 h-7 text-xs"
                                >
                                    <Trash2 className="w-3 h-3 mr-1" /> Xoá
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Họ tên người mất <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="Nhập họ tên đầy đủ"
                                {...register(`nguoiMat.${index}.hoTen`)}
                            />
                            {errors?.nguoiMat?.[index]?.hoTen && (
                                <p className="text-sm text-red-500">{errors.nguoiMat[index].hoTen.message}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Mất ngày (âm lịch)</Label>
                                <Input
                                    placeholder="VD: 8/8/Canh Tý"
                                    {...register(`nguoiMat.${index}.ngayMat`)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Thọ (tuổi)</Label>
                                <Input
                                    placeholder="VD: 78"
                                    {...register(`nguoiMat.${index}.tho`)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>An táng tại</Label>
                            <Input
                                placeholder="Địa điểm an táng"
                                {...register(`nguoiMat.${index}.anTangTai`)}
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Button
                type="button" variant="outline"
                onClick={() => append({ hoTen: '', ngayMat: '', tho: '', anTangTai: '' })}
                className="w-full gap-2 border-dashed"
            >
                <Plus className="w-4 h-4" /> Thêm hương linh
            </Button>
        </div>
    );
}

// ============================================================
// Tâm linh bài số 8
// ============================================================
function TamLinhBai8Form({ control, register, errors }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: any; register: any; errors: any;
}) {
    const { fields, append, remove } = useFieldArray({ control, name: 'danhSachNghiep' });

    return (
        <div className="space-y-5">
            {/* Cúng dường chư Thiên */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">
                    Cúng dường hồi hướng cho chư Thiên, chư Thần Linh, chư linh thần hộ trì
                </Label>
                <p className="text-xs text-stone-400">
                    Với PT đang/đã bạch bài phát nguyện 49 ngày: Chư Thiên, chư Thần Linh, chư linh thần hộ trì.
                    Với PT chưa bạch: Chư Thiên, chư Thần Linh.
                </p>
                <Controller
                    name="cungDuongChuThien"
                    control={control}
                    render={({ field }) => (
                        <div className="flex gap-3">
                            {[{ value: 'co', label: 'Có' }, { value: 'khong', label: 'Không' }].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => field.onChange(opt.value)}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${field.value === opt.value
                                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                                            : 'border-stone-200 text-stone-500 hover:border-stone-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                />
            </div>

            <Separator />

            {/* Checkboxes */}
            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <Controller
                        name="hlGiaTien"
                        control={control}
                        render={({ field }) => (
                            <Checkbox id="hlGiaTien" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                    />
                    <Label htmlFor="hlGiaTien" className="text-sm cursor-pointer">
                        HL gia tiên hợp duyên đã bạch thỉnh
                    </Label>
                </div>
                <div className="flex items-start gap-3">
                    <Controller
                        name="hlTrenDat"
                        control={control}
                        render={({ field }) => (
                            <Checkbox id="hlTrenDat" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                    />
                    <Label htmlFor="hlTrenDat" className="text-sm cursor-pointer">
                        HL trên đất hợp duyên đã bạch thỉnh
                    </Label>
                </div>
            </div>

            <Separator />

            {/* Repeatable: HL trên nghiệp / HL cản trở chữa bệnh */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">
                    HL trên nghiệp / HL cản trở chữa bệnh
                </Label>
                <p className="text-xs text-stone-400">
                    Mỗi mục ghi chi tiết: HL trên nghiệp gì, của ai. Thêm nhiều mục nếu cần.
                </p>

                {fields.map((field, index) => (
                    <Card key={field.id} className="bg-stone-50/50">
                        <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                                <span className="text-xs text-stone-400 mt-2.5 flex-shrink-0">
                                    {index + 1}.
                                </span>
                                <div className="flex-1">
                                    <Textarea
                                        placeholder="VD: HL trên nghiệp bệnh... của [tên người]"
                                        rows={2}
                                        {...register(`danhSachNghiep.${index}.moTa`)}
                                    />
                                    {errors?.danhSachNghiep?.[index]?.moTa && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.danhSachNghiep[index].moTa.message}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="button" variant="ghost" size="sm"
                                    onClick={() => remove(index)}
                                    className="text-red-400 h-8 w-8 p-0 flex-shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Button
                    type="button" variant="outline"
                    onClick={() => append({ moTa: '' })}
                    className="w-full gap-2 border-dashed text-sm"
                >
                    <Plus className="w-4 h-4" /> Thêm mục HL trên nghiệp
                </Button>
            </div>

            <Separator />

            {/* Ghi chú */}
            <div className="space-y-2">
                <Label>Ghi chú thêm</Label>
                <Textarea placeholder="Ghi chú nếu có..." rows={2} {...register('ghiChu')} />
            </div>
        </div>
    );
}

// ============================================================
// Tâm linh khác
// ============================================================
function TamLinhKhacForm({ control, register, errors }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: any; register: any; errors: any;
}) {
    const { fields, append, remove } = useFieldArray({ control, name: 'danhSach' });

    return (
        <div className="space-y-4">
            <p className="text-xs text-stone-400">
                Ghi chi tiết nội dung từng mục. Thêm nhiều mục nếu cần.
            </p>

            {fields.map((field, index) => (
                <Card key={field.id} className="bg-stone-50/50">
                    <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                            <span className="text-xs text-stone-400 mt-2.5 flex-shrink-0">
                                {index + 1}.
                            </span>
                            <div className="flex-1">
                                <Textarea
                                    placeholder="VD: HL trên nghiệp thất thoát tài sản của... qua hiện tượng..."
                                    rows={3}
                                    {...register(`danhSach.${index}.moTa`)}
                                />
                                {errors?.danhSach?.[index]?.moTa && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.danhSach[index].moTa.message}
                                    </p>
                                )}
                            </div>
                            {fields.length > 1 && (
                                <Button
                                    type="button" variant="ghost" size="sm"
                                    onClick={() => remove(index)}
                                    className="text-red-400 h-8 w-8 p-0 flex-shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Button
                type="button" variant="outline"
                onClick={() => append({ moTa: '' })}
                className="w-full gap-2 border-dashed text-sm"
            >
                <Plus className="w-4 h-4" /> Thêm mục
            </Button>
        </div>
    );
}

// ============================================================
// Main form screen
// ============================================================
export default function CategoryFormScreen({ categoryKey, editingItem, onSave, onBack }: CategoryFormScreenProps) {
    const cat = CATEGORY_MAP.get(categoryKey);
    const schema = categorySchemas[categoryKey];

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = useForm<Record<string, any>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema) as any,
        defaultValues: editingItem ? editingItem.data : cat?.defaultValues || {},
    });

    if (!cat) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSubmit = (data: Record<string, any>) => {
        onSave(data);
    };

    const isHL = categoryKey === 'hl_trong_49_ngay' || categoryKey === 'hl_ngoai_49_ro_ten';
    const isBai8 = categoryKey === 'tam_linh_bai_8';
    const isKhac = categoryKey === 'tam_linh_khac';

    return (
        <div className="animate-slide-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                    {cat.icon}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-stone-800">{cat.label}</h2>
                    <p className="text-sm text-stone-500">
                        {editingItem ? 'Chỉnh sửa mục' : 'Nhập thông tin mục mới'}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
                    {cat.noteText && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                            <p className="text-xs text-amber-700">⚠️ {cat.noteText}</p>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {isHL && <HuongLinhForm control={control} register={register} errors={errors} />}
                        {isBai8 && <TamLinhBai8Form control={control} register={register} errors={errors} />}
                        {isKhac && <TamLinhKhacForm control={control} register={register} errors={errors} />}

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Huỷ
                            </Button>
                            <Button type="submit" className="flex-1 gap-2">
                                <Save className="w-4 h-4" /> Lưu mục này
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
