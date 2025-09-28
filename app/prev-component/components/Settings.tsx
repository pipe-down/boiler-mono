import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Eye,
  Lock,
  Heart,
  MessageCircle,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Camera,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  Check,
  X,
  HelpCircle,
  ExternalLink,
  CreditCard,
} from '@/src/components/icons';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
  birthDate?: string;
  interests: string[];
  verified: boolean;
  joinDate: string;
}

interface NotificationSettings {
  email: {
    newMessages: boolean;
    tripUpdates: boolean;
    meetupReminders: boolean;
    communityActivity: boolean;
    marketing: boolean;
  };
  push: {
    newMessages: boolean;
    tripUpdates: boolean;
    meetupReminders: boolean;
    communityActivity: boolean;
  };
  inApp: {
    sound: boolean;
    desktop: boolean;
    mobile: boolean;
  };
}

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowMessages: 'everyone' | 'friends' | 'none';
  showOnlineStatus: boolean;
  dataTracking: boolean;
  analyticsOptOut: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
}

interface SettingsProps {
  user: User;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  appearanceSettings: AppearanceSettings;
  onUpdateProfile: (updates: Partial<User>) => void;
  onUpdateNotifications: (settings: NotificationSettings) => void;
  onUpdatePrivacy: (settings: PrivacySettings) => void;
  onUpdateAppearance: (settings: AppearanceSettings) => void;
  onDeleteAccount: () => void;
  onExportData: () => void;
}

