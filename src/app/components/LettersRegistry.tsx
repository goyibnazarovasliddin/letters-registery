import React, { useState, useEffect } from 'react';
import { Search, Eye, Download } from 'lucide-react';
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
import { useAdmin } from '../contexts/AdminContext';
import { Letter } from '../types/admin';
import { api } from '../services/api/client';
import { toast } from 'sonner';

export function LettersRegistry() {
  const { letters, refreshData } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const filteredLetters = letters.filter(letter =>
    letter.letterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.userFish.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          const headers = ['Xat raqami', 'Indeks', 'Yuborilgan manzil', 'Mavzu', 'Varaqlar', 'Ilova', 'Foydalanuvchi', 'Lavozimi', 'Sana'];
          const data = letters.map(l => [
            l.letterNumber,
            `${l.indexCode} - ${l.indexName}`,
            l.recipient,
            l.subject,
            l.pageCount,
            l.attachmentPageCount,
            l.userFish,
            l.userPosition,
            l.createdDate
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Xat raqami, mavzu, manzil yoki foydalanuvchi bo'yicha qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Letters Table */}
      <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center whitespace-nowrap">№</TableHead>
              <TableHead className="whitespace-nowrap">Xat raqami</TableHead>
              <TableHead className="whitespace-nowrap">Indeks</TableHead>
              <TableHead className="whitespace-nowrap">Yuborilgan manzil</TableHead>
              <TableHead className="whitespace-nowrap">Mavzu</TableHead>
              <TableHead className="whitespace-nowrap">Varaqlar</TableHead>
              <TableHead className="whitespace-nowrap">Ilova</TableHead>
              <TableHead className="whitespace-nowrap">Foydalanuvchi</TableHead>
              <TableHead className="whitespace-nowrap">Lavozimi</TableHead>
              <TableHead className="whitespace-nowrap">Sana</TableHead>
              <TableHead className="text-right whitespace-nowrap">Harakatlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLetters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                  Xatlar topilmadi
                </TableCell>
              </TableRow>
            ) : (
              filteredLetters.map((letter, index) => (
                <TableRow
                  key={letter.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setSelectedLetter(letter)}
                >
                  <TableCell className="text-center text-gray-500">{index + 1}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{letter.letterNumber}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className="font-mono">
                      {letter.indexCode} - {letter.indexName}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={letter.recipient}>{letter.recipient}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={letter.subject}>{letter.subject}</TableCell>
                  <TableCell className="text-center">{letter.pageCount}</TableCell>
                  <TableCell className="text-center">{letter.attachmentPageCount}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{letter.userFish}</TableCell>
                  <TableCell className="text-sm text-gray-500 whitespace-nowrap">{letter.userPosition}</TableCell>
                  <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                    {new Date(letter.createdDate).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </TableCell>
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

      {/* Letter Details Dialog */}
      <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xat tafsilotlari</DialogTitle>
            <DialogDescription>
              Xat raqami: {selectedLetter?.letterNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Indeks</p>
                  <p className="font-medium font-mono">{selectedLetter.indexCode}</p>
                  <p className="text-sm text-gray-600">{selectedLetter.indexName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Yaratilgan sana</p>
                  <p className="font-medium">{selectedLetter.createdDate}</p>
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
                <p className="text-sm text-gray-500">Xat mazmuni</p>
                <p className="text-gray-700 dark:text-gray-300">{selectedLetter.content}</p>
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
                <p className="text-sm text-gray-500 mb-2">Foydalanuvchi ma'lumotlari</p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-medium">{selectedLetter.userFish}</p>
                  <p className="text-sm text-gray-600">{selectedLetter.userPosition}</p>
                </div>
              </div>

              {(selectedLetter.xatFile || (selectedLetter.ilovaFiles && selectedLetter.ilovaFiles.length > 0)) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Fayllar</p>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedLetter.xatFile && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-sm font-medium">Asosiy xat:</span>
                          <span className="text-sm text-gray-600 truncate">
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
                          <span className="text-sm text-gray-600 truncate">
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
                  </div>
                </div>
              )}

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
