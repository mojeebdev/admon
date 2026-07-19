# Stack Brief: Admon

Last audited: 2026-07-19

This document is an evidence-based stack brief for the current Admon source tree. It is maintained from `package.json`, `package-lock.json`, application source, Prisma schema, environment template, Next configuration, and Solidity contract. No secrets are included.

## Product architecture

Admon is a full-stack Next.js application that verifies control of a public GitHub profile through OAuth, derives deterministic build traits from public GitHub activity, persists the result in PostgreSQL, and mints a wallet-bound ERC-721 proof on Monad Mainnet. It has no runtime AI, RAG, agent, prompt, or model-provider dependency.

```text
GitHub OAuth + public GitHub API
                |
                v
Next.js Route Handlers -> Prisma -> Supabase Postgres
                |                       |
                |                       v
                |                Supabase Storage (public share cards)
                v
Viem + Wagmi -> Injected wallet -> Admon ERC-721 on Monad Mainnet
```

## Exact installed runtime stack

| Area | Technology | Installed version | Role |
| --- | --- | --- | --- |
| Web framework | Next.js | 16.2.10 | App Router pages, API route handlers, metadata, image routes, production build. |
| UI | React / React DOM | 19.2.5 | Client components and local interaction state. |
| Language | TypeScript | 5.9.3 | Strict type checking. |
| ORM | Prisma / Prisma Client | 5.22.0 | PostgreSQL schema, queries, and generated client. |
| Database and storage SDK | Supabase JS | 2.103.3 | Server-side upload of public PNG cards to Supabase Storage. |
| Wallet state | Wagmi | 3.7.3 | Injected EIP-1193 wallet connection, network switch, transaction submission, and receipt state. |
| EVM library | Viem | 2.55.2 | Monad chain definition, RPC calls, EIP-712 signing, trait hashes, and receipt validation. |
| Query client | TanStack React Query | 5.99.2 | Provider required by Wagmi. |
| Image renderer | @resvg/resvg-js / Sharp | 2.6.2 / 0.34.5 | Server-side vehicle share-card rendering and PNG output. |
| Social images | @vercel/og | 0.6.8 | Dynamic Open Graph image route. |
| Analytics | Vercel Analytics | 2.0.1 | Vercel traffic analytics in the root layout. |
| CSS tooling | PostCSS / Autoprefixer / Tailwind | 8.5.10 / 10.5.0 / 3.4.19 | CSS processing. The shipped interface uses `app/globals.css`; Tailwind is installed but not used in shipped UI markup. |

## Application runtime and build

- **Node.js:** Next.js 16 requires Node.js 20.9 or later. The project was validated on Node.js 24.
- **Build mode:** `next build --webpack`.
- **Development mode:** `next dev --webpack`.
- **Reason for webpack:** `next.config.js` has explicit externals for `pino-pretty`, `lokijs`, and `encoding`; Next 16 otherwise defaults to Turbopack.
- **Build configuration:** React strict mode, remote images from GitHub avatars and Supabase, `@resvg/resvg-js` server externalization, and output file tracing for fonts used by Open Graph and mint-finalization routes.
- **Security dependency status:** `npm audit --omit=dev` reports zero vulnerabilities. `postcss` is pinned and overridden to `8.5.10` because Next's nested dependency was otherwise reported by npm audit.

## Frontend

- **Routing:** Next App Router.
- **Pages:** `/`, `/garage`, `/garage/[username]`, `/privacy`, and `/terms`.
- **Compatibility:** `/commitcar` and `/commitcar/[username]` remain as legacy route aliases; all active navigation and generated URLs use `/garage`.
- **Wallet UX:** A visible injected-wallet connect control remains in the navigation on mobile. The navigation includes a mobile hamburger menu.
- **Visual system:** Semantic TSX with a custom global CSS design system in `app/globals.css`, using Bricolage Grotesque, Manrope, and IBM Plex Mono web fonts.
- **Metadata:** Root, Garage, proof, privacy, and terms metadata are defined. Dynamic manifest, favicon, and Apple icon routes are included. Root JSON-LD identifies Blindspotlab and founder Mojeeb Titilayo.
- **Analytics:** `<Analytics />` from `@vercel/analytics/next` is included in the root layout.

