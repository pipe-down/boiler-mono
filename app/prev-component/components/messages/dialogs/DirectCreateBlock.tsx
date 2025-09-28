import React from 'react';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { toast } from 'sonner';
import { searchUsers } from '@/src/services/api/users';

export function DirectCreateBlock({
  onCreateConversation,
  onClose,
}: {
  onCreateConversation: (participantIds: string[], name?: string) => void;
  onClose: () => void;
}) {
  const [loginId, setLoginId] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<
    Array<{ id: number; name: string; email?: string; loginId?: string; profileImageUrl?: string }>
  >([]);
  const [selected, setSelected] = React.useState<{ id: number; name: string } | null>(null);

  async function handleVerify() {
    const q = loginId.trim();
    if (!q) {
      toast.error('로그인 ID를 입력하세요');
      return;
    }
    setIsSearching(true);
    try {
      const page = await searchUsers(q, 0, 10);
      const content = Array.isArray(page?.content) ? page.content : [];
      setResults(content);
      if (!content.length) {
        toast.error('해당 로그인 ID의 사용자를 찾을 수 없습니다');
        setSelected(null);
      } else {
        const exact = content.find((u: any) => (u.loginId || '').toLowerCase() === q.toLowerCase());
        if (exact) setSelected({ id: exact.id, name: exact.name || exact.loginId || '사용자' });
        else setSelected({ id: content[0].id, name: content[0].name || '사용자' });
      }
    } catch {
      toast.error('사용자 검색 실패');
      setResults([]);
      setSelected(null);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">상대방 로그인 ID</label>
        <div className="flex gap-2">
          <Input
            placeholder="상대방 로그인 ID"
            value={loginId}
            onChange={(e) => {
              const value = e.target.value;
              setLoginId(value);
              // 입력 값이 바뀌면 이전 검색 결과/선택을 초기화해
              // 잘못된 대상에게 채팅이 열리는 문제를 방지한다.
              setResults([]);
              setSelected(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVerify();
            }}
          />
          <Button variant="outline" size="sm" onClick={handleVerify} disabled={isSearching}>
            {isSearching ? '검증중...' : '검증'}
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <ScrollArea className="h-40 rounded border p-2">
          <div className="space-y-2">
            {results.map((u) => (
              <div
                key={u.id}
                className={`p-2 rounded cursor-pointer ${selected?.id === u.id ? 'bg-accent' : 'hover:bg-accent'}`}
                onClick={() => setSelected({ id: u.id, name: u.name || u.loginId || '사용자' })}
              >
                <div className="text-sm font-medium">{u.name || u.loginId || `User #${u.id}`}</div>
                <div className="text-xs text-muted-foreground">{u.email || ''}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>
          취소
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (!selected) {
              toast.error('대상 사용자를 검색하고 선택해주세요');
              return;
            }
            onCreateConversation([String(selected.id)]);
            onClose();
          }}
          disabled={!selected}
        >
          만들기
        </Button>
      </div>
    </div>
  );
}
