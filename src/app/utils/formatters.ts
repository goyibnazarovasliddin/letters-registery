import { format } from 'date-fns';

export function formatDateTime(date: string | Date | undefined | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    // Format: YYYY-MM-DD HH:mm:ss.SSS
    return format(d, 'yyyy-MM-dd HH:mm:ss.SSS');
}

export function formatDate(date: string | Date | undefined | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'yyyy-MM-dd');
}

export function getSequence(ln?: string): number {
    if (!ln) return 0;
    const parts = ln.split('/');
    if (parts.length < 2) return 0;
    const seq = parseInt(parts[1], 10);
    return isNaN(seq) ? 0 : seq;
}
