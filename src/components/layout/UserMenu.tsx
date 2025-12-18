'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="User menu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 mt-2 w-52 bg-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 border border-neutral-600">
            <Link
              href="/algorithms"
              className="block px-4 py-3 text-white hover:bg-neutral-600 transition-colors border-b border-neutral-600"
              onClick={() => setIsOpen(false)}
            >
              Алгоритмы
            </Link>
            <Link
              href="/history"
              className="block px-4 py-3 text-white hover:bg-neutral-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              История
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
