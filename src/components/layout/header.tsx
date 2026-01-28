'use client';

import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Moon,
  Sun,
  Menu,
  TrendingUp,
  LayoutDashboard,
  Receipt,
  Upload,
  BarChart3,
  Tags,
  Settings,
  User,
  LogOut,
  RefreshCw,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/components/auth-provider';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Import', href: '/import', icon: Upload },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/expenses': 'Expenses',
  '/import': 'Import Data',
  '/analytics': 'Analytics',
  '/categories': 'Categories',
  '/settings': 'Settings',
};

function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SyncStatus() {
  const { isAuthenticated, isOnline, sync, triggerSync } = useAuthContext();

  if (!isAuthenticated) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => triggerSync()}
      disabled={sync.isSyncing || !isOnline}
      title={
        !isOnline
          ? 'Offline'
          : sync.isSyncing
            ? 'Syncing...'
            : sync.pendingCount > 0
              ? `${sync.pendingCount} pending changes`
              : 'Synced'
      }
    >
      {!isOnline ? (
        <CloudOff className="h-5 w-5 text-muted-foreground" />
      ) : sync.isSyncing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : sync.pendingCount > 0 ? (
        <RefreshCw className="h-5 w-5 text-amber-500" />
      ) : (
        <Cloud className="h-5 w-5 text-green-500" />
      )}
      <span className="sr-only">Sync status</span>
    </Button>
  );
}

function UserMenu() {
  const { user, isAuthenticated, isLoading, signOut } = useAuthContext();

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <p className="font-medium">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span>Log-Ex</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'Log-Ex';

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      <MobileNav />
      <h1 className="text-lg font-semibold lg:text-xl">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <SyncStatus />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
