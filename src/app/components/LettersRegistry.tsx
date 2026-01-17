import React, { useState, useEffect } from 'react';

import { Search, Download, Eye, Loader2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAdmin } from '../contexts/AdminContext';
import { Letter } from '../types/admin';
import { toast } from 'sonner';

export function LettersRegistry() {
  const { letters, refreshData } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: 'letterNumber'; direction: 'asc' | 'desc' } | null>(null);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const filteredLetters = letters.filter(letter => {
    const matchesSearch = (letter.letterNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (letter.subject?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (letter.recipient?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (letter.userFish?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesYear = new Date(letter.letterDate).getFullYear().toString() === year;

    return matchesSearch && matchesYear;
  });

  const sortedLetters = [...filteredLetters].sort((a, b) => {
    if (!sortConfig) return 0;
    const seqA = getSequence(a.letterNumber);
    const seqB = getSequence(b.letterNumber);
    return sortConfig.direction === 'asc' ? seqA - seqB : seqB - seqA;
  });

  const totalPages = Math.ceil(sortedLetters.length / limit);
  const paginatedLetters = sortedLetters.slice((page - 1) * limit, page * limit);

  const handleSort = (direction?: 'asc' | 'desc' | 'none') => {
    if (direction) {
      if (direction === 'none') {
        setSortConfig(null);
      } else {
        setSortConfig({ key: 'letterNumber', direction });
      }
      return;
    }

    setSortConfig(prev => {
      if (!prev || prev.direction === 'desc') {
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
      toast.error("Yuklab olishda xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Xatlar reyestri</h2>
          <p className="text-gray-500">Barcha ro'yxatga olingan xatlar</p>
        </div>
        <Button variant="outline" onClick={() => {
          const headers = ['Indeks', 'Yuborilgan manzil', 'Mavzu', 'Mazmuni', 'Xat varaqlari', 'Ilova varaqlari', 'Ijrochi', 'Lavozimi', 'Sana'];
          const data = letters.map(l => [
            `${l.indexCode} - ${l.indexName}`,
            l.recipient,
            l.subject,
            l.summary || '',
            l.pageCount,
            l.attachmentPageCount,
            l.userFish,
            l.userPosition,
            l.letterDate || l.createdDate || ''
          ]);

          const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          ].join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `xatlar_reyestri_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
        }}>
          <Download className="w-4 h-4 mr-2" />
          Barchani eksport qilish
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex flex-wrap items-end gap-2 flex-1">
          <div className="w-[120px]">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="Yil" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                {Array.from({ length: 19 }, (_, i) => new Date().getFullYear() - 1 - i).map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[200px]">
            <Select
              value={sortConfig?.direction || 'none'}
              onValueChange={(v: any) => handleSort(v === 'none' ? 'none' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Saralash (Xat raqami)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Asl holatda</SelectItem>
                <SelectItem value="asc">Xat raqami (O'sish)</SelectItem>
                <SelectItem value="desc">Xat raqami (Kamayish)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Soni:</span>
            <div className="w-[80px]">
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Soni" />
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
              placeholder="Xat raqami, mavzu, qabul qiluvchi yoki ijrochi bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full md:w-[450px]"
            />
          </div>
        </div>
      </div>

      {/* Letters Table - No horizontal scroll */}
      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center whitespace-nowrap">№</TableHead>
                <TableHead className="whitespace-nowrap">Xat raqami</TableHead>
                <TableHead className="whitespace-nowrap">Ro‘yxatga olingan vaqt</TableHead>
                <TableHead className="whitespace-nowrap">Sana</TableHead>
                <TableHead className="whitespace-nowrap">Indeks</TableHead>
                <TableHead className="whitespace-nowrap">Yuborilgan manzil</TableHead>
                <TableHead className="whitespace-nowrap">Mavzu</TableHead>
                <TableHead className="whitespace-nowrap">Mazmuni</TableHead>
                <TableHead className="whitespace-nowrap">Xat varaqlari</TableHead>
                <TableHead className="whitespace-nowrap">Ilova varaqlari</TableHead>
                <TableHead className="whitespace-nowrap">Ijrochi</TableHead>
                <TableHead className="whitespace-nowrap">Lavozimi</TableHead>
                <TableHead className="text-right whitespace-nowrap">Harakatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLetters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    Xatlar topilmadi
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
                        <span className="text-gray-400 italic text-xs">Ro'yxatga olinmagan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {formatDateTime(letter.createdDate)}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLetter(letter);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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
            Oldingi
          </Button>
          <span className="text-sm text-gray-500">
            Sahifa {page} / {Math.ceil(filteredLetters.length / limit)}
          </span>
          <Button
            variant="ghost"
            disabled={page >= Math.ceil(filteredLetters.length / limit)}
            onClick={() => setPage(p => p + 1)}
          >
            Keyingi
          </Button>
        </div>
      </div>

      {/* Letter Details Dialog */}
      <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xat tafsilotlari</DialogTitle>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Xat raqami</p>
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
                          toast.success("Nusxalandi");
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                    {selectedLetter.createdDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        Ro‘yxatga olingan vaqt: <span className="font-mono">{formatDateTime(selectedLetter.createdDate)}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Indeks</p>
                  <p className="font-medium font-mono">{selectedLetter.indexCode}</p>
                  <p className="text-sm text-gray-600">{selectedLetter.indexName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Xat sanasi</p>
                  <p className="font-medium">{new Date(selectedLetter.letterDate).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Yuborilgan manzil</p>
                <p className="font-medium">{selectedLetter.recipient}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Xat mavzusi</p>
                <p className="font-medium">{selectedLetter.subject}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Qisqacha mazmuni</p>
                <p className="text-gray-700 dark:text-gray-300">{selectedLetter.summary || "Mazmun kiritilmagan"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Xat varaqlar soni</p>
                  <p className="font-medium">{selectedLetter.pageCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ilova varaqlar soni</p>
                  <p className="font-medium">{selectedLetter.attachmentPageCount}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Ijrochi ma'lumotlari</p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-medium">{selectedLetter.userFish}</p>
                  <p className="text-sm text-gray-600">{selectedLetter.userPosition}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Fayllar</p>
                <div className="grid grid-cols-1 gap-2">
                  {!selectedLetter.xatFile && (!selectedLetter.ilovaFiles || selectedLetter.ilovaFiles.length === 0) ? (
                    <div className="bg-gray-50 dark:bg-gray-800 border border-dashed rounded-lg p-4 text-center">
                      <p className="text-gray-500 text-sm italic">Fayllar biriktirilmagan</p>
                    </div>
                  ) : (
                    <>
                      {selectedLetter.xatFile && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-sm font-medium">Asosiy xat:</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {typeof selectedLetter.xatFile === 'string' ? selectedLetter.xatFile : 'Fayl'}
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
                            <span className="text-sm font-medium">Ilova {idx + 1}:</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {typeof file === 'string' ? file : 'Fayl'}
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
                <p className="text-sm text-gray-500 mb-2">Imzo</p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-gray-500 italic">
                    Elektron imzo hozircha yo'q (kelajakda qo'shiladi)
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
