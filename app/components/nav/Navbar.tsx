'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnect } from '../wallet/WalletConnect';

export function Navbar() {
  const pathname = usePathname();
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
        <Link href="/commitcar" className={pathname?.startsWith('/commitcar') ? 'nav-terminal__hall active' : 'nav-terminal__hall'}>
          [GARAGE]
        </Link>
        <WalletConnect />
      </div>
    </nav>
  );
}
