'use client';

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Prevent hydration mismatches by only rendering after mount
  const [mounted, setMounted] = useState(false);
  
  // Create a stable query client instance - always create it but handle SSR properly
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error && 
              typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
      },
      mutations: {
        retry: false,
      },
    },
  }));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always wrap with QueryClientProvider, even during SSR
  const content = (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <LanguageProvider>
          {children}
          {mounted && (
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
          )}
        </LanguageProvider>
      </SessionProvider>
      {mounted && process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );

  return content;
}