## GitHub identity and public-data pipeline

### OAuth and session security

- GitHub OAuth uses only the `read:user` scope.
- OAuth state is HMAC-signed, HTTP-only, same-site lax, and valid for ten minutes.
- The GitHub session is HMAC-signed, HTTP-only, same-site lax, and valid for seven days.
- Cookies use the `secure` flag in production.
- A requested GitHub username must match the authenticated OAuth session before analysis, authorization, or mint finalization can proceed.

### Public signals collected

- GitHub profile identity and account creation date.
- Up to roughly 300 public repositories, ordered by recent update.
- Non-fork public-repository count, language distribution, and stars.
- GitHub commit-search totals for authored commits, capped at 10,000.
- Authored commits in the last 365 days, capped at 10,000.
- Up to 100 recent authored commit timestamps, used for the visible longest streak and peak commit hour.

`GITHUB_PAT` is optional. When provided, it only raises public GitHub API rate limits. The OAuth flow and trait calculation do not require access to private repositories.

## Build Score and traits

The Garage sorts records by Build Score, then by total commits, then creation time. The deterministic score is:

```text
min(total commits, 10,000) × 0.20
+ min(365-day commits, 2,500) × 0.35
+ min(longest streak, 180) × 6
+ min(public repositories, 80) × 7
+ min(total stars, 500) × 0.20
+ min(account age in years, 12) × 6
```

Rarity thresholds are Common `0`, Rare `500`, Epic `1200`, Legendary `2200`, and Mythic `3300`.

Vehicle traits are fully deterministic:

- Chassis from top language.
- Paint from peak commit hour.
- Wheels from public repository count.
- Aero from longest commit streak.
- Headlights from total stars.
- Finish from account age.
- Rarity from Build Score.

The canonical JSON serialization of these traits is Keccak-256 hashed and signed as part of the mint authorization.

## API and server routes

| Route | Method | Function |
| --- | --- | --- |
| `/api/github/login` | GET | Starts GitHub OAuth and records signed state. |
| `/api/github/callback` | GET | Exchanges OAuth code, reads authenticated profile, and creates the signed session. |
| `/api/github/session` | GET | Returns current authenticated GitHub session status. |
| `/api/github/logout` | POST | Clears the GitHub session cookie. |
| `/api/build` | POST | Validates GitHub identity, fetches public signals, derives traits and score, and upserts the build record. |
| `/api/mint-authorization` | POST | Creates a ten-minute EIP-712 authorization for the authenticated builder and connected wallet. |
| `/api/finalize-mint` | POST | Validates the Monad transaction and ERC-721 transfer, uploads a card, and persists receipt data. |
| `/api/metadata/[username]` | GET | Returns live ERC-721 metadata. |
| `/api/og/[username]` | GET | Returns a dynamic proof Open Graph image. |
| `/api/stats` | GET | Returns aggregate build/mint counts, contract data, and latest real mint activity. |

All routes that need database, cryptography, image generation, or RPC access use the Node.js runtime.

## Data layer

### PostgreSQL and Prisma

Supabase-hosted PostgreSQL is accessed through Prisma. `DATABASE_URL` and `DIRECT_URL` are both required by the Prisma schema.

The `Car` model stores:

- GitHub username, ID, avatar, name, and bio.
- Derived trait JSON, stats snapshot, total commit count, score, and rarity tier.
- Mint timestamp, unique token ID, transaction hash, owner address, and generated public image URL.
- Share and view counters plus creation/update timestamps.

Indexes cover rarity/creation, mint timestamp, rarity score, total commits, and the unique GitHub username/token ID fields.

### Object storage

- Provider: Supabase Storage.
- Bucket: `cars`.
- Access: public, so NFT and social share cards can resolve publicly.
- Write path: server-side only, using `SUPABASE_SERVICE_ROLE_KEY` after a successful mint receipt validation.
- File naming: `<github-username>-<token-id>.png`.

