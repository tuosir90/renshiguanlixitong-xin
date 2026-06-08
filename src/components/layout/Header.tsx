'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/basic/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/layout/sheet';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Menu, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: '系统主页', href: '/' },
  { name: '招聘管理', href: '/recruitment' },
  { name: '员工管理', href: '/employees' },
  { name: '积分管理', href: '/scores' },
  { name: '年度评优', href: '/awards' },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between gap-4 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
            <Users className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="hidden text-sm font-semibold tracking-tight text-foreground sm:inline-block">
              呈尚策划人事管理系统
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground sm:hidden">
              人事系统
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]">
              <div className="flex flex-col gap-6 px-1 py-2">
                <div className="flex items-center gap-2.5 border-b border-border pb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold tracking-tight">人事管理系统</span>
                </div>

                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        )}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
