'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BriefcaseBusiness,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, profile, signOut, isCompanyAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Jobs', href: '/jobs', auth: true },
    { name: 'Companies', href: '/companies' },
    { name: 'Discussions', href: '/discussions' },
  ];

  const authNavItems = [
    { name: 'My Profile', href: '/profile', icon: User },
    { name: 'Applications', href: '/applications', icon: BriefcaseBusiness },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  if (isCompanyAdmin) {
    authNavItems.push({
      name: 'Company Dashboard',
      href: '/company/dashboard',
      icon: BriefcaseBusiness,
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
            <span className="font-bold text-xl">JobMatch</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6">
            {navItems.map(
              (item) =>
                (!item.auth || user) && (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                )
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile?.avatar_url || ''}
                        alt={profile?.full_name || 'User'}
                      />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {authNavItems.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="flex items-center cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            className="md:hidden"
            size="icon"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in md:hidden bg-background',
          mobileMenuOpen ? 'slide-in-from-bottom-80' : 'hidden'
        )}
      >
        <div className="relative z-20 grid gap-6 rounded-md bg-background p-4">
          <nav className="grid grid-flow-row auto-rows-max text-sm">
            {navItems.map(
              (item) =>
                (!item.auth || user) && (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
            )}

            {!user && (
              <>
                <Link
                  href="/auth/login"
                  className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}

            {user && (
              <>
                {authNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:bg-accent"
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Log out
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}