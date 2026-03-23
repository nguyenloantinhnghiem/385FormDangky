'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { uploadFile } from '@/actions/upload';
import { Eraser, Check, Loader2, Undo2, PenTool } from 'lucide-react';

interface SignaturePadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    hint?: string;
}

export default function SignaturePad({ value, onChange, label, hint }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paths, setPaths] = useState<{ x: number; y: number }[][]>([]);
    const currentPath = useRef<{ x: number; y: number }[]>([]);

    // Init canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas resolution
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1c1917';
    }, []);

    const getPos = (e: React.TouchEvent | React.MouseEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top,
            };
        }
        return {
            x: (e as React.MouseEvent).clientX - rect.left,
            y: (e as React.MouseEvent).clientY - rect.top,
        };
    };

    const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const pos = getPos(e);
        currentPath.current = [pos];
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    };

    const draw = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        currentPath.current.push(pos);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
        setHasDrawn(true);
    };

    const endDraw = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentPath.current.length > 1) {
            setPaths(prev => [...prev, currentPath.current]);
        }
        currentPath.current = [];
    };

    const redraw = useCallback((pathsList: { x: number; y: number }[][]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1c1917';

        for (const path of pathsList) {
            if (path.length < 2) continue;
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
        }
    }, []);

    const handleUndo = () => {
        const newPaths = paths.slice(0, -1);
        setPaths(newPaths);
        redraw(newPaths);
        if (newPaths.length === 0) setHasDrawn(false);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPaths([]);
        setHasDrawn(false);
        onChange('');
    };

    const handleConfirm = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return;

        setUploading(true);
        setError(null);

        try {
            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), 'image/png');
            });

            const file = new File([blob], 'signature.png', { type: 'image/png' });
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadFile(formData);
            if (result.success && result.url) {
                onChange(result.url);
            } else {
                setError(result.error || 'Lỗi tải lên');
            }
        } catch {
            setError('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    if (value) {
        return (
            <div className="space-y-2">
                {label && <label className="text-sm font-medium text-stone-700">{label}</label>}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>Đã ký</span>
                    <button
                        type="button"
                        onClick={() => { onChange(''); handleClear(); }}
                        className="ml-auto text-xs px-2 py-1 rounded bg-white border border-stone-200 text-stone-500 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                        Ký lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium text-stone-700">{label}</label>}

            <div className="relative rounded-xl border-2 border-dashed border-stone-300 bg-white overflow-hidden">
                {/* Drawing guide */}
                {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="flex items-center gap-2 text-stone-300 text-sm">
                            <PenTool className="w-5 h-5" />
                            <span>Ký tên tại đây</span>
                        </div>
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    className="w-full touch-none cursor-crosshair"
                    style={{ height: '150px' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleUndo}
                    disabled={paths.length === 0 || uploading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 transition-colors"
                >
                    <Undo2 className="w-3 h-3" /> Hoàn tác
                </button>
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={!hasDrawn || uploading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-30 transition-colors"
                >
                    <Eraser className="w-3 h-3" /> Xoá
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!hasDrawn || uploading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-30 transition-colors ml-auto"
                >
                    {uploading ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...</>
                    ) : (
                        <><Check className="w-3 h-3" /> Xác nhận</>
                    )}
                </button>
            </div>

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}

            {hint && !error && (
                <p className="text-xs text-stone-400">{hint}</p>
            )}
        </div>
    );
}
