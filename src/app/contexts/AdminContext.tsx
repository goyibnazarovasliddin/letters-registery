import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Index, Letter, Credentials, Department } from '../types/admin';
import { api } from '../services/api/client';
import { toast } from 'sonner';

interface AdminContextType {
  isAuthenticated: boolean;
  adminName: string;
  users: User[];
  indices: Index[];
  letters: Letter[];
  departments: Department[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (fish: string, lavozimi: string, departmentId: string) => Promise<Credentials | null>;
  resetUserPassword: (userId: string) => Promise<string>;
  toggleUserStatus: (userId: string) => void;
  addIndex: (code: string, name: string) => Promise<void>;
  updateIndex: (id: string, code: string, name: string) => Promise<void>;
  archiveIndex: (id: string) => void;
  activateIndex: (id: string) => void;
  addDepartment: (name: string, description: string) => Promise<void>;
  updateDepartment: (id: string, name: string, description: string) => Promise<void>;
  archiveDepartment: (id: string) => void;
  activateDepartment: (id: string) => void;
  deleteUser: (id: string) => Promise<void>;
  restoreUser: (id: string) => void;
  deleteIndex: (id: string) => Promise<void>;
  restoreIndex: (id: string) => void;
  deleteDepartment: (id: string) => Promise<void>;
  restoreDepartment: (id: string) => void;
  permanentDeleteUser: (id: string) => void;
  permanentDeleteIndex: (id: string) => void;
  permanentDeleteDepartment: (id: string) => void;
  refreshData: () => Promise<void>;
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

  const [users, setUsers] = useState<User[]>([]);
  const [indices, setIndices] = useState<Index[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

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
        files: letter.files, // Keep raw files if needed, or:
        xatFile: letter.files?.xat?.fileName,
        xatFileId: letter.files?.xat?.id,
        ilovaFiles: letter.files?.ilova?.map((f: any) => f.fileName),
        ilovaFileIds: letter.files?.ilova?.map((f: any) => f.id)
      }));
      setLetters(mappedLetters);

    } catch (e) {
      console.error("Failed to fetch admin data", e);
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
        toast.error('Faqat administratorlar kirishi mumkin');
        return false;
      }
      localStorage.setItem('admin_token', res.accessToken);
      setIsAuthenticated(true);
      refreshData();
      return true;
    } catch (e) {
      toast.error('Login yoki parol xato');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_token');
  };

  const createUser = async (fish: string, lavozimi: string, departmentId: string): Promise<Credentials | null> => {
    try {
      // Generate temporary credentials
      const username = fish.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 100);
      const password = 'Password@123'; // Temporary

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
    } catch (e) {
      toast.error('Foydalanuvchi yaratishda xatolik');
      return null;
    }
  };

  const addIndex = async (code: string, name: string) => {
    try {
      await api.indices.create({ code, name });
      await refreshData();
    } catch (e) {
      toast.error("Xatolik");
    }
  };

  const updateIndex = async (id: string, code: string, name: string) => {
    try {
      await api.indices.update(id, { code, name });
      await refreshData();
    } catch (e) {
      toast.error("Xatolik");
    }
  };

  const deleteIndex = async (id: string) => {
    try {
      await api.indices.delete(id);
      await refreshData();
    } catch (e) {
      toast.error("Xatolik");
    }
  };

  const addDepartment = async (name: string, description: string) => {
    try {
      await api.departments.create({ name, description });
      await refreshData();
    } catch (e) {
      toast.error("Xatolik");
    }
  };

  const updateDepartment = async (id: string, name: string, description: string) => {
    try {
      await api.departments.update(id, { name, description });
      await refreshData();
    } catch (e) {
      toast.error("Xatolik");
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      await api.departments.delete(id);
      await refreshData();
    } catch (e) {
      toast.error("Xatolik");
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.users.delete(id);
      await refreshData();
    } catch (e) {
      toast.error("Xatolik");
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
      toast.error("Parolni yangilashda xatolik");
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
      toast.error("Statusni o'zgartirishda xatolik");
    }
  };

  const restoreUser = async (id: string) => {
    try {
      await api.users.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error("Foydalanuvchini tiklashda xatolik");
    }
  };

  const permanentDeleteUser = async (id: string) => {
    try {
      await api.users.permanentDelete(id);
      await refreshData();
    } catch (e) {
      toast.error("Butunlay o'chirishda xatolik");
    }
  };

  const archiveIndex = async (id: string) => {
    try {
      await api.indices.updateStatus(id, 'archived');
      await refreshData();
    } catch (e) {
      toast.error("Arxivlashda xatolik");
    }
  };

  const activateIndex = async (id: string) => {
    try {
      await api.indices.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error("Faollashtirishda xatolik");
    }
  };

  const restoreIndex = async (id: string) => {
    try {
      await api.indices.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error("Tiklashda xatolik");
    }
  };

  const permanentDeleteIndex = async (id: string) => {
    try {
      await api.indices.permanentDelete(id);
      await refreshData();
    } catch (e) {
      toast.error("Butunlay o'chirishda xatolik");
    }
  };

  const archiveDepartment = async (id: string) => {
    try {
      await api.departments.updateStatus(id, 'archived');
      await refreshData();
    } catch (e) {
      toast.error("Arxivlashda xatolik");
    }
  };

  const activateDepartment = async (id: string) => {
    try {
      await api.departments.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error("Faollashtirishda xatolik");
    }
  };

  const restoreDepartment = async (id: string) => {
    try {
      await api.departments.updateStatus(id, 'active');
      await refreshData();
    } catch (e) {
      toast.error("Tiklashda xatolik");
    }
  };

  const permanentDeleteDepartment = async (id: string) => {
    try {
      await api.departments.permanentDelete(id);
      await refreshData();
    } catch (e) {
      toast.error("Butunlay o'chirishda xatolik");
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
      addIndex,
      updateIndex,
      archiveIndex,
      activateIndex,
      addDepartment,
      updateDepartment,
      archiveDepartment,
      activateDepartment,
      deleteUser,
      restoreUser,
      deleteIndex,
      restoreIndex,
      deleteDepartment,
      restoreDepartment,
      permanentDeleteUser,
      permanentDeleteIndex,
      permanentDeleteDepartment,
      refreshData
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
