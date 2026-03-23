'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicantSchema, type ApplicantFormData } from '@/schemas/applicant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, User, UserCheck } from 'lucide-react';
import { loadProfile } from '@/lib/utils/draft';
import type { Applicant } from '@/types';

interface ApplicantScreenProps {
    defaultValues: Applicant | null;
    onNext: (data: Applicant) => void;
    onBack: () => void;
}

export default function ApplicantScreen({ defaultValues, onNext, onBack }: ApplicantScreenProps) {
    // Merge: defaultValues (from draft/lookup) > profile (saved) > empty
    const mergedDefaults = useMemo(() => {
        const profile = loadProfile();
        return {
            tinChu: defaultValues?.tinChu || profile?.tinChu || '',
            phone: defaultValues?.phone || profile?.phone || '',
            daoTrang: defaultValues?.daoTrang || '',
            to: defaultValues?.to || profile?.to || '',
            notes: defaultValues?.notes || '',
        };
    }, [defaultValues]);

    const hasProfileData = useMemo(() => {
        const profile = loadProfile();
        return !!(profile?.tinChu || profile?.phone);
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = useForm<ApplicantFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(applicantSchema) as any,
        defaultValues: mergedDefaults,
        mode: 'onChange',
    });

    const onSubmit = (data: ApplicantFormData) => {
        onNext(data as Applicant);
    };

    return (
        <div className="animate-slide-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-stone-800">Thông tin người đăng ký</h2>
                    <p className="text-sm text-stone-500">Nhập thông tin Tín chủ / Phật tử</p>
                </div>
            </div>

            {/* Profile auto-fill notice */}
            {hasProfileData && !defaultValues && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs animate-fade-in">
                    <UserCheck className="w-4 h-4 flex-shrink-0" />
                    <span>Đã tự động điền từ thông tin đã lưu trước đó</span>
                </div>
            )}

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tinChu">
                                Tín chủ / Phật tử / Pháp danh <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="tinChu"
                                placeholder="Nếu có Pháp danh thì ghi Pháp danh"
                                {...register('tinChu')}
                            />
                            {errors.tinChu && (
                                <p className="text-sm text-red-500">{errors.tinChu.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                Số điện thoại <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="VD: 0912345678"
                                {...register('phone')}
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500">{errors.phone.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="to">Thuộc tổ nào?</Label>
                            <select
                                id="to"
                                {...register('to')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">-- Chọn tổ --</option>
                                {Array.from({ length: 15 }, (_, i) => (
                                    <option key={i + 1} value={`Tổ ${i + 1}`}>Tổ {i + 1}</option>
                                ))}
                            </select>
                        </div>


                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                                Quay lại
                            </Button>
                            <Button type="submit" disabled={!isValid} className="flex-1 gap-2">
                                Tiếp tục <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

