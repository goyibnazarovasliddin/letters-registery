import React, { useState, useEffect } from 'react';
import { api } from '../services/api/client';
import { LetterDTO, PaginatedList } from '../types/portal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { formatDateTime } from '../utils/formatters';

export function LettersList() {
    const [letters, setLetters] = useState<LetterDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLetters();
    }, [page, search, statusFilter, year]);

    const fetchLetters = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.letters.list({ q: search, status: statusFilter, page, limit, year });
            setLetters(res.items);
            setTotalPages(res.meta.totalPages);
        } catch (e) {
            // Only show error toast if not silent or first load, to avoid spamming toasts
            if (!silent) toast.error('Xatlarni yuklashda xatolik');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchLetters();
    }, [page, search, statusFilter, year]);

    // Polling
    useEffect(() => {
        const interval = setInterval(() => {
            fetchLetters(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [page, search, statusFilter, year]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // reset to page 1 on search
        fetchLetters();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Xatlar</h2>
                    <p className="text-gray-500 text-sm">Chiquvchi xatlar ro'yxati</p>
                </div>
                <Button onClick={() => navigate('/letters/new')} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all hover:scale-105">
                    <Plus className="w-4 h-4 mr-2" />
                    Yangi xat
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Xat raqami, indeks kodi, mavzu yoki qabul qiluvchi bo'yicha qidirish..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Holati bo'yicha" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Barcha holatlar</SelectItem>
                            <SelectItem value="DRAFT">Qoralamalar</SelectItem>
                            <SelectItem value="REGISTERED">Ro'yxatga olingan</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Yil" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                            {Array.from({ length: 19 }, (_, i) => new Date().getFullYear() - 1 - i).map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                        <SelectTrigger className="w-[80px]">
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
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center space-y-4">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full overflow-hidden border rounded-lg bg-white dark:bg-gray-900">
                        <div className="w-full overflow-x-auto">
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                    <TableRow>
                                        <TableHead className="w-12 text-center">№</TableHead>
                                        <TableHead>Xat raqami</TableHead>
                                        <TableHead>Ro‘yxatga olingan vaqt</TableHead>
                                        <TableHead>Sana</TableHead>
                                        <TableHead>Mavzu</TableHead>
                                        <TableHead>Mazmuni</TableHead>
                                        <TableHead>Qabul qiluvchi</TableHead>
                                        <TableHead className="text-center">Xat varaqlari</TableHead>
                                        <TableHead className="text-center">Ilova varaqlari</TableHead>
                                        <TableHead>Holati</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {letters.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                                Xatlar topilmadi
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        letters.map((letter, index) => (
                                            <TableRow
                                                key={letter.id}
                                                className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors border-gray-100 dark:border-gray-700"
                                                onClick={() => navigate(`/letters/${letter.id}`, { state: { from: 'list' } })}
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
                                                    {formatDateTime(letter.status === 'REGISTERED' ? (letter.registeredAt || letter.updatedDate) : letter.updatedDate) || '-'}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {new Date(letter.letterDate).toLocaleDateString('ru-RU')}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate dark:text-gray-300">{letter.subject}</TableCell>
                                                <TableCell className="max-w-xs truncate text-gray-500 dark:text-gray-400 text-sm">{letter.summary || '-'}</TableCell>
                                                <TableCell className="dark:text-gray-300">{letter.recipient}</TableCell>
                                                <TableCell className="text-center dark:text-gray-300">{letter.pageCount}</TableCell>
                                                <TableCell className="text-center dark:text-gray-300">{letter.attachmentPageCount}</TableCell>
                                                <TableCell>
                                                    <Badge variant={letter.status === 'REGISTERED' ? 'default' : 'secondary'} className={letter.status === 'REGISTERED' ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300"}>
                                                        {letter.status === 'REGISTERED' ? 'Ro\'yxatga olingan' : 'Qoralama'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                <div className="p-4 border-t flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
                    <Button
                        variant="ghost"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="text-gray-500"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Oldingi
                    </Button>
                    <span className="text-sm text-gray-500">
                        Sahifa {page} / {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        disabled={page === totalPages || totalPages === 0}
                        onClick={() => setPage(p => p + 1)}
                        className="text-gray-500"
                    >
                        Keyingi <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
