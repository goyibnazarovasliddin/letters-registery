import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'; // Assuming these exist fromshadcn
import { Button } from './ui/button';
import { CheckCircle, Copy, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';


interface SuccessModalProps {
    open: boolean;
    onClose: () => void;
    onViewLetter: () => void;
    data: {
        letterNumber: string;
        letterDate: string;
        createdAt: string;
    } | null;
}

export function SuccessModal({ open, onClose, onViewLetter, data }: SuccessModalProps) {
    if (!data) return null;

    const copyToClipboard = () => {
        if (!data.letterNumber) return;
        navigator.clipboard.writeText(data.letterNumber);
        toast.success("Xat raqami nusxalandi");
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md animate-in fade-in zoom-in-95 duration-200">
                <DialogHeader className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <DialogTitle className="text-xl text-center text-green-700">Muvaffaqiyatli ro‘yxatga olindi</DialogTitle>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center space-y-2">
                        <p className="text-sm text-gray-500 uppercase font-medium tracking-wider">Xat raqamingiz</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                                {data.letterNumber}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={copyToClipboard}
                                className="h-10 w-10 text-gray-400 hover:text-green-600 hover:bg-green-50"
                                title="Nusxalash"
                            >
                                <Copy className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">Ro'yxatga olingan sana</p>
                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20">
                                <Calendar className="w-5 h-5 text-blue-500 mb-1.5" />
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                                    {data.createdAt ? new Date(data.createdAt).toLocaleDateString('ru-RU') : '-'}
                                </span>
                                <span className="text-[11px] font-medium text-blue-600/70 dark:text-blue-400/70 tabular-nums">
                                    {data.createdAt ? new Date(data.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">Xat sanasi</p>
                            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-green-50/30 dark:bg-green-900/10 border border-green-100/50 dark:border-green-800/20">
                                <FileText className="w-5 h-5 text-green-500 mb-1.5" />
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                                    {data.letterDate ? new Date(data.letterDate).toLocaleDateString('ru-RU') : '-'}
                                </span>
                                <span className="text-[11px] font-medium text-transparent">.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto flex-1">
                        Yopish
                    </Button>
                    <Button onClick={onViewLetter} className="w-full sm:w-auto flex-1 bg-green-600 hover:bg-green-700">
                        Xatni ko‘rish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
