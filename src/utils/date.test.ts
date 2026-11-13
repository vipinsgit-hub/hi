import { describe, it, expect } from 'vitest';
import { formatMessageTime, formatDateSeparator, isSameDay, formatLastSeen } from './date';

describe('Date formatting utilities', () => {
  it('formats message time cleanly', () => {
    const date = new Date(2026, 1, 12, 14, 30);
    const formatted = formatMessageTime(date);
    expect(formatted).toMatch(/2:30\s*PM/);
  });

  it('formats today as "Today"', () => {
    const now = new Date();
    expect(formatDateSeparator(now)).toBe('Today');
  });

  it('formats yesterday as "Yesterday"', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatDateSeparator(yesterday)).toBe('Yesterday');
  });

  it('correctly compares dates on same day', () => {
    const d1 = new Date(2026, 1, 12, 9, 0);
    const d2 = new Date(2026, 1, 12, 18, 0);
    const d3 = new Date(2026, 1, 13, 9, 0);
    expect(isSameDay(d1, d2)).toBe(true);
    expect(isSameDay(d1, d3)).toBe(false);
  });

  it('formats presence last seen accurately', () => {
    expect(formatLastSeen(null, true)).toBe('Online');
    expect(formatLastSeen(null, false)).toBe('Offline');
    const recent = new Date(Date.now() - 30000); // 30s ago
    expect(formatLastSeen(recent, false)).toBe('Active just now');
  });
});

