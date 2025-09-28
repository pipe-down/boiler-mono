import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import {
  Bell,
  Check,
  X,
  MapPin,
  Users,
  Calendar,
  Star,
  MessageCircle,
  Heart,
} from '@/src/components/icons';
import type { Notification } from '@/src/types/notification';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onNotificationClick: (notification: Notification) => void;
  onViewAllClick?: () => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNotificationClick,
  onViewAllClick,
}: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'trip_joined':
      case 'meetup_joined':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'review':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'reminder':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'trip_full':
        return <MapPin className="h-4 w-4 text-red-500" />;
      case 'new_trip':
      case 'new_meetup':
        return <Heart className="h-4 w-4 text-pink-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="w-[96vw] sm:w-[560px] md:w-[720px] lg:w-[880px] min-w-[320px] sm:min-w-[420px] min-h-[280px] sm:min-h-[360px] max-h-[85vh] overflow-hidden"
        aria-describedby="notification-description"
        onEscapeKeyDown={() => onClose()}
        onPointerDownOutside={() => onClose()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>알림</span>
            {unreadCount > 0 && <Badge variant="secondary">{unreadCount}개의 새 알림</Badge>}
          </DialogTitle>
        </DialogHeader>
        <div id="notification-description" className="sr-only">
          받은 알림들을 확인하고 관리할 수 있습니다.
        </div>

        <div className="space-y-4">
          {/* 액션 버튼들 */}
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={onMarkAllAsRead} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  모두 읽음
                </Button>
              )}
            </div>
          )}

          {/* 알림 목록 */}
          <div className="space-y-2 max-h-[55vh] sm:max-h-[60vh] md:max-h-[65vh] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>새로운 알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDeleteNotification}
                    onClick={onNotificationClick}
                    getIcon={getNotificationIcon}
                    formatTime={formatTimestamp}
                  />
                  {index < notifications.length - 1 && <Separator />}
                </React.Fragment>
              ))
            )}
          </div>
          {notifications.length > 0 && onViewAllClick && (
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={onViewAllClick}>
                전체보기
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  getIcon: (type: Notification['type']) => React.ReactNode;
  formatTime: (timestamp: string) => string;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  getIcon,
  formatTime,
}: NotificationItemProps) {
  return (
    <div
      className={`p-3 rounded-md border cursor-pointer hover:bg-accent/30 transition-colors active:scale-[0.99] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none relative ${
        !notification.isRead ? 'bg-accent/20' : 'bg-background'
      }`}
      onClick={() => onClick(notification)}
      tabIndex={0}
      role="button"
    >
      <div className="flex gap-3">
        {/* 아이콘 또는 아바타 */}
        <div className="flex-shrink-0 mt-1">
          {notification.userAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={notification.userAvatar} alt={notification.userName} />
              <AvatarFallback>{notification.userName?.slice(0, 2)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8 rounded-full bg-accent/30 border border-border flex items-center justify-center">
              {getIcon(notification.type)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatTime(notification.timestamp)}
              </p>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-1">
              {!notification.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  title="읽음 표시"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                title="삭제"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!notification.isRead && (
            <div className="w-2 h-2 bg-primary rounded-full absolute -left-1 top-4" />
          )}
        </div>
      </div>
    </div>
  );
}
