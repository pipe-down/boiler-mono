'use client';

import React from 'react';
import { Button, Input } from '@chatstack/ui';
import { Search } from '@chatstack/ui';

interface HeaderSearchProps {
  query: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function HeaderSearch({ query, onChange, onSubmit }: HeaderSearchProps) {
  return (
    <div className="hidden lg:flex flex-1 max-w-lg mx-6">
      <form onSubmit={onSubmit} className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="여행지, 모임을 검색해보세요..."
          className="pl-10 pr-4 h-10 bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:border-transparent rounded-full"
          data-testid="header-search-input"
        />
        {query && (
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3 rounded-full"
          >
            검색
          </Button>
        )}
      </form>
    </div>
  );
}
