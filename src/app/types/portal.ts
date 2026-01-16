export interface LetterDTO {
    id: string;
    letterNumber: string;
    indexId: string;
    indexCode: string;
    indexName: string;
    recipient: string;
    subject: string;
    summary?: string;
    letterPages: number;
    attachmentPages: number;
    letterDate: string; // YYYY-MM-DD
    status: 'DRAFT' | 'REGISTERED';
    userFish: string;
    userPosition: string;
    userId: string;
    createdDate: string; // ISO
    files: {
        xat?: FileMeta;
        ilova: FileMeta[];
    };
}

export interface FileMeta {
    id: string;
    kind: 'XAT' | 'ILOVA';
    fileName: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

export interface UserDTO {
    id: string;
    username: string;
    fullName: string;
    position: string;
    role: 'admin' | 'user';
    status: 'active' | 'disabled' | 'deleted';
    mustChangePasswordOnNextLogin: boolean;
    settings?: {
        allowBackdatedLetters: boolean;
    };
}

export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    user: UserDTO;
}

export interface PaginatedList<T> {
    items: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
