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
        admon<span>.</span>xyz
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
