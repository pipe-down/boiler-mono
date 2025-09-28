'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@chatstack/ui';
import { Sun, Moon } from '@chatstack/ui';

// Compact theme toggle for header (design parity)
export function CompactThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const aria = mounted ? `현재 ${isDark ? '다크' : '라이트'} 모드, 클릭하여 변경` : '테마 변경';
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative h-9 w-9 rounded-md transition-all hover:bg-accent"
      aria-label={aria}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
