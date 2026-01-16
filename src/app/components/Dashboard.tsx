import React from 'react';
import { Users, Hash, FileText, TrendingUp, Plus, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAdmin } from '../contexts/AdminContext';

import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { users, indices, letters } = useAdmin();
  const navigate = useNavigate();

  const onNavigateToAction = (path: string, action?: string) => {
    navigate(action ? `${path}?action=${action}` : path);
  };

  const todayLetters = letters.filter(
    letter => letter.createdDate === new Date().toISOString().split('T')[0]
  ).length;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const thisWeekLetters = letters.filter(
    letter => new Date(letter.createdDate) >= weekStart
  ).length;

  const activeUsers = users.filter(user => user.status === 'active').length;
  const activeIndices = indices.filter(index => index.status === 'active').length;

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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Dashboard</h2>
        <p className="text-gray-500">Tizim ko'rsatkichlari va tezkor harakatlar</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onClick={() => navigate('/admin/reports')}
            >
              <Download className="w-6 h-6" />
              <span>Hisobot eksport</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Letters */}
      <Card>
        <CardHeader>
          <CardTitle>So'nggi xatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {letters.slice(0, 5).map((letter) => (
              <div
                key={letter.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{letter.letterNumber} - {letter.subject}</p>
                  <p className="text-sm text-gray-500">{letter.userFish}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{letter.indexCode}</p>
                  <p className="text-xs text-gray-500">{letter.createdDate}</p>
                </div>
              </div>
            ))}
            {letters.length === 0 && (
              <p className="text-center text-gray-500 py-8">Hali xatlar yo'q</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
