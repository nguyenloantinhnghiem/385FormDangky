'use client';

import { useState, useEffect } from 'react';
import { adminListSubmissions, adminGetSubmission } from '@/actions/admin';
import { getRegistrationTypes, type RegistrationType } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Eye, ArrowLeft, Lock, LogIn, Loader2, Link2, Check, Copy, ExternalLink } from 'lucide-react';

type ViewMode = 'login' | 'list' | 'detail';

export default function AdminPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('login');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [submissions, setSubmissions] = useState<Record<string, string>[]>([]);
    const [filtered, setFiltered] = useState<Record<string, string>[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [regTypes, setRegTypes] = useState<RegistrationType[]>([]);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [detail, setDetail] = useState<{
        submission: Record<string, string>;
        items: Record<string, string>[];
    } | null>(null);

    // Filter submissions when search changes
    useEffect(() => {
        let result = submissions;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (s) =>
                    s.applicant_name?.toLowerCase().includes(term) ||
                    s.applicant_phone?.includes(term) ||
                    s.submission_code?.toLowerCase().includes(term)
            );
        }
        if (categoryFilter) {
            result = result.filter((s) =>
                s.categories_text?.toLowerCase().includes(categoryFilter.toLowerCase())
            );
        }
        setFiltered(result);
    }, [submissions, searchTerm, categoryFilter]);

    const handleLogin = async () => {
        setLoading(true);
        setLoginError('');
        const result = await adminListSubmissions(password);
        if (result.success && result.data) {
            setSubmissions(result.data);
            setFiltered(result.data);
            // Also fetch reg types for link management
            const types = await getRegistrationTypes();
            setRegTypes(types);
            setViewMode('list');
        } else {
            setLoginError(result.error || 'Đăng nhập thất bại');
        }
        setLoading(false);
    };

    const getBaseUrl = () => {
        if (typeof window !== 'undefined') return window.location.origin;
        return '';
    };

    const copyLink = async (key: string) => {
        const url = `${getBaseUrl()}/dang-ky/${key}`;
        await navigator.clipboard.writeText(url);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleViewDetail = async (submissionId: string) => {
        setLoading(true);
        const result = await adminGetSubmission(password, submissionId);
        if (result.success && result.data) {
            setDetail(result.data);
            setViewMode('detail');
        }
        setLoading(false);
    };

    // Login view
    if (viewMode === 'login') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <div className="w-14 h-14 mx-auto rounded-full bg-stone-100 flex items-center justify-center mb-3">
                            <Lock className="w-7 h-7 text-stone-500" />
                        </div>
                        <CardTitle>Quản trị viên</CardTitle>
                        <p className="text-sm text-stone-500">Nhập mật khẩu để truy cập</p>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleLogin();
                            }}
                            className="space-y-4"
                        >
                            <Input
                                type="password"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {loginError && <p className="text-sm text-red-500">{loginError}</p>}
                            <Button type="submit" className="w-full gap-2" disabled={loading || !password}>
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogIn className="w-4 h-4" />
                                )}
                                Đăng nhập
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Flatten reg types: get all leaf types (with formType)
    const leafTypes = regTypes.filter(t => t.formType);

    // List view — helper for the link section
    const baseUrl = getBaseUrl();

    // Detail view
    if (viewMode === 'detail' && detail) {
        const s = detail.submission;
        let applicantData: Record<string, string> = {};
        try {
            applicantData = JSON.parse(s.applicant_payload_json || '{}');
        } catch { /* ignore */ }

        return (
            <div className="min-h-screen bg-stone-50 p-4">
                <div className="max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => setViewMode('list')}
                        className="mb-4 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                    </Button>

                    <Card className="mb-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Chi tiết đăng ký</CardTitle>
                                <Badge variant="success">{s.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-stone-500">Mã:</span> <strong>{s.submission_code}</strong></div>
                                <div><span className="text-stone-500">Ngày:</span> {new Date(s.created_at).toLocaleString('vi-VN')}</div>
                                <div><span className="text-stone-500">Họ tên:</span> {s.applicant_name}</div>
                                <div><span className="text-stone-500">SĐT:</span> {s.applicant_phone}</div>
                                <div><span className="text-stone-500">Zalo:</span> {s.applicant_zalo || '—'}</div>
                                <div><span className="text-stone-500">Địa chỉ:</span> {s.applicant_address || '—'}</div>
                                <div className="col-span-2"><span className="text-stone-500">Mục:</span> {s.categories_text}</div>
                                <div className="col-span-2"><span className="text-stone-500">Ghi chú:</span> {s.notes || '—'}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <h3 className="font-semibold text-stone-800 mb-3">Danh sách mục ({detail.items.length})</h3>
                    <div className="space-y-3">
                        {detail.items.map((item, idx) => {
                            let itemData: Record<string, unknown> = {};
                            try {
                                itemData = JSON.parse(item.item_payload_json || '{}');
                            } catch { /* ignore */ }

                            return (
                                <Card key={item.item_id || idx}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="default">Mục {item.item_index}</Badge>
                                            <span className="text-sm font-medium text-stone-800">{item.category_label}</span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div><span className="text-stone-500">Tên:</span> {item.subject_name || item.display_name || '—'}</div>
                                            <div><span className="text-stone-500">Tóm tắt:</span> {item.summary_text || '—'}</div>
                                            {item.reference_value && (
                                                <div><span className="text-stone-500">Tham chiếu:</span> {item.reference_value}</div>
                                            )}
                                        </div>

                                        {/* Collapsible raw JSON */}
                                        <details className="mt-3">
                                            <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600">
                                                Xem dữ liệu gốc (JSON)
                                            </summary>
                                            <pre className="mt-2 p-3 bg-stone-50 rounded-lg text-xs overflow-x-auto text-stone-600">
                                                {JSON.stringify(itemData, null, 2)}
                                            </pre>
                                        </details>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Full applicant JSON */}
                    <details className="mt-6">
                        <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600">
                            Dữ liệu gốc người đăng ký (JSON)
                        </summary>
                        <pre className="mt-2 p-3 bg-stone-50 rounded-lg text-xs overflow-x-auto text-stone-600">
                            {JSON.stringify(applicantData, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className="min-h-screen bg-stone-50 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold text-stone-800">Quản lý đăng ký</h1>
                    <Badge variant="secondary">{submissions.length} đăng ký</Badge>
                </div>

                {/* ── Link Form Section ── */}
                {leafTypes.length > 0 && (
                    <details className="mb-6">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 hover:bg-blue-100 transition-colors">
                            <Link2 className="w-4 h-4" />
                            Link form đăng ký ({leafTypes.length} form)
                            <span className="ml-auto text-xs text-blue-400">▼</span>
                        </summary>
                        <div className="mt-2 space-y-2">
                            {/* Home link */}
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <span className="text-lg">🏠</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-stone-700">Trang chủ</p>
                                    <p className="text-[11px] text-stone-400 truncate">{baseUrl}/</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 gap-1 text-xs"
                                    onClick={() => { navigator.clipboard.writeText(baseUrl + '/'); setCopiedKey('home'); setTimeout(() => setCopiedKey(null), 2000); }}
                                >
                                    {copiedKey === 'home' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    {copiedKey === 'home' ? 'Đã copy' : 'Copy'}
                                </Button>
                            </div>

                            {/* Each form link */}
                            {leafTypes.map(rt => (
                                <div key={rt.key} className="flex items-center gap-2 p-3 rounded-lg bg-white border border-stone-200 hover:border-blue-200 transition-colors">
                                    <span className="text-lg">{rt.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-stone-700">{rt.label}</p>
                                        <p className="text-[11px] text-stone-400 truncate">{baseUrl}/dang-ky/{rt.key}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 gap-1 text-xs"
                                        onClick={() => copyLink(rt.key)}
                                    >
                                        {copiedKey === rt.key ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                        {copiedKey === rt.key ? 'Đã copy' : 'Copy'}
                                    </Button>
                                    <a
                                        href={`/dang-ky/${rt.key}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-stone-400 hover:text-blue-500 transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </details>
                )}

                {/* Search & filter */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                            placeholder="Tìm theo tên, SĐT, mã..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <Input
                        placeholder="Lọc theo loại mục (VD: hương linh, tâm linh...)"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    />
                </div>

                <Separator className="mb-4" />

                {loading && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-stone-400">Không tìm thấy đăng ký nào.</p>
                    </div>
                )}

                <div className="space-y-3">
                    {filtered.map((s) => (
                        <Card key={s.submission_id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-stone-800 text-sm">
                                                {s.applicant_name}
                                            </span>
                                            <Badge variant="success" className="text-[10px]">{s.status}</Badge>
                                        </div>
                                        <p className="text-xs text-stone-500">
                                            {s.submission_code} • {s.applicant_phone}
                                        </p>
                                        <p className="text-xs text-stone-400 mt-1">
                                            {s.total_items} mục • {s.categories_text}
                                        </p>
                                        <p className="text-[11px] text-stone-400">
                                            {new Date(s.created_at).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleViewDetail(s.submission_id)}
                                        className="h-8 gap-1"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> Xem
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
