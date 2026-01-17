import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { api } from '../services/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Shield, Key, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';

export function UserProfile() {
    const { user } = useUser();
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    if (!user) return null;

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 5) {
            toast.error('Parol kamida 5 ta belgidan iborat bo\'lishi kerak');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Parollar mos kelmadi');
            return;
        }

        try {
            await api.auth.changePassword(newPassword);
            toast.success('Parol muvaffaqiyatli o\'zgartirildi');
            setOpenPasswordDialog(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (e) {
            toast.error('Xatolik yuz berdi');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Mening Profilim</h2>
                    <p className="text-gray-500 text-sm">Shaxsiy ma'lumotlar va sozlamalar</p>
                </div>
            </div>

            <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <div className="h-32 bg-gradient-to-r from-green-600 to-emerald-600"></div>
                <CardContent className="relative pt-0 pb-8 px-8">
                    <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-6 gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 p-1 shadow-xl">
                            <div className="w-full h-full bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <User className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div className="flex-1 mb-2">
                            <h3 className="text-2xl font-bold dark:text-white">{user.fullName}</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{user.position}</p>
                        </div>
                        <div className="mb-4 flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className={`w-3 h-3 rounded-full ${user.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {user.status === 'active' ? 'Faol' : 'Nofaol'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t dark:border-gray-700 pt-8">
                        <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2 dark:text-gray-200">
                                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                                Tizim ma'lumotlari
                            </h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">Login</span>
                                    <span className="font-medium dark:text-gray-200">{user.username}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">Rol</span>
                                    <span className="capitalize dark:text-gray-200">Ijrochi</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">Holati</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <p className="font-medium capitalize dark:text-gray-200">{user.status === 'active' ? 'Faol' : 'Nofaol'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2 dark:text-gray-200">
                                <Key className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                Xavfsizlik
                            </h4>
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg space-y-3">
                                <p className="text-sm text-orange-800 dark:text-orange-300">Parolingizni muntazam yangilab turish tavsiya etiladi.</p>

                                <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-800">
                                            Parolni o'zgartirish
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Parolni o'zgartirish</DialogTitle>
                                            <DialogDescription>
                                                Yangi parolni kiriting. Kamida 5 ta belgi bo'lishi kerak.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handlePasswordChange} className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="new">Yangi parol</Label>
                                                <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirm">Parolni tasdiqlang</Label>
                                                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="bg-green-600 hover:bg-green-700">Saqlash</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