export function Settings({
  user,
  notificationSettings,
  privacySettings,
  appearanceSettings,
  onUpdateProfile,
  onUpdateNotifications,
  onUpdatePrivacy,
  onUpdateAppearance,
  onDeleteAccount,
  onExportData,
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    bio: user.bio || '',
    location: user.location || '',
    phone: user.phone || '',
    birthDate: user.birthDate || '',
    interests: user.interests,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleProfileSave = () => {
    onUpdateProfile(profileData);
    setIsEditing(false);
    toast.success('프로필이 업데이트되었습니다.');
  };

  const handleNotificationChange = (
    category: keyof NotificationSettings,
    key: string,
    value: boolean,
  ) => {
    const updatedSettings = {
      ...notificationSettings,
      [category]: {
        ...notificationSettings[category],
        [key]: value,
      },
    };
    onUpdateNotifications(updatedSettings);
    toast.success('알림 설정이 변경되었습니다.');
  };

  const handlePrivacyChange = (key: keyof PrivacySettings, value: any) => {
    const updatedSettings = {
      ...privacySettings,
      [key]: value,
    };
    onUpdatePrivacy(updatedSettings);
    toast.success('개인정보 설정이 변경되었습니다.');
  };

  const handleAppearanceChange = (key: keyof AppearanceSettings, value: string) => {
    const updatedSettings = {
      ...appearanceSettings,
      [key]: value,
    };
    onUpdateAppearance(updatedSettings);
    toast.success('표시 설정이 변경되었습니다.');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === '계정삭제') {
      onDeleteAccount();
      toast.success('계정이 삭제되었습니다.');
    } else {
      toast.error('확인 텍스트가 일치하지 않습니다.');
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-6 w-6 text-slate-600" />
        <h1>설정</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="mb-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2 text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">프로필</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">알림</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 text-xs sm:text-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">개인정보</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2 text-xs sm:text-sm">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">표시</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 text-xs sm:text-sm">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">계정</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="space-y-6">
          {/* 프로필 설정 */}
          <TabsContent value="profile" className="space-y-6 m-0">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    기본 정보
                  </CardTitle>
                  <Button
                    variant={isEditing ? 'default' : 'secondary'}
                    onClick={isEditing ? handleProfileSave : () => setIsEditing(true)}
                  >
                    {isEditing ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        저장
                      </>
                    ) : (
                      '편집'
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xl">
                        {user?.name ? user.name.slice(0, 2) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 p-2 rounded-full"
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3>{user.name}</h3>
                      {user.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          인증됨
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{user.joinDate}부터 Getmoim와 함께</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label>이름</Label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>이메일</Label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={!isEditing}
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>전화번호</Label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="010-1234-5678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>위치</Label>
                    <Input
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      disabled={!isEditing}
                      placeholder="서울, 대한민국"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>자기소개</Label>
                  <Textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder="자신을 소개해보세요..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>관심사</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                        {isEditing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-0 h-auto ml-1"
                            onClick={() => {
                              setProfileData({
                                ...profileData,
                                interests: profileData.interests.filter((i) => i !== interest),
                              });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    ))}
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        <User className="h-3 w-3 mr-1" />
                        추가
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 알림 설정 */}
          <TabsContent value="notifications" className="space-y-6 m-0">
            {/* 채팅 알림/사운드 토글 */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  채팅 알림
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>데스크톱 알림</Label>
                    <p className="text-sm text-muted-foreground">
                      백그라운드/다른 방 수신 시 브라우저 알림 표시
                    </p>
                  </div>
                  <Switch
                    onCheckedChange={(checked) => {
                      try {
                        localStorage.setItem('chat:notify', checked ? 'on' : 'off');
                        if (
                          checked &&
                          'Notification' in window &&
                          Notification.permission === 'default'
                        ) {
                          Notification.requestPermission().then((perm) => {
                            if (perm !== 'granted') localStorage.setItem('chat:notify', 'off');
                          });
                        }
                      } catch {}
                    }}
                    defaultChecked={
                      typeof window !== 'undefined' &&
                      (localStorage.getItem('chat:notify') ?? 'ask') !== 'off'
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>사운드</Label>
                    <p className="text-sm text-muted-foreground">알림 수신 시 짧은 비프음 재생</p>
                  </div>
                  <Switch
                    onCheckedChange={(checked) => {
                      try {
                        localStorage.setItem('chat:sound', checked ? 'on' : 'off');
                      } catch {}
                    }}
                    defaultChecked={
                      typeof window !== 'undefined' &&
                      (localStorage.getItem('chat:sound') ?? 'on') !== 'off'
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  이메일 알림
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>새 메시지</Label>
                    <p className="text-sm text-muted-foreground">새로운 메시지를 받았을 때</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.email?.newMessages || false}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('email', 'newMessages', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>여행 업데이트</Label>
                    <p className="text-sm text-muted-foreground">참여한 여행의 변경사항</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.email?.tripUpdates || false}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('email', 'tripUpdates', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>모임 알림</Label>
                    <p className="text-sm text-muted-foreground">모임 시작 전 알림</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.email?.meetupReminders || false}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('email', 'meetupReminders', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>커뮤니티 활동</Label>
                    <p className="text-sm text-muted-foreground">좋아요, 댓글, 멘션 등</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.email?.communityActivity || false}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('email', 'communityActivity', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>마케팅 정보</Label>
                    <p className="text-sm text-muted-foreground">새로운 기능 및 프로모션</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.email?.marketing || false}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('email', 'marketing', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  푸시 알림
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>사운드</Label>
                    <p className="text-sm text-muted-foreground">알림음 재생</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.inApp?.sound || false}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('inApp', 'sound', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>데스크톱 알림</Label>
                    <p className="text-sm text-muted-foreground">브라우저 알림 표시</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.inApp?.desktop || false}
                    onCheckedChange={(checked) =>
                      handleNotificationChange('inApp', 'desktop', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 개인정보 설정 */}
          <TabsContent value="privacy" className="space-y-6 m-0">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  프로필 공개 범위
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>프로필 공개 설정</Label>
                  <Select
                    value={privacySettings?.profileVisibility || 'private'}
                    onValueChange={(value: 'public' | 'friends' | 'private') =>
                      handlePrivacyChange('profileVisibility', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <div>
                            <p>전체 공개</p>
                            <p className="text-sm text-muted-foreground">
                              모든 사용자가 볼 수 있음
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="friends">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <p>친구만</p>
                            <p className="text-sm text-muted-foreground">친구로 연결된 사용자만</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <div>
                            <p>비공개</p>
                            <p className="text-sm text-muted-foreground">본인만 볼 수 있음</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>이메일 주소 공개</Label>
                      <p className="text-sm text-muted-foreground">
                        다른 사용자가 이메일을 볼 수 있음
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings?.showEmail || false}
                      onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>전화번호 공개</Label>
                      <p className="text-sm text-muted-foreground">
                        다른 사용자가 전화번호를 볼 수 있음
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings?.showPhone || false}
                      onCheckedChange={(checked) => handlePrivacyChange('showPhone', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>온라인 상태 표시</Label>
                      <p className="text-sm text-muted-foreground">
                        현재 접속 상태를 다른 사용자에게 표시
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings?.showOnlineStatus || false}
                      onCheckedChange={(checked) =>
                        handlePrivacyChange('showOnlineStatus', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  메시지 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>메시지 수정 허용</Label>
                  <Select
                    value={privacySettings?.allowMessages || 'friends'}
                    onValueChange={(value: 'everyone' | 'friends' | 'none') =>
                      handlePrivacyChange('allowMessages', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">모든 사용자</SelectItem>
                      <SelectItem value="friends">친구만</SelectItem>
                      <SelectItem value="none">차단</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 표시 설정 */}
          <TabsContent value="appearance" className="space-y-6 m-0">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  테마 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>테마</Label>
                  <Select
                    value={appearanceSettings?.theme || 'system'}
                    onValueChange={(value) => handleAppearanceChange('theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          라이트 모드
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          다크 모드
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          시스템 설정 따름
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>언어</Label>
                    <Select
                      value={appearanceSettings.language}
                      onValueChange={(value) => handleAppearanceChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>시간대</Label>
                    <Select
                      value={appearanceSettings?.timezone || 'Asia/Seoul'}
                      onValueChange={(value) => handleAppearanceChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Seoul">서울 (UTC+9)</SelectItem>
                        <SelectItem value="Asia/Tokyo">도쿄 (UTC+9)</SelectItem>
                        <SelectItem value="America/New_York">뉴욕 (UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 계정 설정 */}
          <TabsContent value="account" className="space-y-6 m-0">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  데이터 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>내 데이터 다운로드</Label>
                    <p className="text-sm text-muted-foreground">
                      계정 정보, 여행 기록, 메시지 등을 다운로드할 수 있습니다
                    </p>
                  </div>
                  <Button onClick={onExportData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    다운로드
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  위험 구역
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">계정 삭제</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다. 생성한
                    여행과 모임도 함께 삭제됩니다.
                  </p>

                  {!showDeleteConfirm ? (
                    <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      계정 삭제
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>확인을 위해 &quot;계정삭제&quot;를 입력하세요</Label>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="계정삭제"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== '계정삭제'}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          영구 삭제
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  고객 지원
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>도움말 센터</Label>
                    <p className="text-sm text-muted-foreground">자주 묻는 질문과 가이드</p>
                  </div>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    방문하기
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>고객 지원팀 문의</Label>
                    <p className="text-sm text-muted-foreground">
                      문제가 있으시면 언제든 연락주세요
                    </p>
                  </div>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    문의하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
