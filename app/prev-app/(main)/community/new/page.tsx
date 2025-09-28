'use client';
export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreatePost } from '@/src/hooks/api/usePosts';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Card, CardContent } from '@/src/components/ui/card';
import { toast } from 'sonner';
import { validateAndDedupeFiles } from '@/src/lib/file-utils';
import { Progress } from '@/src/components/ui/progress';

export default function NewCommunityPostPage() {
  return (
    <Suspense fallback={null}>
      <NewCommunityPostPageInner />
    </Suspense>
  );
}

function FileList({
  files,
  progresses,
  onRemove,
}: {
  files: File[];
  progresses?: Record<string, number>;
  onRemove?: (index: number) => void;
}) {
  const keyOf = (f: File) => `${f.name}_${f.size}_${(f as any).lastModified}`;
  return (
    <div className="mt-2 space-y-2">
      {files.map((f, idx) => {
        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(f.name);
        const k = keyOf(f);
        const p = progresses?.[k];
        return (
          <div key={k} className="border rounded p-2 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-14 h-14 rounded bg-muted flex items-center justify-center overflow-hidden">
                {isImage ? (
                  <span className="text-[10px] px-1">IMG</span>
                ) : (
                  <span className="text-[10px] px-1">{f.name.split('.').pop()?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate" title={f.name}>{f.name}</div>
                  <div className="text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                  {onRemove && (
                    <button type="button" className="ml-auto text-xs underline" onClick={() => onRemove(idx)}>
                      제거
                    </button>
                  )}
                </div>
                {typeof p === 'number' && (
                  <div className="mt-1">
                    <Progress value={p} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NewCommunityPostPageInner() {
  const router = useRouter();
  const create = useCreatePost();
  const params = useSearchParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<string>('GENERAL');
  const [category, setCategory] = useState<string>('FREE');
  const [tags, setTags] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (prefilledRef.current) return;
    const t = params.get('title');
    const c = params.get('content');
    if (t) setTitle(t);
    if (c) setContent(c);
    if (t || c) prefilledRef.current = true;
  }, [params]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const filtered = validateAndDedupeFiles(list, files, { maxEachMB: 10, maxCount: 10 });
    if (filtered.length < files.length + list.length) {
      toast.warning('일부 파일이 확장자/용량 제한으로 제외되었습니다.');
    }
    setFiles(filtered);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력하세요');
      return;
    }
    try {
      await create.trigger({
        title: title.trim(),
        content: content.trim(),
        type,
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        files,
        onProgress: (p) => {
          setProgress(p);
          // 전체 진행률만 표시하지만, 파일별 키에 동일한 값을 반영해 리스트 진행률을 느낌적으로 제공
          const next: Record<string, number> = {};
          files.forEach((f) => {
            const k = `${f.name}_${f.size}_${(f as any).lastModified}`;
            next[k] = p;
          });
          setProgressMap(next);
        },
      });
      toast.success('게시글이 등록되었습니다');
      router.push('/community');
    } catch (err: any) {
      toast.error('등록 실패', {
        description: err?.response?.data?.message || '잠시 후 다시 시도해주세요.',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">새 게시글 작성</h1>
        <Button variant="outline" onClick={() => router.push('/community')}>
          ← 목록
        </Button>
      </div>
      <Card>
        <CardContent className="py-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">타입</label>
                <select
                  className="border rounded-md px-3 h-10 w-full bg-background"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="GENERAL">일반</option>
                  <option value="NOTICE">공지사항</option>
                  <option value="EVENT">이벤트</option>
                  <option value="GUIDE">가이드</option>
                  <option value="FAQ">FAQ</option>
                  <option value="NEWS">뉴스</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">카테고리</label>
                <select
                  className="border rounded-md px-3 h-10 w-full bg-background"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="FREE">자유게시판</option>
                  <option value="TRAVEL_REVIEW">여행후기</option>
                  <option value="TRAVEL_TIP">여행팁</option>
                  <option value="TRAVEL_QNA">여행Q&A</option>
                  <option value="TRAVEL_COMPANION">동행찾기</option>
                  <option value="TRAVEL_RECOMMEND">여행추천</option>
                  <option value="PHOTO">사진</option>
                  <option value="VIDEO">동영상</option>
                  <option value="FOOD">맛집</option>
                  <option value="ACCOMMODATION">숙소</option>
                  <option value="TRANSPORTATION">교통</option>
                  <option value="BUDGET">예산</option>
                  <option value="CULTURE">문화</option>
                  <option value="SHOPPING">쇼핑</option>
                  <option value="EMERGENCY">긴급</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">내용</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={10}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">태그(쉼표로 구분)</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="예: 여행,후기"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium mb-1">
                  첨부파일 (최대 10개, 개별 10MB)
                </label>
                {files.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setFiles([])}>
                    모두 지우기
                  </Button>
                )}
              </div>
              <div
                role="button"
                tabIndex={0}
                className="border-2 border-dashed rounded-md p-4 text-sm text-muted-foreground hover:bg-accent/30 focus:outline-hidden"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const dt = e.dataTransfer;
                  if (!dt?.files?.length) return;
                  const fakeEvent = { target: { files: dt.files } } as any;
                  onFileChange(fakeEvent);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    const input = document.getElementById('file-input') as HTMLInputElement | null;
                    input?.click();
                  }
                }}
                aria-label="첨부파일 드래그 앤 드롭 영역"
              >
                이 영역에 파일을 드래그하세요 또는 클릭하여 선택
              </div>
              <Input
                id="file-input"
                className="mt-2"
                type="file"
                multiple
                onChange={onFileChange}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.hwp,.docx,.zip"
              />
              {files.length > 0 && (
                <FileList files={files} progresses={progressMap} onRemove={(i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i))} />
              )}
            </div>
            {progress > 0 && progress < 100 && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">업로드 중... {progress}%</div>
                <Progress value={progress} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" disabled={create.isMutating}>
                등록
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
