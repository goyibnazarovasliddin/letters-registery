import React, { useEffect, useState } from 'react';
import { api } from '../services/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatDateTime } from '../utils/formatters';
import { FileText, Send, CheckCircle, Clock } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

import { Badge } from '../components/ui/badge';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';

export function UserDashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        registered: 0,
        drafts: 0,
        recentLetters: [] as any[]
    });
    const [limit, setLimit] = useState(5);

    useEffect(() => {
        fetchStats();
    }, [limit]);

    const fetchStats = async () => {
        // In a real API, we'd have a specific endpoint for dashboard stats
        const res = await api.letters.list({ limit }); // Use persistent limit

        const all = await api.letters.list({ limit: 1000 });
        const items = all.items;

        setStats({
            total: all.meta.total,
            registered: items.filter(i => i.status === 'REGISTERED').length,
            drafts: items.filter(i => i.status === 'DRAFT').length,
            recentLetters: res.items
        });
    };

    const statCards = [
        { label: 'Jami xatlar', value: stats.total, icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { label: 'Ro\'yxatga olingan', value: stats.registered, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
        { label: 'Qoralamalar', value: stats.drafts, icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Xush kelibsiz, {user?.fullName}</h2>
                <p className="text-gray-500 text-sm">Bugungi ko'rsatkichlaringiz</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((card, i) => (
                    <Card key={i} className="border-none shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800 dark:text-gray-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full ${card.bg} dark:bg-opacity-20 flex items-center justify-center`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                <h3 className="text-2xl font-bold">{card.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex items-center justify-between mt-8 mb-4">
                <h3 className="text-lg font-semibold">So'nggi xatlar</h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Soni:</span>
                    <Select value={limit.toString()} onValueChange={(v: string) => setLimit(Number(v))}>
                        <SelectTrigger className="w-[80px] h-8">
                            <SelectValue placeholder="Soni" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                        <TableRow>
                            <TableHead className="w-12 text-center">№</TableHead>
                            <TableHead>Xat raqami</TableHead>
                            <TableHead>Ro‘yxatga olingan vaqt</TableHead>
                            <TableHead>Sana</TableHead>
                            <TableHead>Indeks</TableHead>
                            <TableHead>Yuborilgan manzil</TableHead>
                            <TableHead>Mavzu</TableHead>
                            <TableHead>Holati</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.recentLetters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Xatlar topilmadi
                                </TableCell>
                            </TableRow>
                        ) : (
                            stats.recentLetters.map((letter, index) => (
                                <TableRow
                                    key={letter.id}
                                    className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors border-gray-100 dark:border-gray-700"
                                    onClick={() => navigate(`/letters/${letter.id}`, { state: { from: 'dashboard' } })}
                                >
                                    <TableCell className="text-center text-gray-500">{index + 1}</TableCell>
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
                                    <TableCell className="dark:text-gray-300">
                                        {new Date(letter.letterDate).toLocaleDateString('ru-RU')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono">
                                            {letter.indexCode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="dark:text-gray-300">{letter.recipient}</TableCell>
                                    <TableCell className="max-w-xs truncate dark:text-gray-300">{letter.subject}</TableCell>
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
    );
}
