'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Heart, RotateCcw, Play, Lock, Calendar } from 'lucide-react';
import { getLandingConfig, getRegistrationTypes, type LandingConfig, type RegistrationType } from '@/actions/settings';

interface LandingScreenProps {
    onStart: (regType?: RegistrationType) => void;
    onLookup: () => void;
}

export default function LandingScreen({ onStart, onLookup }: LandingScreenProps) {
    const [config, setConfig] = useState<LandingConfig | null>(null);
    const [allTypes, setAllTypes] = useState<RegistrationType[]>([]);
    const [showVideo, setShowVideo] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedParent, setSelectedParent] = useState<RegistrationType | null>(null);

    useEffect(() => {
        Promise.all([getLandingConfig(), getRegistrationTypes()])
            .then(([cfg, types]) => {
                setConfig(cfg);
                setAllTypes(types);
            })
            .finally(() => setLoading(false));
    }, []);

    // Convert YouTube URL to embed URL
    const getEmbedUrl = (url: string) => {
        if (url.includes('/embed/')) return url;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?]+)/);
        if (match) return `https://www.youtube.com/embed/${match[1]}`;
        return url;
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">🙏</div>
                    <p className="text-stone-400 text-sm">Đang tải...</p>
                </div>
            </div>
        );
    }

    const title = config?.title || 'Đăng Ký Trực Tuyến';
    const subtitle = config?.subtitle || '';
    const notes = config?.notes || [];
    const isClosed = config ? !config.registrationOpen : false;

    // Root types = those without a parent
    const rootTypes = allTypes.filter((t) => !t.parent && t.open);
    // Children of selected parent
    const childTypes = selectedParent
        ? allTypes.filter((t) => t.parent === selectedParent.key && t.open)
        : [];

    const handleTypeClick = (rt: RegistrationType) => {
        // Check if this type has children
        const children = allTypes.filter((t) => t.parent === rt.key && t.open);
        if (children.length > 0) {
            setSelectedParent(rt);
        } else {
            onStart(rt);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg animate-float">
                    🙏
                </div>
                <div className="absolute -top-1 -right-1 text-xl animate-bounce-in">✨</div>
            </div>

            <h1 className="text-2xl font-bold text-stone-800 mb-3">{title}</h1>
            {subtitle && (
                <p className="text-stone-500 mb-2 max-w-xs">{subtitle}</p>
            )}
            <p className="text-stone-400 text-sm mb-6 max-w-xs">
                Bạn có thể đăng ký <strong className="text-amber-600">nhiều mục</strong> cùng lúc, xem lại và chỉnh sửa trước khi gửi.
            </p>

            {/* Warning banner */}
            {config?.formWarning && (
                <div className="w-full max-w-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">
                    ⚠️ {config.formWarning}
                </div>
            )}

            {/* Registration CLOSED */}
            {isClosed && (
                <div className="w-full max-w-sm mb-6">
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-5 text-center">
                            <Lock className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                            <p className="text-stone-700 font-medium mb-2">{config?.closeMessage}</p>
                            {config?.nextDate && (
                                <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
                                    <Calendar className="w-4 h-4" />
                                    Đợt tiếp theo: <strong>{config.nextDate}</strong>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Video hướng dẫn */}
            {config?.videoUrl && (
                <div className="w-full max-w-sm mb-6">
                    {!showVideo ? (
                        <Button
                            variant="outline"
                            onClick={() => setShowVideo(true)}
                            className="w-full gap-2 py-5 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                            <Play className="w-5 h-5" />
                            Xem video hướng dẫn sử dụng
                        </Button>
                    ) : (
                        <div className="rounded-xl overflow-hidden shadow-lg border border-stone-200">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    src={getEmbedUrl(config.videoUrl)}
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="Hướng dẫn sử dụng"
                                />
                            </div>
                            <button
                                onClick={() => setShowVideo(false)}
                                className="w-full py-2 text-xs text-stone-400 hover:text-stone-600"
                            >
                                Ẩn video
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Registration type buttons */}
            {!isClosed && (
                <div className="flex flex-col gap-3 w-full max-w-sm">
                    {/* Sub-type selection (when parent is selected) */}
                    {selectedParent ? (
                        <>
                            <div className="flex items-center gap-2 mb-1">
                                <button
                                    onClick={() => setSelectedParent(null)}
                                    className="text-sm text-amber-600 hover:underline flex items-center gap-1"
                                >
                                    ← Quay lại
                                </button>
                                <span className="text-sm text-stone-400">|</span>
                                <span className="text-sm font-medium text-stone-700">{selectedParent.label}</span>
                            </div>
                            <p className="text-sm text-stone-500 mb-1">Chọn trường hợp:</p>
                            {childTypes.map((rt) => (
                                <Card
                                    key={rt.key}
                                    className="cursor-pointer hover:border-amber-300 hover:shadow-md transition-all"
                                    onClick={() => onStart(rt)}
                                >
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">
                                            {rt.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-medium text-stone-800">{rt.label}</p>
                                            {rt.description && (
                                                <p className="text-xs text-stone-400">{rt.description}</p>
                                            )}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-stone-300" />
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    ) : rootTypes.length <= 1 ? (
                        /* Only one root type — single button */
                        <Button
                            onClick={() => handleTypeClick(rootTypes[0])}
                            className="px-8 py-6 text-lg gap-2 shadow-lg"
                        >
                            Bắt đầu đăng ký <ArrowRight className="w-5 h-5" />
                        </Button>
                    ) : (
                        /* Multiple root types — show cards */
                        <>
                            <p className="text-sm font-medium text-stone-600 mb-1">Chọn loại đăng ký:</p>
                            {rootTypes.map((rt) => (
                                <Card
                                    key={rt.key}
                                    className="cursor-pointer hover:border-amber-300 hover:shadow-md transition-all"
                                    onClick={() => handleTypeClick(rt)}
                                >
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">
                                            {rt.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-medium text-stone-800">{rt.label}</p>
                                            {rt.description && (
                                                <p className="text-xs text-stone-400">{rt.description}</p>
                                            )}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-stone-300" />
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    )}
                    <Button
                        variant="outline"
                        onClick={onLookup}
                        className="px-8 py-5 gap-2 border-stone-300 text-stone-600"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Đăng ký lại (tra cứu SĐT)
                    </Button>
                </div>
            )}

            {/* Notes card */}
            {notes.length > 0 && (
                <Card className="mt-8 max-w-sm">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3 text-left">
                            <Heart className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-stone-500">
                                <p className="font-medium text-stone-700 mb-1">Lưu ý:</p>
                                <ul className="space-y-1">
                                    {notes.map((note, i) => (
                                        <li key={i}>{note}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
