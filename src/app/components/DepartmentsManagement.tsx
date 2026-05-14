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

interface DepartmentsManagementProps {
    initialAction?: string;
}

export function DepartmentsManagement({ initialAction }: DepartmentsManagementProps) {
    const { departments, addDepartment, updateDepartment, archiveDepartment, activateDepartment, deleteDepartment, restoreDepartment, permanentDeleteDepartment, isLoading } = useAdmin();
    const { t } = useT();
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

    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

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

    const totalPages = Math.ceil(filteredDepartments.length / limit);
    const paginatedDepartments = filteredDepartments.slice((page - 1) * limit, page * limit);

    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        await addDepartment(name, description);
        setShowAddModal(false);
        setName('');
        setDescription('');
        toast.success(t('toast.deptAdded'));
    };

    const handleEditDepartment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDepartment) return;

        updateDepartment(selectedDepartment.id, name, description);
        setShowEditModal(false);
        setSelectedDepartment(null);
        setName('');
        setDescription('');
        toast.success(t('toast.deptUpdated'));
    };

    const handleArchive = () => {
        if (!selectedDepartment) return;
        archiveDepartment(selectedDepartment.id);
        setShowArchiveDialog(false);
        setSelectedDepartment(null);
        toast.success(t('toast.deptArchived'));
    };

    const handleActivate = (id: string) => {
        activateDepartment(id);
        toast.success(t('toast.deptActivated'));
    };

    const handleDeleteDepartment = () => {
        if (!selectedDepartment) return;
        deleteDepartment(selectedDepartment.id);
        setShowDeleteDialog(false);
        setSelectedDepartment(null);
        toast.success(t('toast.deptMovedToTrash'));
    };

    const handleRestoreDepartment = (id: string) => {
        restoreDepartment(id);
        toast.success(t('toast.deptRestored'));
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
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold mb-1">{t('departments.title')}</h2>
                    <p className="text-gray-500">{t('nav.departments')}</p>
                </div>
                <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('dashboard.addDepartment')}
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

            {/* Departments Table */}
            {isLoading ? (
                <TableSkeleton rows={6} cols={5} />
            ) : (
            <div className="border rounded-lg bg-white dark:bg-gray-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12 text-center">{t('common.no')}</TableHead>
                            <TableHead>{t('departments.name')}</TableHead>
                            <TableHead>{t('departments.description')}</TableHead>
                            <TableHead className="text-center w-[140px]">{t('departments.users')}</TableHead>
                            <TableHead className="text-center w-[150px]">{t('common.status')}</TableHead>
                            <TableHead className="text-right">{t('common.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedDepartments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    {statusFilter === 'deleted' ? t('users.trashEmpty') : t('common.notFound')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedDepartments.map((dept, index) => (
                                <TableRow key={dept.id}>
                                    <TableCell className="text-center text-gray-500">
                                        {index + 1 + (page - 1) * limit}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-gray-500" />
                                            {dept.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-500">{dept.description || '—'}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{t('departments.userCount').replace('{n}', String(dept.userCount))}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center w-[150px]">
                                        {dept.status === 'deleted' ? (
                                            <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 justify-center w-[120px]">
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                {t('common.deleted')}
                                            </Badge>
                                        ) : (
                                            <Badge variant={dept.status === 'active' ? 'default' : 'secondary'} className="justify-center w-[120px]">
                                                {dept.status === 'active' ? t('common.active') : t('common.archived')}
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
                                                            {t('common.restore')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                if (window.confirm(t('dialog.permanentDeleteConfirm'))) {
                                                                    permanentDeleteDepartment(dept.id);
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
                                                        <DropdownMenuItem onClick={() => openEditModal(dept)}>
                                                            <Edit2 className="w-4 h-4 mr-2" />
                                                            {t('common.edit')}
                                                        </DropdownMenuItem>
                                                        {dept.status === 'active' ? (
                                                            <DropdownMenuItem onClick={() => openArchiveDialog(dept)}>
                                                                <Archive className="w-4 h-4 mr-2" />
                                                                {t('common.archive')}
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => handleActivate(dept.id)}>
                                                                <Building className="w-4 h-4 mr-2" />
                                                                {t('common.activate')}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => openDeleteDialog(dept)}
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

            {/* Add Department Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('departments.add')}</DialogTitle>
                        <DialogDescription>
                            {t('departments.descPlaceholder')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddDepartment} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('departments.name')} *</Label>
                            <Input
                                id="name"
                                placeholder={t('departments.namePlaceholder')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">{t('departments.description')} ({t('common.optional')})</Label>
                            <Input
                                id="description"
                                placeholder={t('departments.descPlaceholder')}
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
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                {t('common.add')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Department Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('departments.edit')}</DialogTitle>
                        <DialogDescription>
                            {t('departments.descPlaceholder')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditDepartment} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">{t('departments.name')} *</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">{t('departments.description')}</Label>
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
                            {t('users.areYouSure')} <span className="font-semibold">{selectedDepartment?.name}</span> {t('departments.archiveConfirm')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedDepartment(null)}>
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
                                {t('users.areYouSure')} <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedDepartment?.name}</span> {t('departments.deleteConfirm')}
                            </p>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 text-sm flex items-start gap-2">
                                <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{t('dialog.deleteSoftWarning')}</span>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedDepartment(null)}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDepartment} className="bg-red-600 hover:bg-red-700">
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
