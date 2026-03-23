'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, RotateCcw, Play, Lock, Clock, ChevronLeft, Search } from 'lucide-react';
import { getLandingConfig, getRegistrationTypes, type LandingConfig, type RegistrationType } from '@/actions/settings';

interface LandingScreenProps {
    onStart: (regType?: RegistrationType) => void;
    onLookup: () => void;
}

// Countdown hook
function useCountdown(targetISO: string) {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        if (!targetISO) return;
        const tick = () => {
            const diff = new Date(targetISO).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft(''); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            if (h > 24) {
                const d = Math.floor(h / 24);
                setTimeLeft(`${d} ngày ${h % 24}h`);
            } else if (h > 0) {
                setTimeLeft(`${h}h ${m}m`);
            } else {
                setTimeLeft(`${m}m ${s}s`);
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetISO]);
    return timeLeft;
}

export default function LandingScreen({ onStart, onLookup }: LandingScreenProps) {
    const [config, setConfig] = useState<LandingConfig | null>(null);
    const [allTypes, setAllTypes] = useState<RegistrationType[]>([]);
    const [showVideo, setShowVideo] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedParent, setSelectedParent] = useState<RegistrationType | null>(null);

    useEffect(() => {
        Promise.all([getLandingConfig(), getRegistrationTypes()])
            .then(([cfg, types]) => { setConfig(cfg); setAllTypes(types); })
            .finally(() => setLoading(false));
    }, []);

    const getEmbedUrl = useCallback((url: string) => {
        if (url.includes('/embed/')) return url;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    }, []);

    const countdown = useCountdown(config?.nextEventTime || '');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse shadow-lg">🙏</div>
                    <p className="text-stone-400 text-sm">Đang tải...</p>
                </div>
            </div>
        );
    }

    const title = config?.title || 'Đăng Ký Trực Tuyến';
    const subtitle = config?.subtitle || '';
    const notes = config?.notes || [];
    const isClosed = config ? !config.registrationOpen : false;

    const rootTypes = allTypes.filter((t) => !t.parent && t.open);
    const childTypes = selectedParent
        ? allTypes.filter((t) => t.parent === selectedParent.key && t.open)
        : [];

    const handleTypeClick = (rt: RegistrationType) => {
        const children = allTypes.filter((t) => t.parent === rt.key && t.open);
        if (children.length > 0) {
            setSelectedParent(rt);
        } else {
            onStart(rt);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-white to-orange-50/30">
            {/* ── Hero Section ── */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-400/5 to-transparent" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-300/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-300/15 to-transparent rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

                <div className="relative max-w-2xl mx-auto px-4 pt-10 md:pt-16 pb-8 text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl md:text-5xl shadow-xl shadow-amber-500/25 mb-4 md:mb-6">
                        🙏
                    </div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent mb-2">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-stone-500 text-sm md:text-base max-w-md mx-auto mb-1">{subtitle}</p>
                    )}

                    {/* Schedule status badge */}
                    {config?.scheduleMode !== 'manual' && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {isClosed ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    Ngoài giờ hoạt động
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Đang mở đăng ký
                                </span>
                            )}
                        </div>
                    )}

                    {/* Countdown */}
                    {countdown && config?.nextEventType && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 backdrop-blur border border-stone-200/50 text-xs text-stone-600">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            {config.nextEventType === 'close' ? 'Đóng sau' : 'Mở sau'}: <strong className="text-amber-700">{countdown}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 pb-12">
                {/* Warning */}
                {config?.formWarning && (
                    <div className="mb-4 bg-red-50/80 backdrop-blur border border-red-200/60 rounded-xl px-4 py-3 text-sm text-red-700 font-medium shadow-sm">
                        ⚠️ {config.formWarning}
                    </div>
                )}

                {/* Closed state */}
                {isClosed && (
                    <Card className="mb-6 border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm">
                        <CardContent className="p-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
                                <Lock className="w-7 h-7 text-orange-500" />
                            </div>
                            <p className="text-stone-700 font-medium mb-2">{config?.closeMessage}</p>
                            {config?.nextDate && (
                                <p className="text-sm text-orange-600">
                                    Đợt tiếp theo: <strong>{config.nextDate}</strong>
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Video */}
                {config?.videoUrl && (
                    <div className="mb-5">
                        {!showVideo ? (
                            <button
                                onClick={() => setShowVideo(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 backdrop-blur border border-stone-200/50 text-sm text-stone-600 hover:bg-white/80 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                            >
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <Play className="w-4 h-4 text-blue-500" />
                                </div>
                                <span>Xem video hướng dẫn sử dụng</span>
                            </button>
                        ) : (
                            <div className="rounded-xl overflow-hidden shadow-lg border border-stone-200/50">
                                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                    <iframe
                                        src={getEmbedUrl(config.videoUrl)}
                                        className="absolute inset-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title="Hướng dẫn sử dụng"
                                    />
                                </div>
                                <button onClick={() => setShowVideo(false)} className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 bg-white">
                                    Ẩn video
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Registration cards */}
                {!isClosed && (
                    <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
                        {selectedParent ? (
                            <>
                                <button
                                    onClick={() => setSelectedParent(null)}
                                    className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium mb-1 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {selectedParent.label}
                                </button>
                                <p className="text-xs text-stone-400 mb-2">Chọn trường hợp:</p>
                                {childTypes.map((rt) => (
                                    <FormCard key={rt.key} rt={rt} onClick={() => onStart(rt)} />
                                ))}
                            </>
                        ) : rootTypes.length <= 1 ? (
                            <Button
                                onClick={() => handleTypeClick(rootTypes[0])}
                                className="w-full px-6 py-6 text-base gap-2 shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl"
                            >
                                Bắt đầu đăng ký <ArrowRight className="w-5 h-5" />
                            </Button>
                        ) : (
                            <>
                                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1 md:col-span-2">Chọn loại đăng ký</p>
                                {rootTypes.map((rt) => (
                                    <FormCard key={rt.key} rt={rt} onClick={() => handleTypeClick(rt)} />
                                ))}
                            </>
                        )}

                        {/* Lookup / Re-register — Prominent */}
                        <div className="pt-4 mt-2 border-t border-stone-200/40 md:col-span-2">
                            <button
                                onClick={onLookup}
                                className="w-full group flex items-center gap-3.5 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/60 shadow-sm hover:shadow-md hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 transition-all text-left"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                                    <RotateCcw className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-blue-800 text-sm">Tra cứu & Đăng ký lại</p>
                                    <p className="text-xs text-blue-500">Nhập SĐT để xem đăng ký cũ hoặc đăng ký lại</p>
                                </div>
                                <Search className="w-5 h-5 text-blue-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {notes.length > 0 && (
                    <div className="mt-8 rounded-xl bg-white/40 backdrop-blur border border-stone-200/40 p-4 shadow-sm">
                        <div className="flex items-start gap-3 text-left">
                            <Heart className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-stone-500">
                                <p className="font-semibold text-stone-700 mb-1.5">Lưu ý</p>
                                <ul className="space-y-1 list-disc list-inside">
                                    {notes.map((note, i) => (
                                        <li key={i}>{note}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Form Card Component ──
function FormCard({ rt, onClick }: { rt: RegistrationType; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full group flex items-center gap-3.5 p-4 md:p-5 rounded-xl bg-white/70 backdrop-blur border border-stone-200/50 shadow-sm hover:shadow-lg hover:border-amber-300/60 hover:bg-white/90 hover:scale-[1.02] transition-all text-left"
        >
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/30 flex items-center justify-center text-xl md:text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {rt.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 text-sm md:text-base truncate">{rt.label}</p>
                {rt.description && (
                    <p className="text-xs md:text-sm text-stone-400 truncate">{rt.description}</p>
                )}
            </div>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
    );
}
