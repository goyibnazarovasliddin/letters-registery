import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDTO, AuthResponse } from '../types/portal';
import { api } from '../services/api/client';
import { useNavigate } from 'react-router-dom';

interface UserContextType {
    isAuthenticated: boolean;
    user: UserDTO | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    updateUser: (userData: Partial<UserDTO>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check for existing session
        const storedAuth = localStorage.getItem('mock_portal_auth_session');
        if (storedAuth) {
            try {
                const session: AuthResponse = JSON.parse(storedAuth);
                setIsAuthenticated(true);
                setUser(session.user);
            } catch (e) {
                localStorage.removeItem('mock_portal_auth_session');
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        const checkStatus = async () => {
            try {
                const userData = await api.auth.me();

                // Sync status if changed (both activation and deactivation)
                if (user && userData.status !== user.status) {
                    updateUser({ status: userData.status });

                    // If newly activated, show toast? 
                    if (userData.status === 'active' && user.status !== 'active') {
                        // Optional: toast.success("Hisobingiz faollashtirildi");
                    }
                }

                if (userData.status === 'deleted') {
                    logout();
                }

                // Auto-logout if password was changed (reset by admin)
                if (userData.mustChangePasswordOnNextLogin && !user?.mustChangePasswordOnNextLogin) {
                    // update user context first to trigger redirect or just logout
                    logout();
                }

            } catch (e: any) {
                // 403 is now returned for deleted users from me/login endpoint if middleware allows it? 
                // Middleware blocks deleted users? Middleware calls findUnique.
                // If middleware blocks deleted users, it returns 401/403.
                if (e.response && (e.response.status === 401 || e.response.status === 403 || e.response.status === 404)) {
                    logout();
                }
            }
        };

        const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds for faster feedback
        return () => clearInterval(interval);
    }, [isAuthenticated, user?.status]);

    const login = async (username: string, password: string) => {
        try {
            const response = await api.auth.login(username, password);

            setIsAuthenticated(true);
            setUser(response.user);
            localStorage.setItem('mock_portal_auth_session', JSON.stringify(response));

            // Handle redirect logic based on user state
            if (response.user.mustChangePasswordOnNextLogin) {
                navigate('/force-change-password');
            } else {
                navigate('/');
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('mock_portal_auth_session');
        navigate('/login');
    };

    const updateUser = (userData: Partial<UserDTO>) => {
        if (!user) return;
        const newUser = { ...user, ...userData };
        setUser(newUser);

        // Update local storage
        const storedAuth = localStorage.getItem('mock_portal_auth_session');
        if (storedAuth) {
            const session: AuthResponse = JSON.parse(storedAuth);
            session.user = newUser;
            localStorage.setItem('mock_portal_auth_session', JSON.stringify(session));
        }
    };

    return (
        <UserContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
}
