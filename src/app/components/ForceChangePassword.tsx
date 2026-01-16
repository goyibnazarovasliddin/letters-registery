import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Lock } from 'lucide-react';
import { api } from '../services/api/client';

export function ForceChangePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const { user, updateUser } = useUser();

    const handleSubmit = async (e: React.FormEvent) => {
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

            // Update local user state so they can access the portal
            updateUser({ mustChangePasswordOnNextLogin: false });

            navigate('/');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Parolni o\'zgartirishda xatolik');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
            <Card className="w-full max-w-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <CardTitle className="dark:text-gray-100">Parolni yangilash talab etiladi</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                        Xavfsizlik maqsadida, davom etishdan oldin yangi parol o'rnating.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="dark:text-gray-200">Yangi parol</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="dark:text-gray-200">Parolni tasdiqlang</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                            Saqlash va davom etish
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
