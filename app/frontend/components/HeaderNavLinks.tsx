'use client';

import React from 'react';
import Link from 'next/link';
import { DropdownMenuItem } from '@chatstack/ui';

interface HeaderNavLinksProps {
  onTripTabClick?: () => void;
  onMeetupTabClick?: () => void;
  onMyActivityClick?: () => void;
  onCommunityClick?: () => void;
}

export default function HeaderNavLinks({
  onTripTabClick,
  onMeetupTabClick,
  onMyActivityClick,
  onCommunityClick,
}: HeaderNavLinksProps) {
  return (
    <>
      <DropdownMenuItem asChild>
        <Link href="/trips" prefetch={false} onClick={onTripTabClick}>
          여행 찾기
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/meetups" prefetch={false} onClick={onMeetupTabClick}>
          모임 찾기
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/activity" prefetch={false} onClick={onMyActivityClick}>
          내 활동
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/community" prefetch={false} onClick={onCommunityClick}>
          커뮤니티
        </Link>
      </DropdownMenuItem>
    </>
  );
}