## Blockchain and NFT stack

- **Network:** Monad Mainnet.
- **Chain ID:** `143`.
- **Native token:** MON.
- **Default RPC:** `https://rpc.monad.xyz`, configurable with `NEXT_PUBLIC_MONAD_RPC_URL`.
- **Explorer:** [Monadscan](https://monadscan.com).
- **Collection:** [OpenSea Admon](https://opensea.io/collection/admon).
- **Deployed contract:** [`0xb6aedBF17a11928A63773F88a9CfD3E252F43a63`](https://monadscan.com/address/0xb6aedBF17a11928A63773F88a9CfD3E252F43a63).
- **Source:** `contracts/Admon.sol`.
- **Compiler:** Solidity 0.8.24.
- **License:** MIT.

### Contract design

`Admon` extends OpenZeppelin `ERC721`, `EIP712`, and `Ownable`.

- Token name and symbol are `Admon` and `ADMON`.
- `tokenIdByUsername` enforces one token per GitHub username.
- `usernameByTokenId` and `traitsHashOf` make the mint record queryable onchain.
- A token can use a signed per-token URI or fall back to the owner-configured base URI.
- `totalSupply()` returns the monotonically increasing minted-token count.
- Only the contract owner can change the base URI or the authorized signer.

### EIP-712 mint authorization

The server-held `MONAD_AUTHORIZER_PRIVATE_KEY` signs the `Mint` typed data only after OAuth identity matches the requested username. The signature binds:

- recipient wallet;
- GitHub username;
- canonical Keccak-256 trait hash;
- metadata URI;
- ten-minute deadline.

The contract validates the deadline and recovery address before minting. Mint finalization independently checks that the transaction succeeded, targeted the configured Admon contract, emitted an ERC-721 `Transfer` to the submitted wallet, and that the token's onchain username matches the authenticated GitHub username.

## Environment and deployment

| Variable | Scope | Use |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical origin, OAuth callback origin, and NFT metadata origin. |
| `NEXT_PUBLIC_MONAD_RPC_URL` | Public | Monad RPC endpoint. |
| `NEXT_ADMON_CONTRACT_ADDRESS` | Server | Configured production contract address. It is passed to proof pages only as a public address. |
| `NEXT_PUBLIC_LAUNCH_POST_URL` | Public, optional | X launch post included in share links. |
| `GITHUB_OAUTH_CLIENT_ID` | Server | OAuth App client ID. |
| `GITHUB_OAUTH_CLIENT_SECRET` | Server secret | OAuth App client secret and fallback session signer. |
| `GITHUB_SESSION_SECRET` | Server secret | Preferred HMAC signing secret for session/state cookies. |
| `GITHUB_PAT` | Server secret, optional | Public GitHub API rate-limit headroom. |
| `MONAD_AUTHORIZER_PRIVATE_KEY` | Server secret | EIP-712 authorization signer. |
| `DATABASE_URL` / `DIRECT_URL` | Server secret | Prisma database connection strings. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Server-side Supabase Storage access. |

The production deployment target is Vercel at `https://admon.peerfix.dev`. Its GitHub OAuth callback must be `https://admon.peerfix.dev/api/github/callback`. The production environment must configure all server secrets in Vercel, never in browser code, source control, or a deployed client bundle.

## Deliberate scope boundaries

- Mainnet only. No testnet integration is present.
- The project does not deploy or verify contracts from the repository; the owner deploys and verifies manually in Remix.
- The application does not custody wallets, MON, NFTs, or user private keys.
- No private GitHub data, write scope, or repository source code is requested.
- Build Scores summarize public signals only. They are not employment credentials, financial products, or a measure of personal worth.

## Build attribution

This attribution describes the development process, not a runtime application dependency.

- Prompt Engineering: Mojeeb Titilayo
- Prompt Optimization: Claude (Sonnet 5)
- AI-assisted implementation: Codex (GPT-5.6 Terra)
