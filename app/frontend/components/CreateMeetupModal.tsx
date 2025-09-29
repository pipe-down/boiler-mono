import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@chatstack/ui';
import type { Meetup } from '@/types/meetup';

interface CreateMeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meetup: Omit<Meetup, 'id'>) => void;
}

export function CreateMeetupModal({ isOpen, onClose, onSubmit }: CreateMeetupModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    time: '',
    maxParticipants: '',
    imageUrl: '',
    description: '',
    createdBy: '현재 사용자',
    category: '',
  });

  const categories = [
    '스포츠',
    '사진',
    '맛집',
    '문화',
    '예술',
    '음악',
    '게임',
    '스터디',
    '네트워킹',
    '기타',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.location ||
      !formData.date ||
      !formData.time ||
      !formData.category
    )
      return;

    onSubmit({
      ...formData,
      participants: 1,
      maxParticipants: parseInt(formData.maxParticipants) || 10,
      imageUrl:
        formData.imageUrl ||
        'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBncm91cCUyMGZyaWVuZHN8ZW58MXx8fHwxNzU2NjA1OTI0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      createdAt: new Date().toISOString(),
    });

    // Reset form
    setFormData({
      title: '',
      location: '',
      date: '',
      time: '',
      maxParticipants: '',
      imageUrl: '',
      description: '',
      createdBy: '현재 사용자',
      category: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>새 모임 만들기</DialogTitle>
          <DialogDescription>
            함께 활동할 사람들을 모으기 위한 모임 정보를 작성해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">모임 제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="예: 한강 자전거 라이딩"
              required
            />
          </div>

          <div>
            <Label htmlFor="location">모임 장소 *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="예: 여의도 한강공원"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">날짜 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">시간 *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">카테고리 *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maxParticipants">최대 참여자 수</Label>
            <Input
              id="maxParticipants"
              type="number"
              value={formData.maxParticipants}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, maxParticipants: e.target.value }))
              }
              placeholder="10"
              min="2"
              max="100"
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">이미지 URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="모임 이미지 URL (선택사항)"
            />
          </div>

          <div>
            <Label htmlFor="description">모임 설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="모임에 대한 상세한 설명을 작성해주세요..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">모임 만들기</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
