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
import { useT } from '../contexts/LanguageContext';

const menuItems = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'users', labelKey: 'nav.users', icon: Users, path: '/admin/users' },
  { id: 'departments', labelKey: 'nav.departments', icon: Building, path: '/admin/departments' },
  { id: 'indices', labelKey: 'nav.indices', icon: Hash, path: '/admin/indices' },
  { id: 'reports', labelKey: 'nav.reports', icon: FileText, path: '/admin/reports' },
  { id: 'letters', labelKey: 'nav.lettersRegistry', icon: Mail, path: '/admin/letters' },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings, path: '/admin/settings' },
  { id: 'audit', labelKey: 'nav.audit', icon: Shield, path: '/admin/audit', disabled: true },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useT();

  const handleClick = (path: string, disabled?: boolean) => {
    if (!disabled) {
      navigate(path);
      onNavigate?.();
    }
  };

  return (
    <nav className="p-4 space-y-1">
      {menuItems.map((item, idx) => {
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
            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              "text-left text-sm font-medium",
              "animate-in fade-in slide-in-from-left-4 duration-300",
              isActive
                ? "bg-green-600 text-white shadow-md transform translate-x-1"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1",
              item.disabled && "opacity-50 cursor-not-allowed hover:translate-x-0"
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{t(item.labelKey)}</span>
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
