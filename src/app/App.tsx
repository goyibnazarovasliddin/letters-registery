import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useLocation, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { AdminLogin } from './components/AdminLogin';
import { AdminHeader } from './components/AdminHeader';
import { AdminSidebar } from './components/AdminSidebar';
import { Dashboard } from './components/Dashboard';
import { UsersManagement } from './components/UsersManagement';
import { IndicesManagement } from './components/IndicesManagement';
import { Reports } from './components/Reports';
import { LettersRegistry } from './components/LettersRegistry';
import { DepartmentsManagement } from './components/DepartmentsManagement';
import { Toaster } from './components/ui/sonner';

import { UserLogin } from './components/UserLogin';
import { UserPortal } from './components/UserPortal';
import { UserDashboard } from './pages/UserDashboard';
import { ForceChangePassword } from './components/ForceChangePassword';
import { LettersList } from './pages/LettersList';
import { LetterCreate } from './pages/LetterCreate';
import { LetterDetails } from './pages/LetterDetails';
import { UserProfile } from './pages/UserProfile';
import { SettingsPage } from './pages/SettingsPage';
import { useSearchParams } from 'react-router-dom';

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdmin();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function ProtectedUserRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Yuklanmoqda...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AdminLayout() {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <AdminHeader />
      <div className="flex h-[calc(100vh-4rem)]" style={{ height: 'calc(100vh - 4rem)' }}>
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function UsersManagementWithParams() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') || undefined;
  return <UsersManagement initialAction={action} />;
}

function DepartmentsManagementWithParams() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') || undefined;
  return <DepartmentsManagement initialAction={action} />;
}

function IndicesManagementWithParams() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') || undefined;
  return <IndicesManagement initialAction={action} />;
}

function RootProviders() {
  return (
    <AdminProvider>
      <UserProvider>
        <Outlet />
        <Toaster position="top-right" richColors />
      </UserProvider>
    </AdminProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <RootProviders />,
    children: [
      {
        path: "/login",
        element: <UserLogin />,
      },
      {
        path: "/force-change-password",
        element: (
          <ProtectedUserRoute>
            <ForceChangePassword />
          </ProtectedUserRoute>
        ),
      },
      {
        path: "/",
        element: (
          <ProtectedUserRoute>
            <UserPortal />
          </ProtectedUserRoute>
        ),
        children: [
          {
            index: true,
            element: <UserDashboard />,
          },
          {
            path: "letters",
            element: <LettersList />,
          },
          {
            path: "letters/new",
            element: <LetterCreate />,
          },
          {
            path: "letters/edit/:id",
            element: <LetterCreate />,
          },
          {
            path: "letters/:id",
            element: <LetterDetails />,
          },
          {
            path: "profile",
            element: <UserProfile />,
          },
        ],
      },
      {
        path: "/admin/login",
        element: <AdminLogin />,
      },
      {
        path: "/admin",
        element: (
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "users",
            element: <UsersManagementWithParams />,
          },
          {
            path: "departments",
            element: <DepartmentsManagementWithParams />,
          },
          {
            path: "indices",
            element: <IndicesManagementWithParams />,
          },
          {
            path: "reports",
            element: <Reports />,
          },
          {
            path: "letters",
            element: <LettersRegistry />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
          {
            path: "audit",
            element: (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-2">Audit Log</h2>
                <p className="text-gray-500">Bu sahifa hozircha ishlab chiqilmoqda</p>
              </div>
            ),
          },
          {
            path: "*",
            element: <Navigate to="/admin" replace />,
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
