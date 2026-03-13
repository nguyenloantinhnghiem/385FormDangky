'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Copy, RefreshCw } from 'lucide-react';

interface SuccessScreenProps {
    submissionCode: string;
    onNewRegistration: () => void;
}

export default function SuccessScreen({ submissionCode, onNewRegistration }: SuccessScreenProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(submissionCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* fallback: do nothing */ }
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>

            <h2 className="text-2xl font-bold text-stone-800 mb-2">Đăng ký thành công!</h2>
            <p className="text-stone-500 mb-6">Cảm ơn bạn đã đăng ký. Thông tin đã được ghi nhận.</p>

            <Card className="w-full max-w-sm mb-6">
                <CardContent className="p-4 text-center">
                    <p className="text-xs text-stone-400 mb-1">Mã đăng ký của bạn</p>
                    <p className="text-2xl font-mono font-bold text-amber-600 mb-3">{submissionCode}</p>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Đã sao chép!' : 'Sao chép mã'}
                    </Button>
                </CardContent>
            </Card>

            <p className="text-xs text-stone-400 mb-6 max-w-xs">
                Vui lòng lưu lại mã này để tra cứu sau. Thông tin đăng ký đã được gửi thành công.
            </p>

            <Button variant="outline" onClick={onNewRegistration} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Đăng ký mới
            </Button>
        </div>
    );
}
