import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { TripSelector } from './TripSelector';
import { toast } from 'sonner';
import type { Message } from '@/src/types/chat';
import { DirectCreateBlock } from './DirectCreateBlock';

export function CreateDialog({
  open,
  onOpenChange,
  onCreateConversation,
  onCreateMeeting,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreateConversation: (participantIds: string[], name?: string) => void;
  onCreateMeeting: (
    tripId: number,
    name?: string,
    description?: string,
  ) => Promise<{ id: number } | { id: string } | void> | void;
  onCreated: (roomId: string) => void;
}) {
  const [createMode, setCreateMode] = React.useState<'direct' | 'meeting'>('direct');
  const [meetingTripId, setMeetingTripId] = React.useState('');
  const [meetingName, setMeetingName] = React.useState('');
  const [meetingDesc, setMeetingDesc] = React.useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>새 대화 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={createMode === 'direct' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreateMode('direct')}
            >
              1:1
            </Button>
            <Button
              variant={createMode === 'meeting' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreateMode('meeting')}
            >
              모임(여행)
            </Button>
          </div>
          {createMode === 'direct' ? (
            <DirectCreateBlock
              onCreateConversation={onCreateConversation}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">내 모임 선택</label>
                <TripSelector onSelect={(id) => setMeetingTripId(String(id))} />
              </div>
              <Input
                placeholder="모임(여행) ID(직접 입력)"
                value={meetingTripId}
                onChange={(e) => setMeetingTripId(e.target.value)}
              />
              <Input
                placeholder="채팅방 이름 (선택)"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
              />
              <Input
                placeholder="설명 (선택)"
                value={meetingDesc}
                onChange={(e) => setMeetingDesc(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={async () => {
                    const tid = Number(meetingTripId);
                    if (!tid) {
                      toast.error('유효한 모임(여행) ID를 입력하세요');
                      return;
                    }
                    try {
                      const res: any = await onCreateMeeting(
                        tid,
                        meetingName || undefined,
                        meetingDesc || undefined,
                      );
                      const newId = res && res.id != null ? String(res.id) : undefined;
                      if (newId) {
                        onCreated(newId);
                        toast.success('모임 채팅이 생성되었습니다.');
                        onOpenChange(false);
                      } else {
                        // onCreateMeeting 내부에서 mutate만 하고 id를 반환하지 않는 경우도 대비
                        // 일단 다이얼로그만 닫고 알림
                        toast.success('모임 채팅이 생성되었습니다.');
                        onOpenChange(false);
                      }
                    } catch (e: any) {
                      toast.error(e?.message || '생성 실패');
                    }
                  }}
                >
                  만들기
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
