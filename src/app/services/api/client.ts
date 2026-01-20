import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { AuthResponse, PaginatedList, LetterDTO, FileMeta, UserDTO } from '../../types/portal';

// 1) Base URL setup
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL
});

const STORAGE_KEYS = {
    USER_SESSION: 'mock_portal_auth_session',
    ADMIN_TOKEN: 'admin_token'
};

const ADMIN_ENDPOINTS = [
    '/users',
    '/departments',
    '/indices',
    '/settings'
];

// Helper to safely access window/localStorage
const isBrowser = typeof window !== 'undefined';

const getStorageItem = (key: string): string | null => {
    if (!isBrowser) return null;
    return localStorage.getItem(key);
};

const removeStorageItem = (key: string): void => {
    if (!isBrowser) return;
    localStorage.removeItem(key);
};

// 3) Token selection logic
const getAccessToken = (config: InternalAxiosRequestConfig): string | null => {
    const url = config.url || '';

    // Check if request is strictly for an admin endpoint
    const isAdminEndpoint = ADMIN_ENDPOINTS.some(endpoint => url.startsWith(endpoint));

    // Also check UI path for backward compatibility/context
    const isAdminPath = isBrowser && window.location.pathname.startsWith('/admin');

    if (isAdminEndpoint || isAdminPath) {
        return getStorageItem(STORAGE_KEYS.ADMIN_TOKEN);
    }

    // Default to user token
    const storedAuth = getStorageItem(STORAGE_KEYS.USER_SESSION);
    if (storedAuth) {
        try {
            const session = JSON.parse(storedAuth);
            return session.accessToken || null;
        } catch (e) {
            console.error('Failed to parse user session', e);
            return null;
        }
    }

    return null;
};

