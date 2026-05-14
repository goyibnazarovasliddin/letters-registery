import React, { useState } from 'react';
import {
  Plus,
  MoreVertical,
  Archive,
  Edit2,
  Hash,
  Search,
  Trash2,
  RefreshCcw,
  TriangleAlert
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
import { TableSkeleton } from './ui/PageLoader';
import { useT } from '../contexts/LanguageContext';

interface IndicesManagementProps {
  initialAction?: string;
}

export function IndicesManagement({ initialAction }: IndicesManagementProps) {
  const { indices, addIndex, updateIndex, archiveIndex, activateIndex, deleteIndex, restoreIndex, permanentDeleteIndex, isLoading } = useAdmin();
  const { t } = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'deleted'>('all');
  const [showAddModal, setShowAddModal] = useState(initialAction === 'create');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<{ id: string; code: string; name: string } | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [codeError, setCodeError] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filteredIndices = indices.filter(index => {
    const matchesSearch = index.code.includes(searchQuery) ||
      index.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'deleted') {
      return matchesSearch && index.status === 'deleted';
    }
    const matchesStatus = statusFilter === 'all'
      ? index.status !== 'deleted'
      : index.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredIndices.length / limit);
  const paginatedIndices = filteredIndices.slice((page - 1) * limit, page * limit);

  const validateCode = (value: string): boolean => {
    const pattern = /^\d{2}-\d{2}$/;
    if (!pattern.test(value)) {
      setCodeError('Format: NN-NN (masalan: 01-01)');
      return false;
    }
    setCodeError('');
    return true;
  };

  const handleAddIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCode(code)) return;

    await addIndex(code, name);
    setShowAddModal(false);
    setCode('');
    setName('');
    toast.success(t('toast.indexAdded'));
  };

  const handleEditIndex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndex || !validateCode(code)) return;

    updateIndex(selectedIndex.id, code, name);
    setShowEditModal(false);
    setSelectedIndex(null);
    setCode('');
    setName('');
    toast.success(t('toast.indexUpdated'));
  };

  const handleArchive = () => {
    if (!selectedIndex) return;
    archiveIndex(selectedIndex.id);
    setShowArchiveDialog(false);
    setSelectedIndex(null);
    toast.success(t('toast.indexArchived'));
  };

  const handleActivate = (id: string) => {
    activateIndex(id);
    toast.success(t('toast.indexActivated'));
  };

  const handleDeleteIndex = () => {
    if (!selectedIndex) return;
    deleteIndex(selectedIndex.id);
    setShowDeleteDialog(false);
    setSelectedIndex(null);
    toast.success(t('toast.indexMovedToTrash'));
  };

  const handleRestoreIndex = (id: string) => {
    restoreIndex(id);
    toast.success(t('toast.indexRestored'));
  };

  const openEditModal = (index: { id: string; code: string; name: string }) => {
    setSelectedIndex(index);
    setCode(index.code);
    setName(index.name);
    setShowEditModal(true);
  };

  const openArchiveDialog = (index: { id: string; code: string; name: string }) => {
    setSelectedIndex(index);
    setShowArchiveDialog(true);
  };

  const openDeleteDialog = (index: { id: string; code: string; name: string }) => {
    setSelectedIndex(index);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">{t('indices.title')}</h2>
          <p className="text-gray-500">{t('nav.indices')}</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('dashboard.addIndex')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder={t('common.search')}
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
            onClick={() => { setStatusFilter('archived'); setPage(1); }}
            size="sm"
            className={statusFilter === 'archived' ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white dark:bg-green-600 dark:border-green-600 dark:text-white dark:hover:bg-green-700' : ''}
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

      {/* Indices Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : (
      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">{t('common.no')}</TableHead>
              <TableHead>{t('indices.code')}</TableHead>
              <TableHead>{t('departments.name')}</TableHead>
              <TableHead className="w-[150px]">{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIndices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {statusFilter === 'deleted' ? t('users.trashEmpty') : t('common.notFound')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedIndices.map((index, idx) => (
                <TableRow key={index.id}>
                  <TableCell className="text-center text-gray-500">
                    {idx + 1 + (page - 1) * limit}
                  </TableCell>
                  <TableCell className="font-mono font-semibold">{index.code}</TableCell>
                  <TableCell>{index.name}</TableCell>
                  <TableCell className="w-[150px]">
                    {index.status === 'deleted' ? (
                      <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 justify-center w-[120px]">
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t('common.deleted')}
                      </Badge>
                    ) : (
                      <Badge variant={index.status === 'active' ? 'default' : 'secondary'} className="justify-center w-[120px]">
                        {index.status === 'active' ? t('common.active') : t('common.archived')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {index.status === 'deleted' ? (
                          <>
                            <DropdownMenuItem onClick={() => handleRestoreIndex(index.id)}>
                              <RefreshCcw className="w-4 h-4 mr-2" />
                              {t('common.restore')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (window.confirm(t('dialog.permanentDeleteConfirm'))) {
                                  permanentDeleteIndex(index.id);
                                  toast.success(t('common.deleted'));
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
                            <DropdownMenuItem onClick={() => openEditModal(index)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            {index.status === 'active' ? (
                              <DropdownMenuItem onClick={() => openArchiveDialog(index)}>
                                <Archive className="w-4 h-4 mr-2" />
                                {t('common.archive')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(index.id)}>
                                <Hash className="w-4 h-4 mr-2" />
                                {t('common.activate')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(index)}
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

      {/* Add Index Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('indices.add')}</DialogTitle>
            <DialogDescription>
              {t('indices.namePlaceholder')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddIndex} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('indices.code')} *</Label>
              <Input
                id="code"
                placeholder={t('indices.codePlaceholder')}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (e.target.value) validateCode(e.target.value);
                }}
                required
                className={codeError ? 'border-red-500' : ''}
              />
              {codeError && (
                <p className="text-sm text-red-500">{codeError}</p>
              )}
              <p className="text-xs text-gray-500">Format: NN-NN (01-01, 05-02)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('departments.name')} *</Label>
              <Input
                id="name"
                placeholder={t('indices.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setCode('');
                  setName('');
                  setCodeError('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {t('common.add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Index Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('indices.edit')}</DialogTitle>
            <DialogDescription>
              {t('indices.namePlaceholder')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditIndex} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">{t('indices.code')} *</Label>
              <Input
                id="edit-code"
                placeholder={t('indices.codePlaceholder')}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (e.target.value) validateCode(e.target.value);
                }}
                required
                className={codeError ? 'border-red-500' : ''}
              />
              {codeError && (
                <p className="text-sm text-red-500">{codeError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('departments.name')} *</Label>
              <Input
                id="edit-name"
                placeholder={t('indices.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedIndex(null);
                  setCode('');
                  setName('');
                  setCodeError('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.confirmArchive')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('users.areYouSure')} <span className="font-semibold">{selectedIndex?.code}</span> {t('indices.archiveConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedIndex(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {t('common.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                {t('users.areYouSure')} <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedIndex?.code} - {selectedIndex?.name}</span> {t('indices.deleteConfirm')}
              </p>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 text-sm flex items-start gap-2">
                <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('dialog.deleteSoftWarning')}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedIndex(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIndex} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
