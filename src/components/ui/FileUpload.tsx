'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadFile } from '@/actions/upload';
import { Camera, X, Upload, Loader2, CheckCircle, ImageIcon } from 'lucide-react';

interface FileUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    hint?: string;
}

export default function FileUpload({ value, onChange, label, hint }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        setError(null);

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Upload to Google Drive
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await uploadFile(formData);

            if (result.success && result.url) {
                onChange(result.url);
            } else {
                setError(result.error || 'Lỗi tải lên');
                setPreview(null);
            }
        } catch {
            setError('Lỗi kết nối. Vui lòng thử lại.');
            setPreview(null);
        } finally {
            setUploading(false);
        }
    }, [onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleRemove = () => {
        setPreview(null);
        onChange('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const displayUrl = value || preview;

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-stone-700">{label}</label>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleInputChange}
                className="hidden"
            />

            {displayUrl ? (
                <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                    <img
                        src={preview || ''}
                        alt="Ảnh đã tải"
                        className="w-full max-h-64 object-contain"
                        style={{ display: preview ? 'block' : 'none' }}
                    />
                    {!preview && value && (
                        <div className="flex items-center gap-2 p-4 text-sm text-emerald-700">
                            <CheckCircle className="w-4 h-4" />
                            <a href={value} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-900 truncate">
                                Đã tải lên ✓
                            </a>
                        </div>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-lg">
                                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                <span className="text-sm text-stone-700">Đang tải lên...</span>
                            </div>
                        </div>
                    )}

                    {!uploading && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/50 hover:border-amber-400 hover:bg-amber-50/30 transition-all text-sm text-stone-500 hover:text-amber-700"
                    >
                        <Upload className="w-5 h-5" />
                        <span>Chọn ảnh</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            // Use camera capture
                            if (fileInputRef.current) {
                                fileInputRef.current.setAttribute('capture', 'environment');
                                fileInputRef.current.click();
                            }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/50 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-sm text-stone-500 hover:text-blue-700"
                    >
                        <Camera className="w-5 h-5" />
                        <span>Chụp</span>
                    </button>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> {error}
                </p>
            )}

            {hint && !error && (
                <p className="text-xs text-stone-400">{hint}</p>
            )}
        </div>
    );
}
