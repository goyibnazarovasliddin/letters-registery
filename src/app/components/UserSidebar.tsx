import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, UserCircle, PlusCircle } from 'lucide-react';
import { cn } from './ui/utils';

export function UserSidebar() {
    const menuItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { label: 'Yangi xat', icon: PlusCircle, path: '/letters/new' },
        { label: 'Mening xatlarim', icon: FileText, path: '/letters' },
        { label: 'Profil', icon: UserCircle, path: '/profile' },
    ];

    return (
        <aside className="w-64 border-r bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] hidden md:block">
            <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/' || item.path === '/letters'} // Exact match for Dashboard and Letters list
                        className={({ isActive }) => cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                            "text-left text-sm font-medium",
                            isActive
                                ? "bg-green-600 text-white shadow-md transform translate-x-1"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1"
                        )}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
