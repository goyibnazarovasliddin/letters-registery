import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAdmin } from '../contexts/AdminContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function Reports() {
  const { letters, indices, users } = useAdmin();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  const filteredLetters = letters.filter(letter => {
    const matchesDate = (!startDate || letter.createdDate >= startDate) &&
      (!endDate || letter.createdDate <= endDate);
    const matchesIndex = selectedIndex === 'all' || letter.indexCode === selectedIndex;
    const matchesUser = selectedUser === 'all' || letter.userFish === selectedUser;
    return matchesDate && matchesIndex && matchesUser;
  });

  const exportToExcel = () => {
    const data = filteredLetters.map(letter => ({
      'Xat raqami': letter.letterNumber,
      'Indeks': `${letter.indexCode} - ${letter.indexName}`,
      'Yuborilgan manzil': letter.recipient,
      'Xat mavzusi': letter.subject,
      'Xat varaqlar soni': letter.pageCount,
      'Ilova varaqlar soni': letter.attachmentPageCount,
      'Foydalanuvchi F.I.Sh.': letter.userFish,
      'Lavozimi': letter.userPosition,
      'Yaratilgan sana': letter.createdDate
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hisobot');

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Xat raqami
      { wch: 25 }, // Indeks
      { wch: 25 }, // Yuborilgan manzil
      { wch: 30 }, // Xat mavzusi
      { wch: 15 }, // Xat varaqlar soni
      { wch: 20 }, // Ilova varaqlar soni
      { wch: 30 }, // Foydalanuvchi F.I.Sh.
      { wch: 20 }, // Lavozimi
      { wch: 15 }  // Yaratilgan sana
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, `Hisobot_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel fayl yuklab olindi');
  };

  const exportToPDF = () => {
    toast.info('PDF eksport funksiyasi ishlab chiqilmoqda');
    // In a real app, you would use a library like jsPDF or pdfmake
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Hisobotlar</h2>
        <p className="text-gray-500">Xatlar bo'yicha hisobotlarni ko'rish va eksport qilish</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtrlar
          </CardTitle>
          <CardDescription>
            Hisobotni filtrlab, kerakli ma'lumotlarni tanlang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Boshlanish sanasi</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Tugash sanasi</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="index-filter">Indeks</Label>
              <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                <SelectTrigger id="index-filter">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {indices.map((index) => (
                    <SelectItem key={index.id} value={index.code}>
                      {index.code} - {index.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-filter">Foydalanuvchi</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user-filter">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.fish}>
                      {user.fish}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Eksport fayl formati
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Eksport faylida jadval quyidagi qat'iy ustunlarda чиқadi: Xat raqami, Indeks,
                Yuborilgan manzil, Xat mavzusi, Xat varaqlar soni, Ilova varaqlar soni,
                Foydalanuvchi F.I.Sh., Lavozimi, Yaratilgan sana.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={exportToExcel}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel eksport
        </Button>
        <Button
          variant="outline"
          onClick={exportToPDF}
        >
          <FileText className="w-4 h-4 mr-2" />
          PDF eksport
        </Button>
      </div>

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Natijalar ({filteredLetters.length})</CardTitle>
          <CardDescription>
            Filtr bo'yicha topilgan xatlar ro'yxati
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLetters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Natijalar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLetters.map((letter, index) => (
                    <TableRow key={letter.id}>
                      <TableCell className="text-center text-gray-500">{index + 1}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{letter.letterNumber}</TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">{letter.indexCode} - {letter.indexName}</TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
