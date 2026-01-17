import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api/client';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Switch } from '../components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Calendar, Save } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";

export function SettingsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [allowPastDates, setAllowPastDates] = useState(false);
    const [saving, setSaving] = useState(false);
    const [originalSettings, setOriginalSettings] = useState<boolean | null>(null);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    // Dirty check logic
    const isDirty = originalSettings !== null && allowPastDates !== originalSettings;

    // Intercept navigation when there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Custom navigation handler for both mouse and keyboard
    useEffect(() => {
        const handleNavigation = (e: MouseEvent | KeyboardEvent) => {
            if (!isDirty) return;

            // Handle keyboard Enter/Space on elements that trigger navigation
            if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') return;

            const target = e.target as HTMLElement;
            const link = target.closest('a, [data-nav="true"]');

            if (link) {
                const path = link.getAttribute('href') || link.getAttribute('data-path');

                if (path && path !== location.pathname) {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingNavigation(path);
                    setShowUnsavedDialog(true);
                }
            }
        };

        document.addEventListener('click', handleNavigation as any, true);
        document.addEventListener('keydown', handleNavigation as any, true);
        return () => {
            document.removeEventListener('click', handleNavigation as any, true);
            document.removeEventListener('keydown', handleNavigation as any, true);
        };
    }, [isDirty, location.pathname]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.settings.get();
            if (res) {
                setAllowPastDates(res.allowPastDates);
                setOriginalSettings(res.allowPastDates);
            }
        } catch (e) {
            toast.error('Sozlamalarni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.settings.update({ allowPastDates });
            setOriginalSettings(allowPastDates);
            toast.success('Sozlamalar saqlandi');
        } catch (e) {
            toast.error('Saqlashda xatolik');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscardAndNavigate = () => {
        setAllowPastDates(originalSettings!);
        setShowUnsavedDialog(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
        }
    };

    const handleSaveAndNavigate = async () => {
        await handleSave();
        setShowUnsavedDialog(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sozlamalar</h2>
                <p className="text-gray-500 text-sm">Tizim sozlamalarini boshqarish</p>
            </div>

            <Card className="max-w-2xl bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Sana cheklovlari</CardTitle>
                            <CardDescription>Xatlar sanalari bo'yicha cheklovlarni sozlash</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="space-y-0.5">
                            <div className="font-medium text-gray-900 dark:text-gray-200">O'tgan sana bilan xat kiritish</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Agar yoqilgan bo'lsa, xodimlarga o'tgan sanalar bilan xat yaratishga ruxsat beriladi.
                            </div>
                        </div>
                        <Switch
                            checked={allowPastDates}
                            onCheckedChange={setAllowPastDates}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving || !isDirty}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                        >
                            {saving ? 'Saqlanmoqda...' : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Saqlash
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>O'zgarishlarni saqlaysizmi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sizda saqlanmagan o'zgarishlar mavjud. Nima qilmoqchisiz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setShowUnsavedDialog(false);
                            setPendingNavigation(null);
                        }}>
                            Bekor qilish
                        </AlertDialogCancel>
                        <Button variant="outline" onClick={handleDiscardAndNavigate}>
                            Saqlamasdan chiqish
                        </Button>
                        <AlertDialogAction onClick={handleSaveAndNavigate} className="bg-green-600 hover:bg-green-700">
                            Saqlash va chiqish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
