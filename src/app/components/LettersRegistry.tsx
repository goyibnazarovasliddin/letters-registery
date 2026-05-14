import React, { useState, useEffect } from 'react';

import { Search, Download, Eye, Loader2, ChevronLeft, ChevronRight, FileText, Trash2, TriangleAlert } from 'lucide-react';
import { api } from '../services/api/client';
import { formatDate, formatDateTime, getSequence } from '../utils/formatters';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAdmin } from '../contexts/AdminContext';
import { Letter } from '../types/admin';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { TableSkeleton } from './ui/PageLoader';
import * as XLSX from 'xlsx';
import { useT } from '../contexts/LanguageContext';

export function LettersRegistry() {
  const { letters, refreshData, deleteLetter, isLoading } = useAdmin();
  const { t } = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFilter = (searchParams.get('dateFilter') as 'today' | 'week' | null) || null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [letterToDelete, setLetterToDelete] = useState<Letter | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: 'letterNumber' | 'createdDate'; direction: 'asc' | 'desc' } | null>(null);

  const clearDateFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('dateFilter');
    setSearchParams(next);
  };

  const handleDeleteLetter = async () => {
    if (!letterToDelete) return;
    setDeleting(true);
    const ok = await deleteLetter(letterToDelete.id);
    setDeleting(false);
    if (ok) {
      toast.success(t('toast.letterDeleted'));
      setLetterToDelete(null);
      if (selectedLetter?.id === letterToDelete.id) setSelectedLetter(null);
    }
  };

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const todayStr = new Date().toISOString().split('T')[0];
  const weekAgoDate = new Date();
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const weekAgoStr = weekAgoDate.toISOString().split('T')[0];

  const filteredLetters = letters.filter(letter => {
    const matchesSearch = (letter.letterNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (letter.subject?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (letter.recipient?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (letter.userFish?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    let matchesDate: boolean;
    if (dateFilter === 'today') {
      matchesDate = letter.letterDate === todayStr;
    } else if (dateFilter === 'week') {
      matchesDate = letter.letterDate >= weekAgoStr && letter.letterDate <= todayStr;
    } else {
      matchesDate = new Date(letter.letterDate).getFullYear().toString() === year;
    }

    return matchesSearch && matchesDate;
  });

  const sortedLetters = [...filteredLetters].sort((a, b) => {
    if (!sortConfig) {
      // Default: position letters by the date they belong to (newest first),
      // tie-broken by letter-number sequence — so back-dated letters land
      // among their own dates, not at the bottom by insertion order.
      const dateCmp = (b.letterDate || '').localeCompare(a.letterDate || '');
      if (dateCmp !== 0) return dateCmp;
      return getSequence(b.letterNumber) - getSequence(a.letterNumber);
    }
    if (sortConfig.key === 'createdDate') {
      const ca = a.createdDate || '';
      const cb = b.createdDate || '';
      const cmp = ca.localeCompare(cb);
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    }
    const seqA = getSequence(a.letterNumber);
    const seqB = getSequence(b.letterNumber);
    return sortConfig.direction === 'asc' ? seqA - seqB : seqB - seqA;
  });

  const totalPages = Math.ceil(sortedLetters.length / limit);
  const paginatedLetters = sortedLetters.slice((page - 1) * limit, page * limit);

  const handleSort = (value?: 'none' | 'asc' | 'desc' | 'created-asc' | 'created-desc') => {
    if (value) {
      if (value === 'none') {
        setSortConfig(null);
      } else if (value === 'created-asc') {
        setSortConfig({ key: 'createdDate', direction: 'asc' });
      } else if (value === 'created-desc') {
        setSortConfig({ key: 'createdDate', direction: 'desc' });
      } else {
        setSortConfig({ key: 'letterNumber', direction: value });
      }
      return;
    }

    setSortConfig(prev => {
      if (!prev || prev.key !== 'letterNumber' || prev.direction === 'desc') {
        return { key: 'letterNumber', direction: 'asc' };
      }
      return { key: 'letterNumber', direction: 'desc' };
    });
  };

  const handleDownload = async (fileId: string) => {
    if (!fileId) return;
    try {
      await api.files.download(fileId);
    } catch (e) {
      toast.error(t('toast.downloadError'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">{t('letter.registry')}</h2>
          <p className="text-gray-500">{t('letter.allRegistered')}</p>
        </div>
        <Button variant="outline" onClick={() => {
          const data = sortedLetters.map(l => ({
            [t('letter.number')]: l.letterNumber || '-',
            [t('letter.date')]: l.letterDate ? new Date(l.letterDate).toLocaleDateString('ru-RU') : '-',
            [t('letter.index')]: `${l.indexCode} - ${l.indexName}`,
            [t('letter.recipient')]: l.recipient,
            [t('letter.subject')]: l.subject,
            [t('letter.summary')]: l.summary || '-',
            [t('letter.pageCount')]: l.pageCount,
            [t('letter.attachmentPageCount')]: l.attachmentPageCount,
            [t('letter.executor')]: l.userFish,
            [t('letter.position')]: l.userPosition,
          }));

          const worksheet = XLSX.utils.json_to_sheet(data);
          worksheet['!cols'] = [
            { wch: 16 }, { wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 30 },
            { wch: 40 }, { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 20 },
          ];
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Reyestr');
          XLSX.writeFile(workbook, `xatlar_reyestri_${new Date().toISOString().split('T')[0]}.xlsx`);
          toast.success(t('toast.excelDownloaded'));
        }}>
          <Download className="w-4 h-4 mr-2" />
          {t('letter.exportAll')}
        </Button>
      </div>

      {dateFilter && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {t('letter.filter.label')}: <strong>{dateFilter === 'today' ? t('letter.filter.today') : t('letter.filter.week')}</strong>
          </span>
          <Button variant="ghost" size="sm" className="h-7 ml-auto text-blue-700 dark:text-blue-300" onClick={clearDateFilter}>
            {t('common.clear')}
          </Button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex flex-wrap items-end gap-2 flex-1">
          <div className="w-[120px]">
            <Select value={year} onValueChange={setYear} disabled={!!dateFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('letter.year')} />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                {Array.from({ length: 19 }, (_, i) => new Date().getFullYear() - 1 - i).map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[220px]">
            <Select
              value={
                !sortConfig
                  ? 'none'
                  : sortConfig.key === 'createdDate'
                    ? `created-${sortConfig.direction}`
                    : sortConfig.direction
              }
              onValueChange={(v: any) => handleSort(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('letter.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('letter.sortDefault')}</SelectItem>
                <SelectItem value="asc">{t('letter.sortAsc')}</SelectItem>
                <SelectItem value="desc">{t('letter.sortDesc')}</SelectItem>
                <SelectItem value="created-desc">{t('letter.sortCreatedDesc')}</SelectItem>
                <SelectItem value="created-asc">{t('letter.sortCreatedAsc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('common.count')}</span>
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
          <div className="relative flex-1 md:flex-none ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full md:w-[450px]"
            />
          </div>
        </div>
      </div>

      {/* Letters Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : (
      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center whitespace-nowrap">{t('common.no')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.number')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.registeredAt')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.date')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.index')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.recipient')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.subject')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.summary')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.pageCount')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.attachmentPageCount')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.executor')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('letter.position')}</TableHead>
                <TableHead className="text-right whitespace-nowrap">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLetters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    {t('letter.notFound')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLetters.map((letter, index) => (
                  <TableRow
                    key={letter.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setSelectedLetter(letter)}
                  >
                    <TableCell className="text-center text-gray-500">{index + 1 + (page - 1) * limit}</TableCell>
                    <TableCell className="font-medium dark:text-gray-200">
                      {letter.letterNumber ? (
                        <span className="font-mono text-green-600 dark:text-green-400 font-bold">{letter.letterNumber}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">{t('letter.notRegistered')}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {formatDateTime(letter.status === 'REGISTERED' ? (letter.registeredAt || letter.updatedDate) : letter.updatedDate)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {letter.letterDate ? new Date(letter.letterDate).toLocaleDateString('ru-RU') : '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className="font-mono">
                        {letter.indexCode} - {letter.indexName}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={letter.recipient}>{letter.recipient}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={letter.subject}>{letter.subject}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-gray-500 text-sm" title={letter.summary}>{letter.summary || '-'}</TableCell>
                    <TableCell className="text-center">{letter.pageCount}</TableCell>
                    <TableCell className="text-center">{letter.attachmentPageCount}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{letter.userFish}</TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">{letter.userPosition}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLetter(letter);
                          }}
                          title="Ko'rish"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLetterToDelete(letter);
                          }}
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
            {t('common.page')} {page} / {Math.ceil(filteredLetters.length / limit)}
          </span>
          <Button
            variant="ghost"
            disabled={page >= Math.ceil(filteredLetters.length / limit)}
            onClick={() => setPage(p => p + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>
      )}

      {/* Letter Details Dialog */}
      <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('letter.detailsTitle')}</DialogTitle>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">{t('letter.number')}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono text-green-600 dark:text-green-400">
                        {selectedLetter.letterNumber || "N/A"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLetter.letterNumber || '');
                          toast.success(t('common.copied'));
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                    {(selectedLetter.status === 'REGISTERED' || selectedLetter.updatedDate) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {t('letter.registeredAt')}: <span className="font-mono">{formatDateTime(selectedLetter.status === 'REGISTERED' ? (selectedLetter.registeredAt || selectedLetter.updatedDate) : selectedLetter.updatedDate)}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">{t('letter.index')}</p>
                  <p className="font-medium font-mono">{selectedLetter.indexCode}</p>
                  <p className="text-sm text-gray-600">{selectedLetter.indexName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('letter.date')}</p>
                  <p className="font-medium">{new Date(selectedLetter.letterDate).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">{t('letter.recipient')}</p>
                <p className="font-medium">{selectedLetter.recipient}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">{t('letter.subject')}</p>
                <p className="font-medium">{selectedLetter.subject}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">{t('letter.summary')}</p>
                <p className="text-gray-700 dark:text-gray-300">{selectedLetter.summary || t('letter.summaryEmpty')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t('letter.pageCount')}</p>
                  <p className="font-medium">{selectedLetter.pageCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('letter.attachmentPageCount')}</p>
                  <p className="font-medium">{selectedLetter.attachmentPageCount}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">{t('letter.executorInfo')}</p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-medium">{selectedLetter.userFish}</p>
                  <p className="text-sm text-gray-600">{selectedLetter.userPosition}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">{t('letter.files')}</p>
                <div className="grid grid-cols-1 gap-2">
                  {!selectedLetter.xatFile && (!selectedLetter.ilovaFiles || selectedLetter.ilovaFiles.length === 0) ? (
                    <div className="bg-gray-50 dark:bg-gray-800 border border-dashed rounded-lg p-4 text-center">
                      <p className="text-gray-500 text-sm italic">{t('letter.filesNone')}</p>
                    </div>
                  ) : (
                    <>
                      {selectedLetter.xatFile && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sm font-medium">{t('letter.mainLetter')}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {typeof selectedLetter.xatFile === 'string' ? selectedLetter.xatFile : ''}
                            </span>
                          </div>
                          {selectedLetter.xatFileId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(selectedLetter.xatFileId!)}
                            >
                              <Download className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      )}
                      {selectedLetter.ilovaFiles?.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-dashed justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sm font-medium">{t('letter.attachment')} {idx + 1}:</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {typeof file === 'string' ? file : ''}
                            </span>
                          </div>
                          {selectedLetter.ilovaFileIds && selectedLetter.ilovaFileIds[idx] && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(selectedLetter.ilovaFileIds![idx])}
                            >
                              <Download className="w-4 h-4 text-gray-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">{t('letter.signature')}</p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-gray-500 italic">
                    {t('letter.signaturePlaceholder')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Letter Confirmation */}
      <AlertDialog open={!!letterToDelete} onOpenChange={(o) => { if (!o) setLetterToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <TriangleAlert className="w-5 h-5" />
              {t('dialog.confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <p>
                <span className="font-semibold font-mono text-gray-900 dark:text-gray-100">
                  {letterToDelete?.letterNumber || letterToDelete?.subject || ''}
                </span>
              </p>
              <p>{t('letter.deleteConfirm')}</p>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm flex items-start gap-2">
                <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('letter.deleteWarning')}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteLetter(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? t('users.savePending') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
