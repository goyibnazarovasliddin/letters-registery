import React from 'react';
import { Building2, LogOut, Moon, Sun, User } from 'lucide-react';
import { Button } from './ui/button';
import { useAdmin } from '../contexts/AdminContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function AdminHeader() {
  const { adminName, logout } = useAdmin();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Central Agrobank</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{adminName}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
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
