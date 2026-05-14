import { Loader2 } from 'lucide-react';
import { cn } from './utils';

interface PageLoaderProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export function PageLoader({ label = 'Yuklanmoqda...', fullScreen = false, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400',
        fullScreen ? 'min-h-screen' : 'min-h-[300px] py-12',
        'animate-in fade-in duration-300',
        className
      )}
    >
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function InlineLoader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400', className)}>
      <Loader2 className="w-4 h-4 animate-spin" />
      {label && <span>{label}</span>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 border rounded-md bg-white dark:bg-gray-900">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 flex-1 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" style={{ animationDelay: `${(i * cols + j) * 50}ms` }} />
          ))}
        </div>
      ))}
    </div>
  );
}
