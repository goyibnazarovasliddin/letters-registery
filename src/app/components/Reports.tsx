import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, Filter, ChevronDown } from 'lucide-react';
import { getSequence } from '../utils/formatters';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useAdmin } from '../contexts/AdminContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { TableSkeleton } from './ui/PageLoader';
import { useT } from '../contexts/LanguageContext';

export function Reports() {
  const { letters, indices, users, refreshData, isLoading } = useAdmin();
  const { t } = useT();
  const [selectedIndex, setSelectedIndex] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ direction: 'asc' | 'desc' } | null>(null);

  // Custom Date States
  const now = new Date();
  const [startYear, setStartYear] = useState(now.getFullYear().toString());
  const [startMonth, setStartMonth] = useState((now.getMonth() + 1).toString());
  const [startDay, setStartDay] = useState('1');

  const [endYear, setEndYear] = useState(now.getFullYear().toString());
  const [endMonth, setEndMonth] = useState((now.getMonth() + 1).toString());
  const [endDay, setEndDay] = useState(now.getDate().toString());

  const getFullDate = (y: string, m: string, d: string) => {
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const startDate = getFullDate(startYear, startMonth, startDay);
  const endDate = getFullDate(endYear, endMonth, endDay);
  React.useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const filteredLetters = letters.filter(letter => {
    const matchesDate = (!startDate || letter.letterDate >= startDate) &&
      (!endDate || letter.letterDate <= endDate);
    const matchesIndex = selectedIndex === 'all' || letter.indexCode === selectedIndex;
    const matchesUser = selectedUser === 'all' || letter.userFish === selectedUser;
    return matchesDate && matchesIndex && matchesUser;
  });

  const sortedLetters = [...filteredLetters].sort((a, b) => {
    if (!sortConfig) {
      // Default: order by the date the letter belongs to (newest first),
      // tie-broken by sequence — back-dated letters land among their dates.
      const dateCmp = (b.letterDate || '').localeCompare(a.letterDate || '');
      if (dateCmp !== 0) return dateCmp;
      return getSequence(b.letterNumber) - getSequence(a.letterNumber);
    }
    const seqA = getSequence(a.letterNumber);
    const seqB = getSequence(b.letterNumber);
    return sortConfig.direction === 'asc' ? seqA - seqB : seqB - seqA;
  });

  const totalPages = Math.ceil(sortedLetters.length / limit);
  const paginatedLetters = sortedLetters.slice((page - 1) * limit, page * limit);

  const handleSort = (direction: 'asc' | 'desc' | 'none') => {
    if (direction === 'none') {
      setSortConfig(null);
    } else {
      setSortConfig({ direction });
    }
  };


  const exportToExcel = () => {
    const data = sortedLetters.map(letter => ({
      'Xat raqami': letter.letterNumber || '-',
      'Sana': letter.letterDate ? new Date(letter.letterDate).toLocaleDateString('ru-RU') : '-',
      'Indeks': `${letter.indexCode} - ${letter.indexName} `,
      'Yuborilgan manzil': letter.recipient,
      'Mavzu': letter.subject,
      'Mazmuni': letter.summary || '-',
      'Xat varaqlari': letter.pageCount,
      'Ilova varaqlari': letter.attachmentPageCount,
      'Ijrochi': letter.userFish,
      'Lavozimi': letter.userPosition
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hisobot');

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Xat raqami
      { wch: 15 }, // Sana
      { wch: 25 }, // Indeks
      { wch: 25 }, // Yuborilgan manzil
      { wch: 30 }, // Mavzu
      { wch: 40 }, // Mazmuni
      { wch: 15 }, // Xat varaqlari
      { wch: 20 }, // Ilova varaqlari
      { wch: 30 }, // Ijrochi
      { wch: 20 }  // Lavozimi
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, `Hisobot_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(t('toast.excelDownloaded'));
  };

  const exportToPDF = () => {
    toast.info(t('toast.pdfInProgress'));
  };

  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
  ];

  const years = Array.from({ length: 20 }, (_, i) => (now.getFullYear() - i).toString());

  const DayGrid = ({ selectedDay, onSelect, year, month, label }: any) => {
    const daysCount = new Date(parseInt(year), parseInt(month), 0).getDate();
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 w-full justify-between font-normal px-3">
            <span>{selectedDay ? `${selectedDay}` : label}</span>
            <ChevronDown className="h-4 w-4 opacity-50 ml-1 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: daysCount }, (_, i) => (i + 1).toString()).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => onSelect(d)}
                className={`w-8 h-8 flex items-center justify-center rounded text-xs transition-colors ${selectedDay === d
                  ? 'bg-green-600 text-white font-bold'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {d}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-semibold mb-1">{t('reports.title')}</h2>
        <p className="text-gray-500">{t('reports.subtitle')}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('reports.filters')}
          </CardTitle>
          <CardDescription>
            {t('reports.filtersSub')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 md:gap-6 items-start">
            {/* Start Date */}
            <div className="md:col-span-1 xl:col-span-3 space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                {t('reports.startDate')}
              </Label>
              <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-1">
                <Select value={startYear} onValueChange={setStartYear}>
                  <SelectTrigger className="px-3">
                    <SelectValue placeholder="Yil" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={startMonth} onValueChange={setStartMonth}>
                  <SelectTrigger className="px-3">
                    <SelectValue placeholder="Oy" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {months.map((m, i) => <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <DayGrid selectedDay={startDay} onSelect={setStartDay} year={startYear} month={startMonth} label="Kun" />
              </div>
            </div>

            {/* End Date */}
            <div className="md:col-span-1 xl:col-span-3 space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                {t('reports.endDate')}
              </Label>
              <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-1">
                <Select value={endYear} onValueChange={setEndYear}>
                  <SelectTrigger className="px-3">
                    <SelectValue placeholder="Yil" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={endMonth} onValueChange={setEndMonth}>
                  <SelectTrigger className="px-3">
                    <SelectValue placeholder="Oy" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {months.map((m, i) => <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <DayGrid selectedDay={endDay} onSelect={setEndDay} year={endYear} month={endMonth} label="Kun" />
              </div>
            </div>

            {/* Other Selection Filters */}
            <div className="md:col-span-2 xl:col-span-2 space-y-2">
              <Label>{t('letter.index')}</Label>
              <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {indices.map(idx => (
                    <SelectItem key={idx.id} value={idx.code}>{idx.code} - {idx.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 xl:col-span-2 space-y-2">
              <Label>{t('letter.executor')}</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.fish}>{u.fish}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 xl:col-span-2 space-y-2">
              <Label>{t('letter.sortBy')}</Label>
              <Select
                value={sortConfig?.direction || 'none'}
                onValueChange={(v: any) => handleSort(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('letter.sortDefault')}</SelectItem>
                  <SelectItem value="asc">{t('letter.sortAsc')}</SelectItem>
                  <SelectItem value="desc">{t('letter.sortDesc')}</SelectItem>
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
                {t('reports.formatTitle')}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                {t('reports.formatSub')}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  t('letter.number'),
                  t('letter.date'),
                  t('letter.index'),
                  t('letter.recipient'),
                  t('letter.subject'),
                  t('letter.summary'),
                  t('letter.pageCount'),
                  t('letter.attachmentPageCount'),
                  t('letter.executor'),
                  t('letter.position'),
                ].map((col) => (
                  <Badge key={col} variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                    {col}
                  </Badge>
                ))}
              </div>
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
          {t('reports.excelExport')}
        </Button>
        <Button
          variant="outline"
          onClick={exportToPDF}
        >
          <FileText className="w-4 h-4 mr-2" />
          {t('reports.pdfExport')}
        </Button>
      </div>

      {/* Preview Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{t('reports.results')} ({filteredLetters.length})</CardTitle>
            <CardDescription>
              {t('reports.resultsSub')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-normal">{t('common.count')}</span>
            <Select value={limit.toString()} onValueChange={(v: string) => { setLimit(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue placeholder="Soni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
          <>
          <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">{t('common.no')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.number')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.date')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.index')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.recipient')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.subject')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.summary')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.pageCount')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.attachmentPageCount')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.executor')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('letter.position')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLetters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        {t('reports.notFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLetters.map((letter, index) => (
                      <TableRow key={letter.id}>
                        <TableCell className="text-center text-gray-500">{(page - 1) * limit + index + 1}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{letter.letterNumber || t('letter.notRegistered')}</TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {new Date(letter.letterDate).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">{letter.indexCode} - {letter.indexName}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={letter.recipient}>{letter.recipient}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={letter.subject}>{letter.subject}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-gray-400 text-xs" title={letter.summary}>{letter.summary || '-'}</TableCell>
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
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-gray-500">
                {t('common.page')} {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
