import React, { useState } from 'react';
import { Building2, Lock, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { toast } from 'sonner';

export function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/admin";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (success) {
      toast.success('Muvaffaqiyatli kirildi');
      navigate(from, { replace: true });
    } else {
      toast.error('Login yoki parol noto\'g\'ri');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Central Agrobank</CardTitle>
          <CardDescription className="text-base">Admin Panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Login</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Kirish
            </Button>
            <p className="text-xs text-center text-gray-500">
              Demo: admin / admin
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
