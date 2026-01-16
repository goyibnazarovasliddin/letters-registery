// Configuration for Data Mode
export const DATA_MODE: 'mock' | 'api' = (import.meta.env.VITE_DATA_MODE as 'mock' | 'api') || 'mock';

export const API_BASE_URL = '/api';

export const IS_MOCK = DATA_MODE === 'mock';
