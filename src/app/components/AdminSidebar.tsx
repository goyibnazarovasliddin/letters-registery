import React from 'react';
import {
  LayoutDashboard,
  Users,
  Hash,
  FileText,
  Mail,
  Shield,
  ChevronRight,
  Building,
  Settings
} from 'lucide-react';
import { cn } from './ui/utils';

import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'users', label: 'Foydalanuvchilar', icon: Users, path: '/admin/users' },
  { id: 'departments', label: 'Bo\'limlar', icon: Building, path: '/admin/departments' },
  { id: 'indices', label: 'Indekslar', icon: Hash, path: '/admin/indices' },
  { id: 'reports', label: 'Hisobotlar', icon: FileText, path: '/admin/reports' },
  { id: 'letters', label: 'Xatlar reyestri', icon: Mail, path: '/admin/letters' },
  { id: 'settings', label: 'Sozlamalar', icon: Settings, path: '/admin/settings' },
  { id: 'audit', label: 'Audit log', icon: Shield, path: '/admin/audit', disabled: true },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-64 border-r bg-gray-50 dark:bg-gray-900 h-screen overflow-hidden flex-shrink-0">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.id === 'dashboard' && location.pathname === '/admin/');

          return (
            <button
              key={item.id}
              data-nav="true"
              data-path={item.path}
              data-nav-item="true"
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                "text-left text-sm font-medium",
                isActive
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
