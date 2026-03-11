'use client';

import { useEffect, useState } from 'react';
import { getFormFields, type FormSection, type FormFieldDef } from '@/actions/form-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Loader2, FileText, Plus, Trash2 } from 'lucide-react';

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
            const defaults: Record<string, unknown> = { ...(defaultValues || {}) };
            for (const sec of s) {
                for (const f of sec.fields) {
                    if (f.groupKey) continue; // sub-fields init handled by group
                    if (defaults[f.fieldKey] === undefined) {
                        if (f.fieldType === 'checkbox') defaults[f.fieldKey] = false;
                        else if (f.fieldType === 'multichoice') defaults[f.fieldKey] = [];
                        else if (f.fieldType === 'group') defaults[f.fieldKey] = [{}]; // start with 1 empty entry
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

    // Check if a field should be visible based on its showWhen condition
    const isFieldVisible = (field: FormFieldDef): boolean => {
        if (!field.showWhen) return true;
        const depValue = formData[field.showWhen.fieldKey];
        if (Array.isArray(depValue)) return depValue.includes(field.showWhen.value);
        return String(depValue || '') === field.showWhen.value;
    };

    // ========== GROUP HELPERS ==========
    const getGroupSubFields = (groupKey: string): FormFieldDef[] => {
        const subFields: FormFieldDef[] = [];
        for (const sec of sections) {
            for (const f of sec.fields) {
                if (f.groupKey === groupKey) subFields.push(f);
            }
        }
        return subFields;
    };

    const getGroupItems = (groupKey: string): Record<string, unknown>[] => {
        const items = formData[groupKey];
        if (Array.isArray(items)) return items as Record<string, unknown>[];
        return [{}];
    };

    const handleGroupItemChange = (groupKey: string, index: number, subKey: string, value: unknown) => {
        const items = [...getGroupItems(groupKey)];
        items[index] = { ...items[index], [subKey]: value };
        handleChange(groupKey, items);
    };

    const addGroupItem = (groupKey: string) => {
        const items = [...getGroupItems(groupKey), {}];
        handleChange(groupKey, items);
    };

    const removeGroupItem = (groupKey: string, index: number) => {
        const items = getGroupItems(groupKey).filter((_, i) => i !== index);
        if (items.length === 0) items.push({});
        handleChange(groupKey, items);
    };

    // ========== VALIDATION ==========
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        for (const sec of sections) {
            for (const f of sec.fields) {
                if (f.groupKey) continue; // sub-fields validated within group
                if (!isFieldVisible(f)) continue;

                if (f.fieldType === 'group') {
                    // Validate group sub-fields
                    const subFields = getGroupSubFields(f.fieldKey);
                    const items = getGroupItems(f.fieldKey);
                    for (let i = 0; i < items.length; i++) {
                        for (const sf of subFields) {
                            if (sf.required) {
                                const val = items[i][sf.subFieldKey!];
                                if (val === undefined || val === null || val === '') {
                                    newErrors[`${f.fieldKey}.${i}.${sf.subFieldKey}`] =
                                        `Vui lòng nhập ${sf.fieldLabel} (mục ${i + 1})`;
                                }
                            }
                        }
                    }
                } else if (f.required) {
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

    // ========== SUBMIT ==========
    const handleSubmit = () => {
        if (validate()) {
            const labels: Record<string, string> = {};
            const visibleData: Record<string, unknown> = {};
            for (const sec of sections) {
                for (const f of sec.fields) {
                    if (f.groupKey) continue; // handled by group
                    if (isFieldVisible(f)) {
                        labels[f.fieldKey] = f.fieldLabel;
                        if (f.fieldType === 'group') {
                            // Also include sub-field labels
                            const subFields = getGroupSubFields(f.fieldKey);
                            for (const sf of subFields) {
                                labels[`${f.fieldKey}.${sf.subFieldKey}`] = sf.fieldLabel;
                            }
                            visibleData[f.fieldKey] = formData[f.fieldKey];
                        } else {
                            visibleData[f.fieldKey] = formData[f.fieldKey];
                        }
                    }
                }
            }
            onNext(visibleData, labels);
        }
    };

    // ========== RENDER SUB-FIELD (for group items) ==========
    const renderSubFieldInput = (field: FormFieldDef, value: unknown, onChange: (val: unknown) => void) => {
        switch (field.fieldType) {
            case 'text':
            case 'number':
                return (
                    <Input
                        type={field.fieldType === 'number' ? 'number' : 'text'}
                        placeholder={field.placeholder}
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        placeholder={field.placeholder}
                        rows={2}
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                );
            case 'select':
                return (
                    <select
                        value={(value as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="">-- Chọn --</option>
                        {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'radio':
                return (
                    <div className="flex flex-col gap-1.5 mt-1">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`${field.fieldKey}_${Math.random()}`}
                                    checked={(value as string) === opt}
                                    onChange={() => onChange(opt)}
                                    className="w-4 h-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-stone-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'multichoice': {
                const selectedList = (Array.isArray(value) ? value : []) as string[];
                return (
                    <div className="flex flex-col gap-1.5 mt-1">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedList.includes(opt)}
                                    onChange={(e) => {
                                        let newList = [...selectedList];
                                        if (e.target.checked) newList.push(opt);
                                        else newList = newList.filter((i) => i !== opt);
                                        onChange(newList);
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
                return <Input value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} />;
        }
    };

    // ========== RENDER GROUP ==========
    const renderGroup = (field: FormFieldDef) => {
        const subFields = getGroupSubFields(field.fieldKey);
        const items = getGroupItems(field.fieldKey);

        return (
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="relative border border-stone-200 rounded-lg p-4 bg-stone-50/50">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-stone-600">
                                {field.fieldLabel} #{index + 1}
                            </span>
                            {items.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeGroupItem(field.fieldKey, index)}
                                    className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Xoá
                                </Button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {subFields.map((sf) => {
                                const errKey = `${field.fieldKey}.${index}.${sf.subFieldKey}`;
                                return (
                                    <div key={sf.subFieldKey} className="space-y-1">
                                        <Label className="text-sm">
                                            {sf.fieldLabel}
                                            {sf.required && <span className="text-red-500 ml-1">*</span>}
                                        </Label>
                                        {renderSubFieldInput(
                                            sf,
                                            item[sf.subFieldKey!],
                                            (val) => handleGroupItemChange(field.fieldKey, index, sf.subFieldKey!, val)
                                        )}
                                        {sf.helperText && (
                                            <p className="text-xs text-stone-400">{sf.helperText}</p>
                                        )}
                                        {errors[errKey] && (
                                            <p className="text-xs text-red-500">{errors[errKey]}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addGroupItem(field.fieldKey)}
                    className="w-full mt-2 gap-1 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                    <Plus className="w-4 h-4" /> Thêm {field.fieldLabel.toLowerCase()}
                </Button>
            </div>
        );
    };

    // ========== RENDER FIELD ==========
    const renderField = (field: FormFieldDef) => {
        const value = formData[field.fieldKey];

        switch (field.fieldType) {
            case 'group':
                return renderGroup(field);
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
            case 'radio':
                return (
                    <div className="flex flex-col gap-2 mt-1">
                        {field.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={field.fieldKey}
                                    checked={(value as string) === opt}
                                    onChange={() => handleChange(field.fieldKey, opt)}
                                    className="w-4 h-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-stone-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
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
                {sections.map((section) => {
                    // Filter: show top-level fields that are visible, skip sub-fields (rendered by group)
                    const visibleFields = section.fields
                        .filter((f) => !f.groupKey && isFieldVisible(f));
                    if (visibleFields.length === 0) return null;
                    return (
                        <Card key={section.name}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{section.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {visibleFields.map((field) => (
                                    <div key={field.fieldKey} className="space-y-1.5">
                                        {field.fieldType !== 'checkbox' && field.fieldType !== 'group' && (
                                            <Label htmlFor={field.fieldKey}>
                                                {field.fieldLabel}
                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                            </Label>
                                        )}
                                        {field.fieldType === 'group' && (
                                            <Label className="text-base font-semibold text-stone-700">
                                                {field.fieldLabel}
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
                    );
                })}
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
