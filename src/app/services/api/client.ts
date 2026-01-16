import axios from 'axios';
import { AuthResponse, PaginatedList, LetterDTO, FileMeta } from '../../types/portal';

const API_BASE_URL = 'http://localhost:3000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
    async config => {
        const storedAuth = localStorage.getItem('mock_portal_auth_session');
        const adminAuth = localStorage.getItem('admin_token');

        const isPathAdmin = window.location.pathname.startsWith('/admin');

        let token = null;

        if (isPathAdmin && adminAuth) {
            token = adminAuth;
        } else if (storedAuth) {
            const session = JSON.parse(storedAuth);
            if (session.accessToken) token = session.accessToken;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        Promise.reject(error)
    }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
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
                    formData.append(key, data[key]);
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

            const response = await axiosInstance.post<LetterDTO>('/letters', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
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
            // We use window.open for download to trigger browser download behavior
            // We need to use the token for auth if the route is protected.
            // Since it's a simple GET, we might need to handle auth via query param or just open it if it is public (but it shouldn't be).
            // For now, let's assume `window.open` works if we use a special endpoint or if we rely on cookie (which we don't use).
            // ALTERNATIVE: Axios blob download.

            try {
                const response = await axiosInstance.get(`/letters/files/${fileId}/download`, {
                    responseType: 'blob'
                });

                // Create blob link to download
                const contentType = response.headers['content-type'];
                const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
                const link = document.createElement('a');
                link.href = url;

                // Try to get filename from content-disposition
                const contentDisposition = response.headers['content-disposition'];
                let fileName = 'file';
                if (contentDisposition) {
                    const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (fileNameMatch.length === 2)
                        fileName = fileNameMatch[1];
                }

                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (e) {
                console.error("Download failed", e);
                // Fallback or alert
                alert("Faylni yuklab olishda xatolik");
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
    }
};
