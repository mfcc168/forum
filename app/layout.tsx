import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientNavigation from "@/app/components/ClientNavigation";
import Providers from "@/app/components/Providers";
import { ErrorBoundary } from "@/app/components/ui/ErrorBoundary";

// Initialize WebSocket server in development
if (process.env.NODE_ENV === 'development') {
  import('@/lib/websocket/server').then(({ initializeWebSocketServer }) => {
    initializeWebSocketServer()
  }).catch(console.error)
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "秘汐之嶼 - Mystic Tidal Isle",
  description: "Official website for 秘汐之嶼 (Mystic Tidal Isle) Minecraft server community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          <Providers>
            <ClientNavigation />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
