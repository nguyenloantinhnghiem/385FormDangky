'use client';

import { useEffect, useState } from 'react';
import { getFormFields, type FormSection, type FormFieldDef } from '@/actions/form-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Loader2, FileText } from 'lucide-react';

interface DynamicFormScreenProps {
    formType: string;
    formLabel: string;
    defaultValues?: Record<string, unknown>;
    onNext: (data: Record<string, unknown>, fieldLabels: Record<string, string>) => void;
    onBack: () => void;
}

export default function DynamicFormScreen({ formType, formLabel, defaultValues, onNext, onBack }: DynamicFormScreenProps) {
    const [sections, setSections] = useState<FormSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Record<string, unknown>>(defaultValues || {});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        getFormFields(formType).then((s) => {
            setSections(s);
            // Init default values
            const defaults: Record<string, unknown> = { ...(defaultValues || {}) };
            for (const sec of s) {
                for (const f of sec.fields) {
                    if (defaults[f.fieldKey] === undefined) {
                        if (f.fieldType === 'checkbox') defaults[f.fieldKey] = false;
                        else if (f.fieldType === 'multichoice') defaults[f.fieldKey] = [];
                        else defaults[f.fieldKey] = '';
                    }
                }
            }
            setFormData(defaults);
        }).finally(() => setLoading(false));
    }, [formType, defaultValues]);

    const handleChange = (key: string, value: unknown) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        for (const sec of sections) {
            for (const f of sec.fields) {
                if (f.required) {
                    const val = formData[f.fieldKey];
                    if (f.fieldType === 'multichoice') {
                        if (!Array.isArray(val) || val.length === 0) {
                            newErrors[f.fieldKey] = `Vui lòng chọn ít nhất 1 mục cho ${f.fieldLabel}`;
                        }
                    } else if (val === undefined || val === null || val === '') {
                        newErrors[f.fieldKey] = `Vui lòng nhập/chọn ${f.fieldLabel}`;
                    }
                }
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            // Build fieldKey → fieldLabel mapping
            const labels: Record<string, string> = {};
            for (const sec of sections) {
                for (const f of sec.fields) {
                    labels[f.fieldKey] = f.fieldLabel;
                }
            }
            onNext(formData, labels);
        }
    };

    const renderField = (field: FormFieldDef) => {
        const value = formData[field.fieldKey];

        switch (field.fieldType) {
            case 'text':
            case 'number':
                return (
                    <Input
                        id={field.fieldKey}
                        type={field.fieldType === 'number' ? 'number' : 'text'}
                        placeholder={field.placeholder}
                        value={(value as string) || ''}
                        onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        id={field.fieldKey}
                        placeholder={field.placeholder}
                        rows={3}
                        value={(value as string) || ''}
                        onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    />
                );
            case 'select':
                return (
                    <select
                        id={field.fieldKey}
                        value={(value as string) || ''}
                        onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="">-- Chọn --</option>
                        {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'checkbox':
                return (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleChange(field.fieldKey, e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300"
                        />
                        <span className="text-sm text-stone-700">{field.fieldLabel}</span>
                    </label>
                );
            case 'multichoice': {
                const selectedList = (Array.isArray(value) ? value : []) as string[];
                return (
                    <div className="flex flex-col gap-2 mt-1">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedList.includes(opt)}
                                    onChange={(e) => {
                                        let newList = [...selectedList];
                                        if (e.target.checked) newList.push(opt);
                                        else newList = newList.filter((i) => i !== opt);
                                        handleChange(field.fieldKey, newList);
                                    }}
                                    className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-stone-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            }
            default:
                return <Input value={(value as string) || ''} onChange={(e) => handleChange(field.fieldKey, e.target.value)} />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="ml-2 text-sm text-stone-400">Đang tải form...</span>
            </div>
        );
    }

    if (sections.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-stone-500">Chưa có trường nào cho form này.</p>
                <p className="text-xs text-stone-400 mt-1">Admin vui lòng thêm fields vào tab &quot;form_fields&quot; trong Google Sheet</p>
                <Button variant="outline" onClick={onBack} className="mt-4">Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="animate-slide-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-stone-800">{formLabel}</h2>
                    <p className="text-sm text-stone-500">Điền thông tin đăng ký</p>
                </div>
            </div>

            <div className="space-y-4">
                {sections.map((section) => (
                    <Card key={section.name}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{section.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {section.fields.map((field) => (
                                <div key={field.fieldKey} className="space-y-1.5">
                                    {field.fieldType !== 'checkbox' && (
                                        <Label htmlFor={field.fieldKey}>
                                            {field.fieldLabel}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </Label>
                                    )}
                                    {renderField(field)}
                                    {field.helperText && (
                                        <p className="text-xs text-stone-400">{field.helperText}</p>
                                    )}
                                    {errors[field.fieldKey] && (
                                        <p className="text-xs text-red-500">{errors[field.fieldKey]}</p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex gap-3 pt-6">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>
                <Button onClick={handleSubmit} className="flex-1 gap-2">
                    Tiếp tục <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
