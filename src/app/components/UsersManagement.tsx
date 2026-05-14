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
  Check,
  Pencil,
  Wand2,
  AtSign
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
import { TableSkeleton } from './ui/PageLoader';
import { useT } from '../contexts/LanguageContext';

interface UsersManagementProps {
  initialAction?: string;
}

export function UsersManagement({ initialAction }: UsersManagementProps) {
  const { users, departments, createUser, resetUserPassword, toggleUserStatus, deleteUser, restoreUser, permanentDeleteUser, updateUsername, isLoading } = useAdmin();
  const { t } = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'deleted'>('all');
  const [showCreateModal, setShowCreateModal] = useState(initialAction === 'create');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showEditUsernameDialog, setShowEditUsernameDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);

  // Form state
  const [fish, setFish] = useState('');
  const [lavozimi, setLavozimi] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [editUsernameValue, setEditUsernameValue] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  const generateUsername = (fullName: string) => {
    const first = fullName.trim().split(/\s+/)[0]?.toLowerCase() || 'user';
    const stripped = first.replace(/[^a-zA-Z0-9]/g, '');
    return `${stripped}${Math.floor(Math.random() * 100)}`;
  };

  React.useEffect(() => {
    if (!usernameEdited) {
      setUsername(fish.trim() ? generateUsername(fish) : '');
    }
  }, [fish, usernameEdited]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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

  const totalPages = Math.ceil(filteredUsers.length / limit);
  const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      toast.error(t('users.selectDeptError'));
      return;
    }
    if (username.trim().length < 3) {
      toast.error(t('users.loginShort'));
      return;
    }
    const newCredentials = await createUser(fish, lavozimi, departmentId, username);
    if (newCredentials) {
      setCredentials(newCredentials);
      setShowCreateModal(false);
      setShowCredentialsModal(true);
      setFish('');
      setLavozimi('');
      setDepartmentId('');
      setUsername('');
      setUsernameEdited(false);
      toast.success(t('users.createdSuccess'));
    }
  };

  const openEditUsernameDialog = (user: User) => {
    setSelectedUser(user);
    setEditUsernameValue(user.username);
    setShowEditUsernameDialog(true);
  };

  const handleSaveUsername = async () => {
    if (!selectedUser) return;
    if (editUsernameValue.trim().length < 3) {
      toast.error(t('users.loginShort'));
      return;
    }
    if (editUsernameValue.trim() === selectedUser.username) {
      setShowEditUsernameDialog(false);
      return;
    }
    setSavingUsername(true);
    const ok = await updateUsername(selectedUser.id, editUsernameValue.trim());
    setSavingUsername(false);
    if (ok) {
      toast.success(t('users.loginUpdated'));
      setShowEditUsernameDialog(false);
      setSelectedUser(null);
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    const newPassword = await resetUserPassword(userId);
    if (newPassword) {
      setCredentials({ username: userName, password: newPassword });
      setShowCredentialsModal(true);
      toast.success(t('users.passwordUpdated'));
    }
  };

  const handleToggleStatus = (userId: string, currentStatus: string) => {
    toggleUserStatus(userId);
    toast.success(
      currentStatus === 'active'
        ? t('users.disabledMsg')
        : t('users.activated')
    );
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowResetDialog(true);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUser(selectedUser.id);
    setShowDeleteDialog(false);
    setSelectedUser(null);
    toast.success(t('users.movedToTrash'));
  };

  const handleRestoreUser = (id: string) => {
    restoreUser(id);
    toast.success(t('users.restored'));
  };

  const copyToClipboard = async (text: string, field: 'username' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success(t('common.copied'));
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
        toast.success(t('common.copied'));
      } catch (err) {
        toast.error(t('common.copyError'));
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">{t('users.title')}</h2>
          <p className="text-gray-500">{t('users.subtitle')}</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('users.create')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder={t('users.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">{t('common.count')}</span>
            <div className="w-[80px]">
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            size="sm"
            className={statusFilter === 'all' ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white dark:bg-green-600 dark:border-green-600 dark:text-white dark:hover:bg-green-700' : ''}
          >
            {t('common.all')}
          </Button>
          <Button
            variant="outline"
            onClick={() => { setStatusFilter('active'); setPage(1); }}
            size="sm"
            className={statusFilter === 'active' ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white dark:bg-green-600 dark:border-green-600 dark:text-white dark:hover:bg-green-700' : ''}
          >
            {t('common.active')}
          </Button>
          <Button
            variant="outline"
            onClick={() => { setStatusFilter('disabled'); setPage(1); }}
            size="sm"
            className={statusFilter === 'disabled' ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white dark:bg-green-600 dark:border-green-600 dark:text-white dark:hover:bg-green-700' : ''}
          >
            {t('common.disabled')}
          </Button>
          <Button
            variant="outline"
            onClick={() => { setStatusFilter('deleted'); setPage(1); }}
            size="sm"
            className={statusFilter === 'deleted' ? 'bg-orange-100 text-orange-900 hover:bg-orange-200 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800' : ''}
          >
            <Trash2 className="w-3 h-3 mr-2" />
            {t('common.trash')}
          </Button>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">{t('common.no')}</TableHead>
              <TableHead>{t('users.fish')}</TableHead>
              <TableHead>{t('users.lavozimi')}</TableHead>
              <TableHead>{t('users.department')}</TableHead>
              <TableHead>{t('users.login')}</TableHead>
              <TableHead className="w-[150px]">{t('common.status')}</TableHead>
              <TableHead>{t('users.created')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  {statusFilter === 'deleted' ? t('users.trashEmpty') : t('users.notFound')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="text-center text-gray-500">
                    {index + 1 + (page - 1) * limit}
                  </TableCell>
                  <TableCell className="font-medium">{user.fish}</TableCell>
                  <TableCell>{user.lavozimi}</TableCell>
                  <TableCell className="text-gray-500">{user.department || '—'}</TableCell>
                  <TableCell className="font-mono text-sm">{user.username}</TableCell>
                  <TableCell className="w-[150px]">
                    {user.status === 'deleted' ? (
                      <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 justify-center w-[120px]">
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t('common.deleted')}
                      </Badge>
                    ) : (
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="justify-center w-[120px]">
                        {user.status === 'active' ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            {t('common.active')}
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            {t('common.disabled')}
                          </>
                        )}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(user.createdDate).toLocaleDateString('ru-RU')} {new Date(user.createdDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
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
                              {t('common.restore')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (window.confirm(t('dialog.permanentDeleteConfirm'))) {
                                  permanentDeleteUser(user.id);
                                  toast.success(t('users.permanentlyDeleted'));
                                }
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('users.permanentDelete')}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => openEditUsernameDialog(user)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              {t('users.changeLogin')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmResetPassword(user)}>
                              <KeyRound className="w-4 h-4 mr-2" />
                              {t('users.resetPassword')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status)}>
                              {user.status === 'active' ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  {t('users.toggleDisable')}
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  {t('users.toggleActivate')}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(user)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('users.moveToTrash')}
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

        {/* Pagination Controls */}
        <div className="p-4 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm text-gray-500">
            {t('common.page')} {page} / {totalPages || 1}
          </span>
          <Button
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>
      )}

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.createTitle')}</DialogTitle>
            <DialogDescription>
              {t('users.createSub')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fish">{t('users.fish')} *</Label>
              <Input
                id="fish"
                placeholder={t('users.fullNameSample')}
                value={fish}
                onChange={(e) => setFish(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lavozimi">{t('users.lavozimi')} *</Label>
              <Input
                id="lavozimi"
                placeholder={t('users.positionSample')}
                value={lavozimi}
                onChange={(e) => setLavozimi(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">{t('users.department')} *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger id="department">
                  <SelectValue placeholder={t('users.selectDepartment')} />
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
            <div className="space-y-2">
              <Label htmlFor="username">{t('users.login')} *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    placeholder="login"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameEdited(true);
                    }}
                    className="pl-10 font-mono"
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title={t('users.loginAutoGen')}
                  onClick={() => {
                    setUsername(fish.trim() ? generateUsername(fish) : '');
                    setUsernameEdited(false);
                  }}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">{t('users.loginHint')}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {t('common.create')}
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
              {t('dialog.confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <p>
                {t('users.areYouSure')} <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedUser?.fish}</span> {t('users.deleteConfirm')}
              </p>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 text-sm flex items-start gap-2">
                <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('dialog.deleteSoftWarning')}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
              <TriangleAlert className="w-5 h-5" />
              {t('users.resetPwdTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <p>
                {t('users.areYouSure')} <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedUser?.fish}</span> {t('users.resetPwdConfirm')}
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm flex items-start gap-2">
                <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('users.resetPwdWarn')}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser) {
                  handleResetPassword(selectedUser.id, selectedUser.username);
                  setShowResetDialog(false);
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credentials Modal */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">{t('users.credsTitle')}</DialogTitle>
            <DialogDescription>
              {t('users.credsSub')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('users.login')}</Label>
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
              <Label>{t('users.tempPassword')}</Label>
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
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('users.credsWarn')}</span>
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
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Username Dialog */}
      <Dialog open={showEditUsernameDialog} onOpenChange={(o) => { if (!o) { setShowEditUsernameDialog(false); setSelectedUser(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-600" />
              {t('users.changeLoginTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('common.user')}: <span className="font-semibold">{selectedUser?.fish}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newUsername">{t('users.newLogin')}</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="newUsername"
                  value={editUsernameValue}
                  onChange={(e) => setEditUsernameValue(e.target.value)}
                  className="pl-10 font-mono"
                  autoFocus
                />
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
              <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{t('users.changeLoginWarn')}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowEditUsernameDialog(false); setSelectedUser(null); }} disabled={savingUsername}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveUsername} className="bg-blue-600 hover:bg-blue-700" disabled={savingUsername}>
                {savingUsername ? t('users.savePending') : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
