'use client';
export const dynamic = 'force-dynamic';

import { useApi } from '@/src/lib/swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import type { Group } from '@/src/types/group';

type GroupList = { items: Group[]; total: number };

export default function GroupsPage() {
  const { data, error, isLoading, mutate } = useApi<GroupList>('/groups');

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">그룹 목록</h2>
          <p className="mt-2 text-sm text-muted-foreground">BFF(/api/v1/groups) 연동</p>
        </div>
        <Button variant="outline" onClick={() => mutate()}>
          새로고침
        </Button>
      </div>

      {isLoading && <div className="mt-6 text-sm text-muted-foreground">로딩 중…</div>}
      {error && (
        <div className="mt-6 text-sm text-destructive">불러오는 중 오류가 발생했습니다.</div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(data?.items ?? []).map((g) => (
          <Card key={g.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{g.name}</span>
                <span className="text-sm text-muted-foreground">{g.memberCount}명</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">그룹 ID: {g.id}</p>
            </CardContent>
          </Card>
        ))}
        {data?.items?.length === 0 && !isLoading && !error && (
          <div className="rounded-2xl p-4 border text-sm text-muted-foreground">
            그룹이 없습니다.
          </div>
        )}
      </div>
    </main>
  );
}
