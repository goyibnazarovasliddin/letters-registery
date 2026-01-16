import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';

export function UserLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useUser();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acceptedTerms) {
            toast.error('Iltimos, foydalanish shartlarini qabul qiling');
            return;
        }

        setIsLoading(true);
        try {
            await login(username, password);
            // Toast handled or not needed if redirecting immediately
            // toast.success('Xush kelibsiz!');
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Login yoki parol noto\'g\'ri';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border dark:border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Xodimlar uchun kirish</h1>
                    <p className="text-gray-500 dark:text-gray-400">Iltimos, o'z hisobingizga kiring</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="dark:text-gray-200">Login</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="dark:text-gray-200">Parol</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="terms"
                            checked={acceptedTerms}
                            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                            disabled={isLoading}
                            className="dark:border-green-500 dark:data-[state=checked]:bg-green-600 dark:data-[state=checked]:text-white"
                        />
                        <div className="text-sm flex flex-wrap items-center gap-1">
                            <Label htmlFor="terms" className="font-normal cursor-pointer dark:text-gray-300">
                                Men
                            </Label>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <span className="text-green-600 dark:text-green-400 hover:underline cursor-pointer">foydalanish shartlarini</span>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                    <DialogHeader>
                                        <DialogTitle className="dark:text-gray-100">Foydalanish shartlari</DialogTitle>
                                        <DialogDescription className="dark:text-gray-400">
                                            Tizimdan foydalanish qoidalari va shartlari
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                                        <p><strong className="dark:text-gray-200">1. Umumiy qoidalar</strong></p>
                                        <p>Ushbu tizim bank xodimlari uchun ichki foydalanishga mo'ljallangan. Tizim orqali amalga oshirilgan har bir harakat nazorat qilinadi.</p>

                                        <p><strong className="dark:text-gray-200">2. Xavfsizlik</strong></p>
                                        <p>Login va parolingizni uchinchi shaxslarga bermang. Kompyuterni qarovsiz qoldirmang.</p>

                                        <p><strong className="dark:text-gray-200">3. Javobgarlik</strong></p>
                                        <p>Kiritilgan ma'lumotlarning to'g'riligi uchun xodim shaxsan javobgardir.</p>

                                        <p><strong className="dark:text-gray-200">4. Maxfiylik</strong></p>
                                        <p>Bank siri hisoblangan ma'lumotlarni oshkor qilish qonun bilan ta'qiqlanadi.</p>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Label htmlFor="terms" className="font-normal cursor-pointer dark:text-gray-300">
                                qabul qilaman
                            </Label>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-800"
                        disabled={isLoading || !acceptedTerms}
                    >
                        {isLoading ? 'Kirilmoqda...' : 'Kirish'}
                    </Button>
                </form>

                <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                    <p>Demo: user / user123</p>
                    <p>Force Change: newuser / user123</p>
                </div>
            </div>
        </div>
    );
}
