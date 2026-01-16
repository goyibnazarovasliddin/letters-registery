import React, { useState } from 'react';
import {
    Plus,
    MoreVertical,
    Archive,
    Edit2,
    Search,
    Building,
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

interface DepartmentsManagementProps {
    initialAction?: string;
}

export function DepartmentsManagement({ initialAction }: DepartmentsManagementProps) {
    const { departments, addDepartment, updateDepartment, archiveDepartment, activateDepartment, deleteDepartment, restoreDepartment, permanentDeleteDepartment } = useAdmin();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'deleted'>('all');
    const [showAddModal, setShowAddModal] = useState(initialAction === 'create');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<{ id: string; name: string; description?: string } | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const filteredDepartments = departments.filter(dept => {
        const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (dept.description && dept.description.toLowerCase().includes(searchQuery.toLowerCase()));

        if (statusFilter === 'deleted') {
            return matchesSearch && dept.status === 'deleted';
        }
        const matchesStatus = statusFilter === 'all'
            ? dept.status !== 'deleted'
            : dept.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        await addDepartment(name, description);
        setShowAddModal(false);
        setName('');
        setDescription('');
        toast.success('Bo\'lim qo\'shildi');
    };

    const handleEditDepartment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDepartment) return;

        updateDepartment(selectedDepartment.id, name, description);
        setShowEditModal(false);
        setSelectedDepartment(null);
        setName('');
        setDescription('');
        toast.success('Bo\'lim yangilandi');
    };

    const handleArchive = () => {
        if (!selectedDepartment) return;
        archiveDepartment(selectedDepartment.id);
        setShowArchiveDialog(false);
        setSelectedDepartment(null);
        toast.success('Bo\'lim arxivlandi');
    };

    const handleActivate = (id: string) => {
        activateDepartment(id);
        toast.success('Bo\'lim faollashtirildi');
    };

    const handleDeleteDepartment = () => {
        if (!selectedDepartment) return;
        deleteDepartment(selectedDepartment.id);
        setShowDeleteDialog(false);
        setSelectedDepartment(null);
        toast.success('Bo\'lim savatchaga o\'tkazildi');
    };

    const handleRestoreDepartment = (id: string) => {
        restoreDepartment(id);
        toast.success('Bo\'lim tiklandi');
    };

    const openEditModal = (dept: { id: string; name: string; description?: string }) => {
        setSelectedDepartment(dept);
        setName(dept.name);
        setDescription(dept.description || '');
        setShowEditModal(true);
    };

    const openArchiveDialog = (dept: { id: string; name: string; description?: string }) => {
        setSelectedDepartment(dept);
        setShowArchiveDialog(true);
    };

    const openDeleteDialog = (dept: { id: string; name: string; description?: string }) => {
        setSelectedDepartment(dept);
        setShowDeleteDialog(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">Bo'limlar</h2>
                    <p className="text-gray-500">Tashkilot bo'limlarini boshqarish</p>
                </div>
                <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Bo'lim qo'shish
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Bo'lim nomi bo'yicha qidirish..."
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

            {/* Departments Table */}
            <div className="border rounded-lg bg-white dark:bg-gray-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomi</TableHead>
                            <TableHead>Tavsif</TableHead>
                            <TableHead>Xodimlar</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Harakatlar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDepartments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    {statusFilter === 'deleted' ? 'Savatcha bo\'sh' : 'Bo\'limlar topilmadi'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDepartments.map((dept) => (
                                <TableRow key={dept.id}>
                                    <TableCell className="font-semibold flex items-center gap-2">
                                        <Building className="w-4 h-4 text-gray-500" />
                                        {dept.name}
                                    </TableCell>
                                    <TableCell className="text-gray-500">{dept.description || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{dept.userCount} ta xodim</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {dept.status === 'deleted' ? (
                                            <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                O'chirilgan
                                            </Badge>
                                        ) : (
                                            <Badge variant={dept.status === 'active' ? 'default' : 'secondary'}>
                                                {dept.status === 'active' ? 'Faol' : 'Arxivlangan'}
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
                                                {dept.status === 'deleted' ? (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleRestoreDepartment(dept.id)}>
                                                            <RefreshCcw className="w-4 h-4 mr-2" />
                                                            Tiklash
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                if (window.confirm("Haqiqatdan ham bu bo'limni butunlay o'chirmoqchimisiz?")) {
                                                                    permanentDeleteDepartment(dept.id);
                                                                    toast.success("Bo'lim butunlay o'chirildi");
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
                                                        <DropdownMenuItem onClick={() => openEditModal(dept)}>
                                                            <Edit2 className="w-4 h-4 mr-2" />
                                                            Tahrirlash
                                                        </DropdownMenuItem>
                                                        {dept.status === 'active' ? (
                                                            <DropdownMenuItem onClick={() => openArchiveDialog(dept)}>
                                                                <Archive className="w-4 h-4 mr-2" />
                                                                Arxivlash
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => handleActivate(dept.id)}>
                                                                <Building className="w-4 h-4 mr-2" />
                                                                Faollashtirish
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => openDeleteDialog(dept)}
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

            {/* Add Department Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yangi bo'lim qo'shish</DialogTitle>
                        <DialogDescription>
                            Bo'lim ma'lumotlarini kiriting
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddDepartment} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nomi *</Label>
                            <Input
                                id="name"
                                placeholder="Axborot texnologiyalari bo'limi"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
                            <Input
                                id="description"
                                placeholder="Bo'lim faoliyati haqida qisqacha"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setName('');
                                    setDescription('');
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

            {/* Edit Department Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bo'limni tahrirlash</DialogTitle>
                        <DialogDescription>
                            Bo'lim ma'lumotlarini yangilang
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditDepartment} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nomi *</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Tavsif</Label>
                            <Input
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedDepartment(null);
                                    setName('');
                                    setDescription('');
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
                        <AlertDialogTitle>Bo'limni arxivlash</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-semibold">{selectedDepartment?.name}</span>ni arxivlamoqchimisiz?
                            Arxivlangan bo'limlarni yangi foydalanuvchilar tanlasholmaydi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedDepartment(null)}>
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
                                Siz haqiqatdan ham <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedDepartment?.name}</span>ni o'chirmoqchimisiz?
                            </p>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 text-sm">
                                ⚠️ O'chirilgan ma'lumotlar savatchaga tushadi va <strong>30 kundan keyin</strong> butunlay o'chib ketadi.
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedDepartment(null)}>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDepartment} className="bg-red-600 hover:bg-red-700">
                            O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
