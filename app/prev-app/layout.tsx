import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import DesignSystemProvider from '@/src/providers/DesignSystemProvider';
import WebSocketProvider from '@/src/providers/WebSocketProvider';
import SWRProvider from '@/src/providers/SWRProvider';
import HeaderServer from './_components/HeaderServer';
import GlobalAuthModal from './_components/GlobalAuthModal';

export const metadata: Metadata = {
  title: '겟모임 - 스마트 여행/모임',
  description: '그룹 여행을 더 스마트하게',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#14161a' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <DesignSystemProvider>
          <WebSocketProvider>
            <SWRProvider>
              <HeaderServer />
              {children}
              <GlobalAuthModal />
            </SWRProvider>
          </WebSocketProvider>
        </DesignSystemProvider>
      </body>
    </html>
  );
}
