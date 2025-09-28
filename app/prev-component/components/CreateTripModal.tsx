import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { X } from '@/src/components/icons';
import type { Trip } from '@/src/types/trip';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trip: Omit<Trip, 'id'>) => void;
}

export function CreateTripModal({ isOpen, onClose, onSubmit }: CreateTripModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    dates: '',
    maxParticipants: '',
    imageUrl: '',
    description: '',
    createdBy: '현재 사용자',
    categories: [] as string[],
  });

  const [newCategory, setNewCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.destination || !formData.dates) return;

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
      destination: '',
      dates: '',
      maxParticipants: '',
      imageUrl: '',
      description: '',
      createdBy: '현재 사용자',
      categories: [],
    });
    setNewCategory('');
  };

  const addCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()],
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat !== categoryToRemove),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>새 여행 계획 만들기</DialogTitle>
          <DialogDescription>
            함께 떠날 동행자를 찾기 위한 여행 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">여행 제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="예: 제주도 힐링 여행"
              required
            />
          </div>

          <div>
            <Label htmlFor="destination">목적지 *</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
              placeholder="예: 제주도, 대한민국"
              required
            />
          </div>

          <div>
            <Label htmlFor="dates">여행 날짜 *</Label>
            <Input
              id="dates"
              value={formData.dates}
              onChange={(e) => setFormData((prev) => ({ ...prev, dates: e.target.value }))}
              placeholder="예: 2024년 4월 15일 - 18일"
              required
            />
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
              max="50"
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">이미지 URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="여행지 이미지 URL (선택사항)"
            />
          </div>

          <div>
            <Label htmlFor="description">여행 설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="여행에 대한 상세한 설명을 작성해주세요..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="categories">카테고리</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="categories"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="카테고리 추가"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              />
              <Button type="button" onClick={addCategory} variant="outline">
                추가
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.categories.map((category) => (
                <Badge key={category} variant="secondary" className="flex items-center gap-1">
                  {category}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeCategory(category)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">여행 만들기</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
