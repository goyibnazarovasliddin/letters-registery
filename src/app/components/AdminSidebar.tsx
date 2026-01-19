import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Hash,
  FileText,
  Mail,
  Shield,
  ChevronRight,
  Building,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from './ui/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './ui/sheet';

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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (path: string, disabled?: boolean) => {
    if (!disabled) {
      navigate(path);
      onNavigate?.();
    }
  };

  return (
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
            onClick={() => handleClick(item.path, item.disabled)}
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
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 dark:bg-gray-900">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-gray-50 dark:bg-gray-900 h-screen overflow-hidden flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
