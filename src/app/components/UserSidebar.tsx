import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, UserCircle, PlusCircle, Menu } from 'lucide-react';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from './ui/sheet';
import { useT } from '../contexts/LanguageContext';

const menuItems = [
    { labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/' },
    { labelKey: 'nav.newLetter', icon: PlusCircle, path: '/letters/new' },
    { labelKey: 'nav.myLetters', icon: FileText, path: '/letters' },
    { labelKey: 'nav.profile', icon: UserCircle, path: '/profile' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const { t } = useT();
    return (
        <nav className="p-4 space-y-1">
            {menuItems.map((item, idx) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/' || item.path === '/letters'}
                    onClick={onNavigate}
                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                    className={({ isActive }) => cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        "text-left text-sm font-medium",
                        "animate-in fade-in slide-in-from-left-4 duration-300",
                        isActive
                            ? "bg-green-600 text-white shadow-md transform translate-x-1"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1"
                    )}
                >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export function UserSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Menu className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 dark:bg-gray-900">
                    <SidebarContent onNavigate={() => setOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 border-r bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
                <SidebarContent />
            </aside>
        </>
    );
}
