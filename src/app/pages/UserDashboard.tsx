import React, { useEffect, useState } from 'react';
import { api } from '../services/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Send, CheckCircle, Clock } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

export function UserDashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        registered: 0,
        drafts: 0,
        recentLetters: [] as any[]
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        // In a real API, we'd have a specific endpoint for dashboard stats
        // For mock, we just fetch all letters and calculate
        const res = await api.letters.list({ limit: 5 }); // Get recent 5
        // To get totals we'd need a separate call or just rely on 'total' from metadata if it reflects filtered view? 
        // Actually mock list returns total. But we need breakdown.
        // Let's assume for mock we just fetch all (mock data is small) or improve mock API.

        // Quick improvement for mock stats:
        // We'll just fetch a larger list to calc stats clientside for now as it's mock
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

            {/* Recent Activity Section could go here, reusing LettersList or a simplified table */}
            <h3 className="text-lg font-semibold mt-8 mb-4">So'nggi xatlar</h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
                {stats.recentLetters.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Hozircha xatlar yo'q</p>
                ) : (
                    <div className="space-y-4">
                        {stats.recentLetters.map(letter => (
                            <div
                                key={letter.id}
                                onClick={() => navigate(`/letters/${letter.id}`, { state: { from: 'dashboard' } })}
                                className="flex item-center justify-between border-b pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-lg transition-colors dark:border-gray-700"
                            >
                                <div>
                                    <p className="font-medium dark:text-gray-200">{letter.letterNumber || 'Raqamlanmagan'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{letter.subject}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${letter.status === 'REGISTERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                    {letter.status === 'REGISTERED' ? 'Ro\'yxatga olingan' : 'Qoralama'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
