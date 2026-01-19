import React, { useState } from 'react';
import { Users, Hash, FileText, TrendingUp, Plus, Download, Building2 } from 'lucide-react';
import { getSequence } from '../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAdmin } from '../contexts/AdminContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { useNavigate } from 'react-router-dom';
import { Letter } from '../types/admin';
import { api } from '../services/api/client';
import { toast } from 'sonner';
import { formatDateTime } from '../utils/formatters';

export function Dashboard() {
  const { users, indices, letters, departments, refreshData } = useAdmin();
  const navigate = useNavigate();
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [limit, setLimit] = useState(5);
  const [sortConfig, setSortConfig] = useState<{ direction: 'asc' | 'desc' } | null>(null);

  // Polling for real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleDownload = async (fileId: string) => {
    if (!fileId) return;
    try {
      await api.files.download(fileId);
    } catch (e) {
      toast.error("Yuklab olishda xatolik");
    }
  };

  const onNavigateToAction = (path: string, action?: string) => {
    navigate(action ? `${path}?action=${action}` : path);
  };

  // Calculate stats based on letterDate instead of createdDate as requested
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLetters = letters.filter(
    letter => letter.letterDate === todayStr
  ).length;

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 7);
  const thisWeekLetters = letters.filter(
    letter => {
      const lDate = new Date(letter.letterDate);
      lDate.setHours(0, 0, 0, 0);
      return lDate >= weekStart;
    }
  ).length;

  const activeUsers = users.filter(user => user.status === 'active').length;
  const activeIndices = indices.filter(index => index.status === 'active').length;
  const activeDepartments = departments.filter(dept => dept.status === 'active').length;

  const stats = [
    {
      title: 'Bugungi xatlar',
      value: todayLetters,
      icon: FileText,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Shu hafta',
      value: thisWeekLetters,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Foydalanuvchilar',
      value: activeUsers,
      icon: Users,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Indekslar',
      value: activeIndices,
      icon: Hash,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900',
    },
    {
      title: 'Bo\'limlar',
      value: activeDepartments,
      icon: Building2,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Dashboard</h2>
        <p className="text-gray-500">Tizim ko'rsatkichlari va tezkor harakatlar</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tezkor harakatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              className="h-auto py-6 flex-col gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => onNavigateToAction('/admin/users', 'create')}
            >
              <Plus className="w-6 h-6" />
              <span>Foydalanuvchi yaratish</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              onClick={() => onNavigateToAction('/admin/indices', 'create')}
            >
              <Plus className="w-6 h-6" />
              <span>Indeks qo'shish</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              onClick={() => onNavigateToAction('/admin/departments', 'create')}
            >
              <Plus className="w-6 h-6" />
              <span>Bo'lim qo'shish</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              onClick={() => navigate('/admin/reports')}
            >
              <Download className="w-6 h-6" />
              <span>Hisobot eksport</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Letters */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>So'nggi xatlar (Recents)</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-normal">Soni:</span>
            <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue placeholder="Soni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-x-auto">
            {(() => {
              const sortedLetters = [...letters].sort((a, b) => {
                if (!sortConfig) return 0;
                const seqA = getSequence(a.letterNumber);
                const seqB = getSequence(b.letterNumber);
                return sortConfig.direction === 'asc' ? seqA - seqB : seqB - seqA;
              });

              const handleSort = () => {
                setSortConfig(prev => {
                  if (!prev || prev.direction === 'desc') {
                    return { direction: 'asc' };
                  }
                  return { direction: 'desc' };
                });
              };

              return (
                <div className="min-w-[1000px]">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLetters.slice(0, limit).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                            Hali xatlar yo'q
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedLetters.slice(0, limit).map((letter, index) => (
                          <TableRow
                            key={letter.id}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => setSelectedLetter(letter)}
                          >
                            <TableCell className="text-center text-gray-500">{index + 1}</TableCell>
                            <TableCell className="font-medium dark:text-gray-200">
                              {letter.letterNumber ? (
                                <span className="font-mono text-green-600 dark:text-green-400 font-bold">{letter.letterNumber}</span>
                              ) : (
                                <span className="text-gray-400 italic text-xs">Ro'yxatga olinmagan</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
                              {letter.createdDate ? formatDateTime(letter.createdDate) : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {letter.letterDate ? new Date(letter.letterDate).toLocaleDateString('ru-RU') : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono whitespace-nowrap">
                                {letter.indexCode}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate" title={letter.recipient}>{letter.recipient}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={letter.subject}>{letter.subject}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={letter.summary}>{letter.summary || '-'}</TableCell>
                            <TableCell className="text-center">{letter.pageCount}</TableCell>
                            <TableCell className="text-center">{letter.attachmentPageCount}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{letter.userFish}</TableCell>
                            <TableCell className="text-sm text-gray-500 whitespace-nowrap">{letter.userPosition}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Letter Details Modal */}
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
                        onClick={(e) => {
                          e.stopPropagation();
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLetter.indexName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Xat sanasi</p>
                  <p className="font-medium">
                    {selectedLetter.letterDate ? new Date(selectedLetter.letterDate).toLocaleDateString('ru-RU') : 'Kiritilmagan'}
                  </p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLetter.userPosition}</p>
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
                              {/* @ts-ignore */}
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
                              {/* @ts-ignore */}
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