// Request interceptor
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = getAccessToken(config);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // 2) Fix return
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response && error.response.status === 401) {
            if (isBrowser) {
                // 4) Smart token removal & redirection
                const isAdminPath = window.location.pathname.startsWith('/admin');

                // Clear the relevant token based on context
                if (isAdminPath) {
                    removeStorageItem(STORAGE_KEYS.ADMIN_TOKEN);
                    if (!window.location.pathname.includes('/admin/login')) {
                        window.location.href = '/admin/login';
                    }
                } else {
                    removeStorageItem(STORAGE_KEYS.USER_SESSION);
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export const api = {
    auth: {
        login: async (username: string, password: string): Promise<AuthResponse> => {
            const response = await axiosInstance.post<AuthResponse>('/auth/login', { username, password });
            return response.data;
        },
        changePassword: async (newPassword: string): Promise<void> => {
            await axiosInstance.post('/auth/change-password', { newPassword });
        },
        me: async (): Promise<UserDTO> => {
            const response = await axiosInstance.get<UserDTO>('/auth/me');
            return response.data;
        }
    },

    letters: {
        list: async (params: any): Promise<PaginatedList<LetterDTO>> => {
            const response = await axiosInstance.get<PaginatedList<LetterDTO>>('/letters', { params });
            return response.data;
        },

        create: async (data: any): Promise<LetterDTO> => {
            const formData = new FormData();

            // Append text fields
            Object.keys(data).forEach(key => {
                if (key !== 'xatFile' && key !== 'ilovaFiles' && data[key] !== null && data[key] !== undefined) {
                    // 5) Ensure strings
                    formData.append(key, String(data[key]));
                }
            });

            // Append files
            if (data.xatFile) {
                formData.append('xatFile', data.xatFile);
            }
            if (data.ilovaFiles && Array.isArray(data.ilovaFiles)) {
                data.ilovaFiles.forEach((file: File) => {
                    formData.append('ilovaFiles', file);
                });
            }

            // 5) Remove manual Content-Type
            const response = await axiosInstance.post<LetterDTO>('/letters', formData);
            return response.data;
        },

        update: async (id: string, data: any): Promise<LetterDTO> => {
            const formData = new FormData();

            // Append text fields
            Object.keys(data).forEach(key => {
                if (key !== 'xatFile' && key !== 'ilovaFiles' && data[key] !== null && data[key] !== undefined) {
                    formData.append(key, String(data[key]));
                }
            });

            // Append files
            if (data.xatFile) {
                formData.append('xatFile', data.xatFile);
            }
            if (data.ilovaFiles && Array.isArray(data.ilovaFiles)) {
                data.ilovaFiles.forEach((file: File) => {
                    formData.append('ilovaFiles', file);
                });
            }

            // 5) Remove manual Content-Type
            const response = await axiosInstance.put<LetterDTO>(`/letters/${id}`, formData);
            return response.data;
        },

        get: async (id: string): Promise<LetterDTO> => {
            const response = await axiosInstance.get<LetterDTO>(`/letters/${id}`);
            return response.data;
        },

        register: async (id: string): Promise<LetterDTO> => {
            const response = await axiosInstance.post<LetterDTO>(`/letters/${id}/register`);
            return response.data;
        }
    },

    files: {
        upload: async (file: File, kind: 'XAT' | 'ILOVA'): Promise<FileMeta> => {
            throw new Error('Use api.letters.create for uploads');
        },

        download: async (fileId: string): Promise<void> => {
            try {
                // 6) Blob download
                const response = await axiosInstance.get(`/letters/files/${fileId}/download`, {
                    responseType: 'blob'
                });

                const contentType = response.headers['content-type'];
                const contentDisposition = response.headers['content-disposition'];

                let fileName = 'document';

                // 6) Robust filename parsing
                if (contentDisposition) {
                    // Start by checking for UTF-8 filename
                    const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-\.]+)(?:; ?|$)/i;
                    const utf8Match = contentDisposition.match(utf8FilenameRegex);

                    if (utf8Match && utf8Match[1]) {
                        fileName = decodeURIComponent(utf8Match[1]);
                    } else {
                        // Fallback to standard filename
                        const filenameRegex = /filename="?([^"]+)"?/;
                        const standardMatch = contentDisposition.match(filenameRegex);
                        if (standardMatch && standardMatch[1]) {
                            fileName = standardMatch[1];
                        }
                    }
                }

                const blob = new Blob([response.data], { type: contentType });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();

                // Cleanup
                link.remove();
                window.URL.revokeObjectURL(url);

            } catch (e) {
                console.error("Download failed", e);
                // 6) Graceful error
                throw new Error("Faylni yuklab olish imkonsiz");
            }
        }
    },

    // Admin / Reference Data
    indices: {
        list: async () => {
            const response = await axiosInstance.get('/indices');
            return response.data;
        },
        create: async (data: { code: string, name: string }) => {
            const response = await axiosInstance.post('/indices', data);
            return response.data;
        },
        update: async (id: string, data: { code: string, name: string }) => {
            const response = await axiosInstance.put(`/indices/${id}`, data);
            return response.data;
        },
        delete: async (id: string) => {
            const response = await axiosInstance.delete(`/indices/${id}`);
            return response.data;
        },
        updateStatus: async (id: string, status: string) => {
            const response = await axiosInstance.patch(`/indices/${id}/status`, { status });
            return response.data;
        },
        permanentDelete: async (id: string) => {
            const response = await axiosInstance.delete(`/indices/${id}/permanent`);
            return response.data;
        }
    },

    departments: {
        list: async () => {
            const response = await axiosInstance.get('/departments');
            return response.data;
        },
        create: async (data: { name: string, description?: string }) => {
            const response = await axiosInstance.post('/departments', data);
            return response.data;
        },
        update: async (id: string, data: { name: string, description?: string }) => {
            const response = await axiosInstance.put(`/departments/${id}`, data);
            return response.data;
        },
        delete: async (id: string) => {
            const response = await axiosInstance.delete(`/departments/${id}`);
            return response.data;
        },
        updateStatus: async (id: string, status: string) => {
            const response = await axiosInstance.patch(`/departments/${id}/status`, { status });
            return response.data;
        },
        permanentDelete: async (id: string) => {
            const response = await axiosInstance.delete(`/departments/${id}/permanent`);
            return response.data;
        }
    },

    users: {
        list: async () => {
            const response = await axiosInstance.get('/users');
            return response.data;
        },
        create: async (data: any) => {
            const response = await axiosInstance.post('/users', data);
            return response.data;
        },
        update: async (id: string, data: any) => {
            const response = await axiosInstance.put(`/users/${id}`, data);
            return response.data;
        },
        delete: async (id: string) => {
            const response = await axiosInstance.delete(`/users/${id}`);
            return response.data;
        },
        resetPassword: async (userId: string) => {
            const response = await axiosInstance.post(`/users/${userId}/reset-password`);
            return response.data;
        },
        updateStatus: async (id: string, status: string) => {
            const response = await axiosInstance.patch(`/users/${id}/status`, { status });
            return response.data;
        },
        permanentDelete: async (id: string) => {
            const response = await axiosInstance.delete(`/users/${id}/permanent`);
            return response.data;
        }
    },

    settings: {
        get: async () => {
            const response = await axiosInstance.get('/settings');
            return response.data;
        },
        update: async (data: { allowPastDates: boolean }) => {
            const response = await axiosInstance.put('/settings', data);
            return response.data;
        }
    }
};
