import { LetterDTO, UserDTO, FileMeta, AuthResponse } from '../../types/portal';

// Keys for localStorage
const STORAGE_KEYS = {
    USERS: 'mock_portal_users',
    LETTERS: 'mock_portal_letters',
    FILES: 'mock_portal_files',
    AUTH: 'mock_portal_auth_session'
};

// Initial Mock Data
const INITIAL_USERS: UserDTO[] = [
    {
        id: '1',
        username: 'user',
        fullName: 'Eshmatov Toshmat',
        position: 'Bosh Mutaxassis',
        role: 'user',
        status: 'active',
        mustChangePasswordOnNextLogin: false,
        settings: {
            allowBackdatedLetters: false
        }
    },
    {
        id: '2',
        username: 'newuser',
        fullName: 'Yangi Xodim',
        position: 'Kichik Mutaxassis',
        role: 'user',
        status: 'active',
        mustChangePasswordOnNextLogin: true, // For testing force change password
        settings: {
            allowBackdatedLetters: true
        }
    }
];

const INITIAL_LETTERS: LetterDTO[] = [
    {
        id: '101',
        indexId: '1',
        indexCode: '01-01',
        indexName: 'Vazirliklar',
        recipient: 'Moliya Vazirligi',
        subject: 'Yillik hisobot bo\'yicha',
        summary: '2025 yilgi moliyaviy hisobot taqdim etilmoqda',
        letterPages: 2,
        attachmentPages: 5,
        letterDate: new Date().toISOString().split('T')[0],
        status: 'REGISTERED',
        userFish: 'Eshmatov Toshmat',
        userPosition: 'Bosh Mutaxassis',
        userId: '1',
        createdDate: new Date().toISOString(),
        files: {
            xat: {
                id: 'f1',
                kind: 'XAT',
                fileName: 'hisobot_2025.pdf',
                mimeType: 'application/pdf',
                size: 2048000,
                createdAt: new Date().toISOString()
            },
            ilova: []
        }
    }
];

// Helper to delay (simulate network)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Mock Data Accessors ---

export const getMockUsers = (): UserDTO[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!stored) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
    }
    return JSON.parse(stored);
};

export const getMockLetters = (): LetterDTO[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.LETTERS);
    if (!stored) {
        localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(INITIAL_LETTERS));
        return INITIAL_LETTERS;
    }
    return JSON.parse(stored);
};

export const saveMockLetters = (letters: LetterDTO[]) => {
    localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
};

export const saveMockUsers = (users: UserDTO[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

// --- Mock API Functions ---

export const mockAuthLogin = async (username: string, password: string): Promise<AuthResponse> => {
    await delay(500);
    const users = getMockUsers();
    // Simple password check (length > 3) and username match
    const user = users.find(u => u.username === username);

    if (user && password.length >= 4) {
        const token = 'mock_jwt_token_' + Math.random().toString(36).substr(2);
        return {
            accessToken: token,
            user
        };
    }
    throw new Error('Login yoki parol noto\'g\'ri');
};

export const mockGetLetters = async (params: any = {}) => {
    await delay(400);
    let letters = getMockLetters();

    // Filtering
    if (params.q) {
        const q = params.q.toLowerCase();
        letters = letters.filter(l =>
            l.recipient.toLowerCase().includes(q) ||
            l.subject.toLowerCase().includes(q)
        );
    }

    if (params.status && params.status !== 'all') {
        letters = letters.filter(l => l.status === params.status);
    }

    // Sort (newest first)
    letters.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

    // Pagination
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const total = letters.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = letters.slice(start, start + limit);

    return {
        items,
        meta: {
            page,
            limit,
            total,
            totalPages
        }
    };
};

export const mockCreateLetter = async (data: Partial<LetterDTO>): Promise<LetterDTO> => {
    await delay(800);
    const letters = getMockLetters();

    const newLetter: LetterDTO = {
        id: Math.random().toString(36).substr(2, 9),
        indexId: data.indexId!,
        indexCode: data.indexCode!,
        indexName: data.indexName!,
        recipient: data.recipient!,
        subject: data.subject!,
        summary: data.summary,
        letterPages: Number(data.letterPages),
        attachmentPages: Number(data.attachmentPages),
        letterDate: data.letterDate!,
        status: data.status as 'DRAFT' | 'REGISTERED',
        userFish: data.userFish!,
        userPosition: data.userPosition!,
        userId: data.userId!,
        createdDate: new Date().toISOString(),
        files: {
            xat: undefined, // Will be attached via update usually, but can be passed mock
            ilova: []
        }
    };

    // If files are passed in mock (simplification):
    if (data.files) {
        newLetter.files = data.files;
    }

    letters.unshift(newLetter);
    saveMockLetters(letters);
    return newLetter;
};

export const mockUploadFile = async (file: File, kind: 'XAT' | 'ILOVA'): Promise<FileMeta> => {
    // Simulate progress
    await delay(1500);

    return {
        id: Math.random().toString(36).substr(2, 9),
        kind,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt: new Date().toISOString()
    };
};

export const mockRegisterLetter = async (id: string): Promise<LetterDTO> => {
    await delay(500);
    const letters = getMockLetters();
    const index = letters.findIndex(l => l.id === id);

    if (index === -1) throw new Error('Xat topilmadi');

    // Update status
    letters[index].status = 'REGISTERED';
    saveMockLetters(letters);

    return letters[index];
};
