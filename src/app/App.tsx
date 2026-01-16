import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
    return <div className="min-h-screen flex items-center justify-center">Yuklanmoqda...</div>; // Or a proper spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

import { useSearchParams } from 'react-router-dom';

function AdminPanel() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UsersManagementWithParams />} />
              <Route path="departments" element={<DepartmentsManagementWithParams />} />
              <Route path="indices" element={<IndicesManagementWithParams />} />
              <Route path="reports" element={<Reports />} />
              <Route path="letters" element={<LettersRegistry />} />
              <Route path="audit" element={
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold mb-2">Audit Log</h2>
                  <p className="text-gray-500">Bu sahifa hozircha ishlab chiqilmoqda</p>
                </div>
              } />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

// Wrapper components to inject action from URL search params
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

export default function App() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <UserProvider>
          <Routes>
            {/* User Routes */}
            <Route path="/login" element={<UserLogin />} />
            <Route path="/force-change-password" element={
              <ProtectedUserRoute>
                <ForceChangePassword />
              </ProtectedUserRoute>
            } />
            <Route path="/" element={
              <ProtectedUserRoute>
                <UserPortal />
              </ProtectedUserRoute>
            }>
              <Route index element={<UserDashboard />} />
              <Route path="letters" element={<LettersList />} />
              <Route path="letters/new" element={<LetterCreate />} />
              <Route path="letters/:id" element={<LetterDetails />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={
              <ProtectedAdminRoute>
                <AdminPanel />
              </ProtectedAdminRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </UserProvider>
      </AdminProvider>
    </ThemeProvider>
  );
}
