'use client';

import { useState, useEffect } from 'react';
import { lookupByPhone } from '@/actions/lookup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, RotateCcw, Calendar, Loader2, Filter } from 'lucide-react';
import type { RegistrationType } from '@/actions/settings';

interface PastSubmission {
    submissionId: string;
    submissionCode: string;
    createdAt: string;
    ceremonyType: string;
    ceremonyLabel: string;
    applicantName: string;
    applicantPhone: string;
    applicantTo: string;
    totalItems: string;
    categoriesText: string;
    registrationLabel: string;
    itemsData: {
        categoryKey: string;
        categoryLabel: string;
        displayName: string;
        summaryText: string;
        payloadJson: string;
    }[];
}

interface LookupScreenProps {
    onSelectPast: (sub: PastSubmission) => void;
    onBack: () => void;
}

export default function LookupScreen({ onSelectPast, onBack }: LookupScreenProps) {
    const [phone, setPhone] = useState('');
    const [formFilter, setFormFilter] = useState('');
    const [regTypes, setRegTypes] = useState<RegistrationType[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<PastSubmission[] | null>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!phone.trim()) return;
        setIsSearching(true);
        setSearched(true);
        try {
            const res = await lookupByPhone(phone.trim(), formFilter || undefined);
            setResults(res.submissions);
            if (regTypes.length === 0 && res.registrationTypes.length > 0) {
                setRegTypes(res.registrationTypes);
            }
        } catch {
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const formatDate = (iso: string) => {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return iso;
        }
    };

    // Group results by ceremonyLabel
    const groupedResults = results ? results.reduce((acc, sub) => {
        const key = sub.registrationLabel || sub.ceremonyLabel || 'Khác';
        if (!acc[key]) acc[key] = [];
        acc[key].push(sub);
        return acc;
    }, {} as Record<string, PastSubmission[]>) : {};

    return (
        <div className="animate-slide-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Search className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-stone-800">Tra cứu đăng ký</h2>
                    <p className="text-sm text-stone-500">Nhập SĐT để tìm đăng ký trước đó</p>
                </div>
            </div>

            <Card className="mb-4">
                <CardContent className="p-4 space-y-3">
                    {/* Phone input */}
                    <div className="space-y-2">
                        <Label htmlFor="lookup-phone">Số điện thoại</Label>
                        <div className="flex gap-2">
                            <Input
                                id="lookup-phone"
                                type="tel"
                                placeholder="VD: 0912345678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button
                                onClick={handleSearch}
                                disabled={isSearching || !phone.trim()}
                                className="gap-1 px-4"
                            >
                                {isSearching ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                                Tìm
                            </Button>
                        </div>
                    </div>

                    {/* Form type filter */}
                    {regTypes.length > 0 && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs text-stone-500">
                                <Filter className="w-3 h-3" />
                                Lọc theo loại đăng ký
                            </Label>
                            <select
                                value={formFilter}
                                onChange={(e) => setFormFilter(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">-- Tất cả loại --</option>
                                {regTypes.filter(r => r.open).map((rt) => (
                                    <option key={rt.key} value={rt.label}>{rt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results */}
            {searched && results !== null && (
                <div className="space-y-3">
                    {results.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p className="text-stone-500 text-sm">
                                    😔 Không tìm thấy đăng ký nào với SĐT <strong>{phone}</strong>
                                    {formFilter && <span className="block mt-1 text-xs text-stone-400">Loại: {formFilter}</span>}
                                </p>
                                <p className="text-stone-400 text-xs mt-2">
                                    Hãy kiểm tra lại số hoặc thử bỏ bộ lọc
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <p className="text-sm text-stone-600 font-medium">
                                Tìm thấy {results.length} đăng ký:
                            </p>

                            {Object.entries(groupedResults).map(([groupLabel, subs]) => (
                                <div key={groupLabel} className="space-y-2">
                                    {Object.keys(groupedResults).length > 1 && (
                                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide pt-1">
                                            {groupLabel}
                                        </p>
                                    )}
                                    {subs.map((sub) => (
                                        <Card
                                            key={sub.submissionId}
                                            className="cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all"
                                            onClick={() => onSelectPast(sub)}
                                        >
                                            <CardHeader className="pb-1 px-4 pt-3">
                                                <CardTitle className="text-sm flex items-center justify-between">
                                                    <span className="text-amber-700">{sub.applicantName}</span>
                                                    <span className="text-xs font-mono text-stone-400">{sub.submissionCode}</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="px-4 pb-3 pt-0">
                                                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1 flex-wrap">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(sub.createdAt)}
                                                    {sub.ceremonyLabel && (
                                                        <>
                                                            <span className="mx-0.5">•</span>
                                                            <span className="truncate max-w-[150px]">{sub.ceremonyLabel}</span>
                                                        </>
                                                    )}
                                                    {sub.applicantTo && (
                                                        <>
                                                            <span className="mx-0.5">•</span>
                                                            {sub.applicantTo}
                                                        </>
                                                    )}
                                                </div>
                                                {sub.categoriesText && (
                                                    <p className="text-xs text-stone-400 truncate">
                                                        {sub.totalItems} mục: {sub.categoriesText}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex justify-end">
                                                    <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                                                        <RotateCcw className="w-3 h-3" /> Đăng ký lại
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </Button>
            </div>
        </div>
    );
}

export type { PastSubmission };
