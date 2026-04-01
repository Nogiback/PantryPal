
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutDashboard, ScanLine, ChefHat, LogOut, Menu, Sparkles, UserRound, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: 'pantry' | 'scan' | 'recipes' | 'ai-recipes' | 'profile';
}

const navItems: NavItem[] = [
  { label: 'Pantry', icon: <LayoutDashboard className="h-4 w-4" />, id: 'pantry' },
  { label: 'Scan', icon: <ScanLine className="h-4 w-4" />, id: 'scan' },
  { label: 'Recipes', icon: <ChefHat className="h-4 w-4" />, id: 'recipes' },
  { label: 'AI Chef', icon: <Sparkles className="h-4 w-4" />, id: 'ai-recipes' },
  { label: 'Profile', icon: <UserRound className="h-4 w-4" />, id: 'profile' },
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'pantry' | 'scan' | 'recipes' | 'ai-recipes' | 'profile';
  onTabChange: (tab: 'pantry' | 'scan' | 'recipes' | 'ai-recipes' | 'profile') => void;
  onSignOut?: () => void;
}

export function Layout({ children, activeTab, onTabChange, onSignOut }: LayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const user = useMemo(() => {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return { name: '', email: '' };
    try {
      const parsed = JSON.parse(raw) as { name?: unknown; email?: unknown } | null;
      return {
        name: typeof parsed?.name === 'string' ? parsed.name : '',
        email: typeof parsed?.email === 'string' ? parsed.email : '',
      };
    } catch {
      return { name: '', email: '' };
    }
  }, []);

  const initials = useMemo(() => {
    const name = user.name.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] || '';
      const second = (parts[1]?.[0] || parts[0]?.[1] || '');
      return (first + second).toUpperCase();
    }
    const email = user.email.trim();
    if (email) return email.slice(0, 2).toUpperCase();
    return 'U';
  }, [user.email, user.name]);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!userMenuRef.current) return;
      if (userMenuRef.current.contains(target)) return;
      setIsUserMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-emerald-200/10 dark:to-primary/10" />
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-emerald-300/15 blur-3xl dark:bg-primary/10" />
        <div className="absolute -bottom-48 -right-48 h-[34rem] w-[34rem] rounded-full bg-teal-300/12 blur-3xl dark:bg-primary/10" />
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 relative">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <ChefHat className="h-6 w-6" />
            <span>PantryPal</span>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className={cn(
                  'rounded-full',
                  activeTab === item.id && 'bg-secondary',
                )}
                onClick={() => onTabChange(item.id)}
              >
                {item.icon}
                <span className="">{item.label}</span>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-lg text-primary">
                    <ChefHat className="h-5 w-5" />
                    <span>PantryPal</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {navItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? 'secondary' : 'outline'}
                        className="justify-start"
                        onClick={() => {
                          onTabChange(item.id);
                          setIsMobileOpen(false);
                        }}
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                  {onSignOut && (
                    <div className="pt-2">
                      {(user.name || user.email) && (
                        <div className="mb-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate">
                                {user.name || 'Account'}
                              </div>
                              {user.email && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setIsMobileOpen(false);
                          onSignOut();
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="ml-2">Sign out</span>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {onSignOut && (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <Button
                  variant="outline"
                  className="rounded-full pl-2 pr-3"
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {initials}
                  </div>
                  <span className="ml-2 max-w-40 truncate">
                    {user.name || 'Account'}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
                </Button>

                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-border/60 bg-background/95 backdrop-blur shadow-lg p-2"
                  >
                    <div className="px-3 py-2">
                      <div className="font-semibold truncate">{user.name || 'Account'}</div>
                      {user.email && (
                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                      )}
                    </div>
                    <Separator />
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="ml-2">Sign out</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
