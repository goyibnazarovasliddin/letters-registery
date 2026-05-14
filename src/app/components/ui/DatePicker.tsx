import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from './utils';
import { useT } from '../../contexts/LanguageContext';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  disabled?: boolean;
  className?: string;
}

const toISO = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function DatePicker({ value, onChange, max, min, disabled, className }: DatePickerProps) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);

  const selected = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ';
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(locale, { month: 'long' })
  );
  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const isDisabled = (iso: string) => {
    if (max && iso > max) return true;
    if (min && iso < min) return true;
    return false;
  };

  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : t('letter.dateEmpty');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-start font-normal gap-2', className)}
        >
          <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
          <span>{display}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center justify-between mb-3">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold capitalize">
            {monthNames[viewMonth]} {viewYear}
          </span>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((d) => (
            <div key={d} className="w-9 h-7 flex items-center justify-center text-[11px] font-medium text-gray-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`e${i}`} className="w-9 h-9" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const iso = toISO(viewYear, viewMonth, day);
            const isSelected = iso === value;
            const dis = isDisabled(iso);
            return (
              <button
                key={day}
                type="button"
                disabled={dis}
                onClick={() => { onChange(iso); setOpen(false); }}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-md text-sm transition-colors',
                  isSelected
                    ? 'bg-green-600 text-white font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                  dis && 'opacity-30 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent'
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
