'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Menu, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="header shadow-sm fixed top-0 left-0 right-0 z-50 w-full">
      <div className="flex justify-between w-full px-8 py-4">
        <div className="flex items-center">
          <Link href="/" className="w-10 h-10 flex items-center justify-center">
            <Image
              src="/images/svg/logo.svg"
              alt="Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </Link>
        </div>

        <div ref={menuRef} className="relative">
          <div className="user-menu-toggle" onClick={toggleMenu}>
            <div className="flex items-center justify-center">
              <Menu className={cn('text-xl text-white', isMenuOpen && 'text-white/70')} />
            </div>
            <ChevronLeft
              className={cn(
                'text-sm text-white transition-transform duration-300',
                isMenuOpen ? '-rotate-90 text-white/70' : 'rotate-0'
              )}
            />
          </div>
          <div
            className={cn(
              'menu-dropdown',
              isMenuOpen ? 'menu-dropdown-open' : 'menu-dropdown-closed'
            )}
          >
            <nav className="flex flex-col py-2">
              <Link href="/algorithms" onClick={closeMenu} className="menu-item">
                Алгоритмы
              </Link>
              <Link href="/history" onClick={closeMenu} className="menu-item">
                История
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;