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
import { Label } from './ui/label';
import { toast } from 'sonner';

interface IndicesManagementProps {
  initialAction?: string;
}

export function IndicesManagement({ initialAction }: IndicesManagementProps) {
  const { indices, addIndex, updateIndex, archiveIndex, activateIndex, deleteIndex, restoreIndex, permanentDeleteIndex } = useAdmin();
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
    toast.success('Indeks qo\'shildi');
  };

  const handleEditIndex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndex || !validateCode(code)) return;

    updateIndex(selectedIndex.id, code, name);
    setShowEditModal(false);
    setSelectedIndex(null);
    setCode('');
    setName('');
    toast.success('Indeks yangilandi');
  };

  const handleArchive = () => {
    if (!selectedIndex) return;
    archiveIndex(selectedIndex.id);
    setShowArchiveDialog(false);
    setSelectedIndex(null);
    toast.success('Indeks arxivlandi');
  };

  const handleActivate = (id: string) => {
    activateIndex(id);
    toast.success('Indeks faollashtirildi');
  };

  const handleDeleteIndex = () => {
    if (!selectedIndex) return;
    deleteIndex(selectedIndex.id);
    setShowDeleteDialog(false);
    setSelectedIndex(null);
    toast.success('Indeks savatchaga o\'tkazildi');
  };

  const handleRestoreIndex = (id: string) => {
    restoreIndex(id);
    toast.success('Indeks tiklandi');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Indekslar</h2>
          <p className="text-gray-500">Xat indekslarini boshqarish</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Indeks qo'shish
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Kod yoki nom bo'yicha qidirish..."
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
            variant={statusFilter === 'archived' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('archived')}
            size="sm"
          >
            Arxivlangan
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

      {/* Indices Table */}
      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Harakatlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIndices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  {statusFilter === 'deleted' ? 'Savatcha bo\'sh' : 'Indekslar topilmadi'}
                </TableCell>
              </TableRow>
            ) : (
              filteredIndices.map((index) => (
                <TableRow key={index.id}>
                  <TableCell className="font-mono font-semibold">{index.code}</TableCell>
                  <TableCell>{index.name}</TableCell>
                  <TableCell>
                    {index.status === 'deleted' ? (
                      <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">
                        <Trash2 className="w-3 h-3 mr-1" />
                        O'chirilgan
                      </Badge>
                    ) : (
                      <Badge variant={index.status === 'active' ? 'default' : 'secondary'}>
                        {index.status === 'active' ? 'Faol' : 'Arxivlangan'}
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
                              Tiklash
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (window.confirm("Haqiqatdan ham bu indeksni butunlay o'chirmoqchimisiz?")) {
                                  permanentDeleteIndex(index.id);
                                  toast.success("Indeks butunlay o'chirildi");
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
                            <DropdownMenuItem onClick={() => openEditModal(index)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Tahrirlash
                            </DropdownMenuItem>
                            {index.status === 'active' ? (
                              <DropdownMenuItem onClick={() => openArchiveDialog(index)}>
                                <Archive className="w-4 h-4 mr-2" />
                                Arxivlash
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(index.id)}>
                                <Hash className="w-4 h-4 mr-2" />
                                Faollashtirish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(index)}
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

      {/* Add Index Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi indeks qo'shish</DialogTitle>
            <DialogDescription>
              Indeks kodi va nomini kiriting
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddIndex} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kod *</Label>
              <Input
                id="code"
                placeholder="01-01"
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
              <p className="text-xs text-gray-500">Format: NN-NN (masalan: 01-01, 05-02)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nomi *</Label>
              <Input
                id="name"
                placeholder="Vazirliklar"
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
                Bekor qilish
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Qo'shish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Index Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Indeksni tahrirlash</DialogTitle>
            <DialogDescription>
              Indeks ma'lumotlarini yangilang
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditIndex} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Kod *</Label>
              <Input
                id="edit-code"
                placeholder="01-01"
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
              <Label htmlFor="edit-name">Nomi *</Label>
              <Input
                id="edit-name"
                placeholder="Vazirliklar"
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
                Bekor qilish
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Saqlash
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Indeksni arxivlash</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{selectedIndex?.code}</span> indeksni arxivlamoqchimisiz?
              Arxivlangan indekslardan yangi xatlar uchun foydalanib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedIndex(null)}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Arxivlash
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
              O'chirishni tasdiqlang
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <p>
                Siz haqiqatdan ham <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedIndex?.code} - {selectedIndex?.name}</span> indeksini o'chirmoqchimisiz?
              </p>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 text-sm">
                ⚠️ O'chirilgan ma'lumotlar savatchaga tushadi va <strong>30 kundan keyin</strong> butunlay o'chib ketadi.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedIndex(null)}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIndex} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
