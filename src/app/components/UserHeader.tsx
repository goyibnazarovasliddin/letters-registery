import React from 'react';
import { useUser } from '../contexts/UserContext';
import agrobankLogo from '../../assets/agrobank-logo.webp';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from './ui/dropdown-menu';
import { User, LogOut, Moon, Sun, Bell } from 'lucide-react';

export function UserHeader() {
    const { user, logout } = useUser();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 shadow-sm">
            <div className="flex h-16 items-center justify-between px-6">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 aspect-square bg-white rounded-lg flex items-center justify-center p-1 shadow-sm border">
                        <img src={agrobankLogo} alt="Agrobank Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-lg leading-tight">Markaziy Agrobank</h1>
                        <p className="text-xs text-gray-500">Xodimlar uchun</p>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Bell className="w-5 h-5 text-gray-500" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="rounded-full"
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-2 pl-2 pr-4 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="text-left hidden md:block">
                                    <p className="text-sm font-medium">{user?.fullName}</p>
                                    <p className="text-xs text-gray-500">{user?.position}</p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Mening hisobim</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                                <LogOut className="mr-2 w-4 h-4" />
                                Chiqish
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
