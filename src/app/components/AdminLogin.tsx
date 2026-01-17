import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import agrobankLogo from '../../assets/agrobank-logo.webp';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
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
          <div className="mx-auto w-16 h-16 aspect-square bg-white rounded-xl flex items-center justify-center p-2 shadow-md border">
            <img src={agrobankLogo} alt="Agrobank Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl">Markaziy Agrobank</CardTitle>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
