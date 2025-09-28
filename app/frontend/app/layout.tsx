import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DesignSystemProvider from "@/providers/DesignSystemProvider";
import MainLayout from "@/components/MainLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Getmoim",
  description: "함께하는 여행, 겟모임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <DesignSystemProvider>
          <MainLayout>{children}</MainLayout>
        </DesignSystemProvider>
      </body>
    </html>
  );
}
