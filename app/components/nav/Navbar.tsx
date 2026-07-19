'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnect } from '../wallet/WalletConnect';

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const path = pathname === '/' ? '~/verify' : `~${pathname}`;
  return (
    <nav className="nav-terminal">
      <Link href="/" className="nav-terminal__logo" aria-label="Admon home">
        <svg className="nav-terminal__mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 14.5h18" />
          <path d="M5.5 14V10.5L10 7h5.5l3 3v4" />
          <circle cx="8" cy="15.5" r="1.75" />
          <circle cx="17" cy="15.5" r="1.75" />
        </svg>
        <span>Admon</span>
      </Link>
      <span className="nav-terminal__path">{path}</span>
      <div className="nav-terminal__actions">
        <span className="nav-terminal__status" title="Monad Mainnet">● MONAD</span>
        <Link href="/garage" className={pathname?.startsWith('/garage') ? 'nav-terminal__hall active' : 'nav-terminal__hall'}>
          [GARAGE]
        </Link>
        <button
          type="button"
          className="nav-terminal__menu"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <WalletConnect />
      </div>
      {menuOpen && (
        <div className="nav-terminal__mobile-menu">
          <Link href="/garage" onClick={() => setMenuOpen(false)}>Garage</Link>
          <Link href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</Link>
          <Link href="/terms" onClick={() => setMenuOpen(false)}>Terms</Link>
          <a href="https://github.com/mojeebdev/admon" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      )}
    </nav>
  );
}
