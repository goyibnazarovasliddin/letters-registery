import React, { useState } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  UserCheck,
  UserX,
  KeyRound,
  Trash2,
  RefreshCcw,
  TriangleAlert,
  Copy,
  Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useAdmin } from '../contexts/AdminContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Credentials, User } from '../types/admin';

interface UsersManagementProps {
  initialAction?: string;
}

export function UsersManagement({ initialAction }: UsersManagementProps) {
  const { users, departments, createUser, resetUserPassword, toggleUserStatus, deleteUser, restoreUser, permanentDeleteUser } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'deleted'>('all');
  const [showCreateModal, setShowCreateModal] = useState(initialAction === 'create');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);

  // Form state
  const [fish, setFish] = useState('');
  const [lavozimi, setLavozimi] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lavozimi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'deleted') {
      return matchesSearch && user.status === 'deleted';
    }
    // For other tabs, hide deleted items
    const matchesStatus = statusFilter === 'all'
      ? user.status !== 'deleted'
      : user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      toast.error('Bo\'limni tanlang');
      return;
    }
    const newCredentials = await createUser(fish, lavozimi, departmentId);
    if (newCredentials) {
      setCredentials(newCredentials);
      setShowCreateModal(false);
      setShowCredentialsModal(true);
      setFish('');
      setLavozimi('');
      setDepartmentId('');
      toast.success('Foydalanuvchi muvaffaqiyatli yaratildi');
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    const newPassword = await resetUserPassword(userId);
    if (newPassword) {
      setCredentials({ username: userName, password: newPassword });
      setShowCredentialsModal(true);
      toast.success('Parol yangilandi');
    }
  };

  const handleToggleStatus = (userId: string, currentStatus: string) => {
    toggleUserStatus(userId);
    toast.success(
      currentStatus === 'active'
        ? 'Foydalanuvchi o\'chirildi'
        : 'Foydalanuvchi faollashtirildi'
    );
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUser(selectedUser.id);
    setShowDeleteDialog(false);
    setSelectedUser(null);
    toast.success('Foydalanuvchi savatchaga o\'tkazildi');
  };

  const handleRestoreUser = (id: string) => {
    restoreUser(id);
    toast.success('Foydalanuvchi tiklandi');
  };

  const copyToClipboard = async (text: string, field: 'username' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success('Nusxalandi');
    } catch (err) {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast.success('Nusxalandi');
      } catch (err) {
        toast.error('Nusxalashda xatolik');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Foydalanuvchilar</h2>
          <p className="text-gray-500">Tizim foydalanuvchilarini boshqarish</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Foydalanuvchi yaratish
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="F.I.Sh., lavozim yoki login bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            Barchasi
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
            size="sm"
          >
            Faol
          </Button>
          <Button
            variant={statusFilter === 'disabled' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('disabled')}
            size="sm"
          >
            O'chirilgan
          </Button>
          <Button
            variant={statusFilter === 'deleted' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('deleted')}
            size="sm"
            className={statusFilter === 'deleted' ? 'bg-orange-100 text-orange-900 hover:bg-orange-200 border-orange-200' : ''}
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Savatcha
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>F.I.Sh.</TableHead>
              <TableHead>Lavozimi</TableHead>
              <TableHead>Bo'lim</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Yaratilgan</TableHead>
              <TableHead className="text-right">Harakatlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {statusFilter === 'deleted' ? 'Savatcha bo\'sh' : 'Foydalanuvchilar topilmadi'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fish}</TableCell>
                  <TableCell>{user.lavozimi}</TableCell>
                  <TableCell className="text-gray-500">{user.department || '—'}</TableCell>
                  <TableCell className="font-mono text-sm">{user.username}</TableCell>
                  <TableCell>
                    {user.status === 'deleted' ? (
                      <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">
                        <Trash2 className="w-3 h-3 mr-1" />
                        O'chirilgan
                      </Badge>
                    ) : (
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Faol
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            O'chirilgan
                          </>
                        )}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500">{user.createdDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.status === 'deleted' ? (
                          <>
                            <DropdownMenuItem onClick={() => handleRestoreUser(user.id)}>
                              <RefreshCcw className="w-4 h-4 mr-2" />
                              Tiklash
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (window.confirm("Haqiqatdan ham bu foydalanuvchini butunlay o'chirmoqchimisiz?")) {
                                  permanentDeleteUser(user.id);
                                  toast.success("Foydalanuvchi butunlay o'chirildi");
                                }
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Butunlay o'chirish
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleResetPassword(user.id, user.username)}>
                              <KeyRound className="w-4 h-4 mr-2" />
                              Parolni yangilash
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status)}>
                              {user.status === 'active' ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  O'chirish
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Faollashtirish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(user)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              O'chirish (Savatchaga)
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi foydalanuvchi yaratish</DialogTitle>
            <DialogDescription>
              Foydalanuvchi ma'lumotlarini kiriting. Login va parol avtomatik yaratiladi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fish">F.I.Sh. *</Label>
              <Input
                id="fish"
                placeholder="Karimov Aziz Bahromovich"
                value={fish}
                onChange={(e) => setFish(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lavozimi">Lavozimi *</Label>
              <Input
                id="lavozimi"
                placeholder="Bosh hisobchi"
                value={lavozimi}
                onChange={(e) => setLavozimi(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Bo'lim *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Bo'limni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {departments
                    .filter(d => d.status === 'active')
                    .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Yaratish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <TriangleAlert className="w-5 h-5" />
              O'chirishni tasdiqlang
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <p>
                Siz haqiqatdan ham <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedUser?.fish}</span> ma'lumotlarini o'chirmoqchimisiz?
              </p>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 text-sm">
                ⚠️ O'chirilgan ma'lumotlar savatchaga tushadi va <strong>30 kundan keyin</strong> butunlay o'chib ketadi.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credentials Modal */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">Kirish ma'lumotlari yaratildi</DialogTitle>
            <DialogDescription>
              Quyidagi login va parolni xavfsiz saqlang. Parol birinchi kirishda almashtirilishi kerak.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Login</Label>
              <div className="flex gap-2">
                <Input
                  value={credentials?.username || ''}
                  readOnly
                  className="font-mono dark:bg-gray-800 dark:text-white"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(credentials?.username || '', 'username')}
                >
                  {copiedField === 'username' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vaqtinchalik parol</Label>
              <div className="flex gap-2">
                <Input
                  value={credentials?.password || ''}
                  readOnly
                  className="font-mono dark:bg-gray-800 dark:text-white"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(credentials?.password || '', 'password')}
                >
                  {copiedField === 'password' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Bu ma'lumotlarni foydalanuvchiga yuboring. Parol birinchi kirishda almashtiriladi.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setShowCredentialsModal(false);
                setCredentials(null);
                setCopiedField(null);
              }}
            >
              Yopish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
