'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useInitDatabase } from '@/hooks/useDatabase';
import { Toaster } from '@/components/ui/sonner';

function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { isReady, error } = useInitDatabase();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Database Error</h1>
          <p className="text-muted-foreground mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DatabaseProvider>
        {children}
        <Toaster />
      </DatabaseProvider>
    </NextThemesProvider>
  );
}
