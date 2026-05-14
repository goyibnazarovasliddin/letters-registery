import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Index, Letter, Credentials, Department } from '../types/admin';
import { api } from '../services/api/client';
import { toast } from 'sonner';
import { useT } from './LanguageContext';

interface AdminContextType {
  isAuthenticated: boolean;
  adminName: string;
  users: User[];
  indices: Index[];
  letters: Letter[];
  departments: Department[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (fish: string, lavozimi: string, departmentId: string, username?: string) => Promise<Credentials | null>;
  resetUserPassword: (userId: string) => Promise<string>;
  toggleUserStatus: (userId: string) => void;
  updateUsername: (userId: string, newUsername: string) => Promise<boolean>;
  addIndex: (code: string, name: string) => Promise<void>;
  updateIndex: (id: string, code: string, name: string) => Promise<void>;
  archiveIndex: (id: string) => void;
  activateIndex: (id: string) => void;
  addDepartment: (name: string, description: string) => Promise<void>;
  updateDepartment: (id: string, name: string, description: string) => Promise<void>;
  archiveDepartment: (id: string) => void;
  activateDepartment: (id: string) => void;
  deleteUser: (id: string) => Promise<void>;
  deleteLetter: (id: string) => Promise<boolean>;
  restoreUser: (id: string) => void;
  deleteIndex: (id: string) => Promise<void>;
  restoreIndex: (id: string) => void;
  deleteDepartment: (id: string) => Promise<void>;
  restoreDepartment: (id: string) => void;
  permanentDeleteUser: (id: string) => void;
  permanentDeleteIndex: (id: string) => void;
  permanentDeleteDepartment: (id: string) => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('admin_token') ? true : false;
  });
  const [adminName, setAdminName] = useState(() => {
    // Ideally decode JWT to get name
    return 'Administrator';
  });

  const { t } = useT();
  const [users, setUsers] = useState<User[]>([]);
  const [indices, setIndices] = useState<Index[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const isLoading = isAuthenticated && !hasLoadedOnce;

  const refreshData = async () => {
    try {
      const [u, i, d] = await Promise.all([
        api.users.list(),
        api.indices.list(),
        api.departments.list()
      ]);

      // Map API users to Admin User Type
      const mappedUsers = u.map((user: any) => ({
        id: user.id,
        fish: user.fullName,
        lavozimi: user.position,
        department: typeof user.department === 'string' ? user.department : user.department?.name,
        departmentId: user.departmentId,
        username: user.username,
        status: user.status,
        createdDate: user.createdAt
      }));
      setUsers(mappedUsers);
      setIndices(i);
      setDepartments(d);

      // Letters - fetch all if API supports it
      const l = await api.letters.list({ limit: 100 });
      const mappedLetters = l.items.map((letter: any) => ({
        id: letter.id,
        letterNumber: letter.letterNumber,
        letterDate: letter.letterDate,
        indexCode: letter.indexCode || '',
        indexName: letter.indexName || '',
        status: letter.status,
        recipient: letter.recipient,
        subject: letter.subject,
        summary: letter.summary || '',
        pageCount: letter.pageCount || 0,
        attachmentPageCount: letter.attachmentPageCount || 0,
        userFish: letter.userFish,
        userPosition: letter.userPosition || 'Lavozim kiritilmagan',
        createdDate: letter.createdDate,
        updatedDate: letter.updatedDate,
        registeredAt: letter.registeredAt,
        files: letter.files, // Keep raw files if needed, or:
        xatFile: letter.files?.xat?.fileName,
        xatFileId: letter.files?.xat?.id,
        ilovaFiles: letter.files?.ilova?.map((f: any) => f.fileName),
        ilovaFileIds: letter.files?.ilova?.map((f: any) => f.id)
      }));
      setLetters(mappedLetters);

    } catch (e) {
      console.error("Failed to fetch admin data", e);
    } finally {
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.auth.login(username, password);
      if (res.user.role !== 'admin') {
        toast.error(t('toast.adminOnly'));
        return false;
      }
      localStorage.setItem('admin_token', res.accessToken);
      setIsAuthenticated(true);
      refreshData();
      return true;
    } catch (e) {
      toast.error(t('toast.loginError'));
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setHasLoadedOnce(false);
    localStorage.removeItem('admin_token');
  };

  const createUser = async (fish: string, lavozimi: string, departmentId: string, customUsername?: string): Promise<Credentials | null> => {
    try {
      const username = (customUsername && customUsername.trim())
        ? customUsername.trim()
        : fish.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 100);
      const password = 'Password@123';

      await api.users.create({
        username,
        password,
        fullName: fish,
        position: lavozimi,
        departmentId,
        role: 'user'
      });

      await refreshData();
      return { username, password };
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Foydalanuvchi yaratishda xatolik';
      toast.error(msg);
      return null;
    }
  };

  const updateUsername = async (userId: string, newUsername: string): Promise<boolean> => {
    try {
      await api.users.update(userId, { username: newUsername });
      await refreshData();
      return true;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Loginni o\'zgartirishda xatolik';
      toast.error(msg);
      return false;
    }
  };

  const addIndex = async (code: string, name: string) => {
    try {
      await api.indices.create({ code, name });
      await refreshData();
    } catch (e) {
      toast.error(t('toast.genericError'));
    }
  };

  const updateIndex = async (id: string, code: string, name: string) => {
    try {
      await api.indices.update(id, { code, name });
      await refreshData();
    } catch (e) {
      toast.error(t('toast.genericError'));
    }
  };

  const deleteIndex = async (id: string) => {
    try {
      await api.indices.delete(id);
      await refreshData();
    } catch (e) {
      toast.error(t('toast.genericError'));
    }
  };

  const addDepartment = async (name: string, description: string) => {
    try {
      await api.departments.create({ name, description });
      await refreshData();
    } catch (e) {
      toast.error(t('toast.genericError'));
    }
  };

  const updateDepartment = async (id: string, name: string, description: string) => {
    try {
      await api.departments.update(id, { name, description });
      await refreshData();
    } catch (e) {
      toast.error(t('toast.genericError'));
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      await api.departments.delete(id);
      await refreshData();
    } catch (e) {
      toast.error(t('toast.genericError'));
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.users.delete(id);
      await refreshData();
    } catch (e) {
      toast.error(t('toast.genericError'));
    }
  };

  const deleteLetter = async (id: string): Promise<boolean> => {
    try {
      await api.letters.delete(id);
      await refreshData();
      return true;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Xatni o\'chirishda xatolik';
      toast.error(msg);
      return false;
    }
  };

  // Stubs for currently unsupported/complex features
  const resetUserPassword = async (userId: string): Promise<string> => {
    try {
      // We need to extend our client first, or hack it here. 
      // Since I cannot check client.ts right now without tool, I assume I can update it. 
      // Actually, let's just make a raw request or update client.ts. 
      // I will update client.ts in next step. For now, I'll write the context logic.
      const response = await api.users.resetPassword(userId);
      return response.newPassword;
    } catch (e) {
      toast.error(t('toast.passwordResetError'));
      return "";
    }
  };
  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      await api.users.updateStatus(userId, newStatus);
      await refreshData();
    } catch (e) {
      toast.error(t('toast.statusChangeError'));
    }
  };

  const restoreUser = async (id: string) => {
    try {
      await api.users.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error(t('toast.restoreError'));
    }
  };

  const permanentDeleteUser = async (id: string) => {
    try {
      await api.users.permanentDelete(id);
      await refreshData();
    } catch (e) {
      toast.error(t('toast.permanentDeleteError'));
    }
  };

  const archiveIndex = async (id: string) => {
    try {
      await api.indices.updateStatus(id, 'archived');
      await refreshData();
    } catch (e) {
      toast.error(t('toast.archiveError'));
    }
  };

  const activateIndex = async (id: string) => {
    try {
      await api.indices.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error(t('toast.activateError'));
    }
  };

  const restoreIndex = async (id: string) => {
    try {
      await api.indices.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error(t('toast.restoreError'));
    }
  };

  const permanentDeleteIndex = async (id: string) => {
    try {
      await api.indices.permanentDelete(id);
      await refreshData();
    } catch (e) {
      toast.error(t('toast.permanentDeleteError'));
    }
  };

  const archiveDepartment = async (id: string) => {
    try {
      await api.departments.updateStatus(id, 'archived');
      await refreshData();
    } catch (e) {
      toast.error(t('toast.archiveError'));
    }
  };

  const activateDepartment = async (id: string) => {
    try {
      await api.departments.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error(t('toast.activateError'));
    }
  };

  const restoreDepartment = async (id: string) => {
    try {
      await api.departments.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error(t('toast.restoreError'));
    }
  };

  const permanentDeleteDepartment = async (id: string) => {
    try {
      await api.departments.permanentDelete(id);
      await refreshData();
    } catch (e) {
      toast.error(t('toast.permanentDeleteError'));
    }
  };

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      adminName,
      users,
      indices,
      letters,
      departments,
      login,
      logout,
      createUser,
      resetUserPassword,
      toggleUserStatus,
      updateUsername,
      addIndex,
      updateIndex,
      archiveIndex,
      activateIndex,
      addDepartment,
      updateDepartment,
      archiveDepartment,
      activateDepartment,
      deleteUser,
      deleteLetter,
      restoreUser,
      deleteIndex,
      restoreIndex,
      deleteDepartment,
      restoreDepartment,
      permanentDeleteUser,
      permanentDeleteIndex,
      permanentDeleteDepartment,
      refreshData,
      isLoading
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
