import {
  format,
  isToday,
  isYesterday,
  isThisYear,
  differenceInMinutes,
  differenceInHours,
  isSameDay as dateFnsIsSameDay,
  parseISO,
} from 'date-fns';

function ensureDate(input: Date | string): Date {
  if (typeof input === 'string') {
    return parseISO(input);
  }
  return input;
}

export function formatMessageTime(dateInput: Date | string): string {
  try {
    const date = ensureDate(dateInput);
    return format(date, 'h:mm a');
  } catch {
    return '';
  }
}

export function formatDateSeparator(dateInput: Date | string): string {
  try {
    const date = ensureDate(dateInput);
    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    if (isThisYear(date)) {
      return format(date, 'EEEE, MMMM d');
    }
    return format(date, 'MMMM d, yyyy');
  } catch {
    return '';
  }
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  try {
    return dateFnsIsSameDay(ensureDate(d1), ensureDate(d2));
  } catch {
    return false;
  }
}

export function formatLastSeen(lastSeenInput: Date | string | null | undefined, isOnline: boolean): string {
  if (isOnline) {
    return 'Online';
  }
  if (!lastSeenInput) {
    return 'Offline';
  }

  try {
    const date = ensureDate(lastSeenInput);
    const now = new Date();
    const minutesAgo = differenceInMinutes(now, date);
    const hoursAgo = differenceInHours(now, date);

    if (minutesAgo < 1) {
      return 'Active just now';
    }
    if (minutesAgo < 60) {
      return `Active ${minutesAgo}m ago`;
    }
    if (hoursAgo < 24 && isToday(date)) {
      return `Active today at ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `Active yesterday at ${format(date, 'h:mm a')}`;
    }
    return `Last seen ${format(date, 'MMM d, h:mm a')}`;
  } catch {
    return 'Offline';
  }
}

