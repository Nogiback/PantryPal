import React, { useState } from 'react';
import { LayoutDashboard,  ScanLine,  ChefHat, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: 'pantry' | 'scan' | 'recipes';
}

const navItems: NavItem[] = [
  { label: 'My Pantry', icon: <LayoutDashboard className="h-4 w-4" />, id: 'pantry' },
  { label: 'Scan Receipt', icon: <ScanLine className="h-4 w-4" />, id: 'scan' },
  { label: 'Find Recipes', icon: <ChefHat className="h-4 w-4" />, id: 'recipes' },
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: 'pantry' | 'scan' | 'recipes') => void;
}

// Helper component for navigation content
function NavContent({ 
  activeTab, 
  onTabChange, 
  onMobileClose 
}: { 
  activeTab: string; 
  onTabChange: (tab: 'pantry' | 'scan' | 'recipes') => void;
  onMobileClose?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 py-4">
      <div className="px-4 mb-4">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ChefHat className="h-6 w-6" /> PantryPal
        </h1>
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'secondary' : 'ghost'}
            className={cn('justify-start', activeTab === item.id && 'bg-secondary')}
            onClick={() => {
              onTabChange(item.id);
              if (onMobileClose) onMobileClose();
            }}
          >
            {item.icon}
            <span className="ml-2">{item.label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-card">
        <NavContent activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex md:hidden items-center p-4 border-b bg-card">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <NavContent 
                activeTab={activeTab} 
                onTabChange={onTabChange} 
                onMobileClose={() => setIsMobileOpen(false)} 
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold ml-2">PantryPal</h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}
