# Stack Brief: Admon

Last audited: 2026-07-24

This document is an evidence-based stack brief for the current Admon source tree. It is maintained from `package.json`, `package-lock.json`, application source, Prisma schema, environment template, Next configuration, and Solidity contracts. No secrets are included.

## Product architecture

Admon is a full-stack Next.js application that verifies control of a public GitHub profile through OAuth, derives deterministic build traits from public GitHub activity, persists the result in PostgreSQL, and mints wallet-bound ERC-721 proofs on Monad Mainnet. It has no runtime AI, RAG, agent, prompt, or model-provider dependency.

Two collections:

| Collection | Contract | Identity onchain | Genesis |
| --- | --- | --- | --- |
| **Admon V1** | `Admon.sol` | One token per GitHub username | Off-chain snapshot marks eligible V1 records |
| **Admon Trace** | `AdmonTrace.sol` | One token per `username + weekKey` (UTC Friday) | Not used; independent weekly mint |

```text
GitHub OAuth + public GitHub API
                |
                v
Next.js Route Handlers -> Prisma -> Supabase Postgres
                |                       |
                |                       v
                |                Supabase Storage (public share cards)
                v
Viem + Wagmi -> Injected wallet -> Admon / AdmonTrace ERC-721 on Monad Mainnet
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
- **Scripts:** `npm run genesis:snapshot` runs `scripts/snapshot-genesis.mjs` (dry-run; add `--apply` to write).
- **Security dependency status:** `npm audit --omit=dev` reports zero vulnerabilities. `postcss` is pinned and overridden to `8.5.10` because Next's nested dependency was otherwise reported by npm audit.

## Frontend

- **Routing:** Next App Router.
- **Pages:** `/`, `/garage`, `/garage/[username]`, `/builder/[username]`, `/preview/[username]`, `/privacy`, and `/terms`.
- **Compatibility:** `/commitcar` and `/commitcar/[username]` remain as legacy route aliases; all active navigation and generated URLs use `/garage`.
- **Wallet UX:** A visible injected-wallet connect control remains in the navigation on mobile. The navigation includes a mobile hamburger menu.
- **Visual system:** Semantic TSX with a custom global CSS design system in `app/globals.css`, using Bricolage Grotesque, Manrope, and IBM Plex Mono web fonts.
- **Metadata:** Root, Garage, proof, privacy, and terms metadata are defined. Dynamic manifest, favicon, and Apple icon routes are included. Root JSON-LD identifies Blindspotlab and founder Mojeeb Titilayo.
- **Analytics:** `<Analytics />` from `@vercel/analytics/next` is included in the root layout.
- **Concept art:** SVG vehicle concepts under `docs/`.

## GitHub identity and public-data pipeline

### OAuth and session security

- GitHub OAuth uses only the `read:user` scope.
- OAuth state is HMAC-signed, HTTP-only, same-site lax, and valid for ten minutes.
- The GitHub session is HMAC-signed, HTTP-only, same-site lax, and valid for seven days.
- Cookies use the `secure` flag in production.
- A requested GitHub username must match the authenticated OAuth session before analysis, authorization, or mint finalization can proceed.

### Public signals collected

Implemented in `app/lib/github.ts` using the public REST API (Commit Search is **not** hard-limited to 365 days):

- GitHub profile identity and account creation date (`created_at`).
- Up to roughly 300 public repositories, ordered by recent update.
- Non-fork public-repository count, language distribution, and stars.
- **All-time public authored commits** from account creation: Search query `author:{login} committer-date:>={created_at}`, capped at 10,000 in-app. Stored as `totalCommits`.
- **Authored commits in the last 365 days** as a recent-activity signal, same Search API with a rolling 365-day lower bound, capped at 10,000. Stored as `commits365d`.
- Up to 100 recent authored commit timestamps (separate Search call), used only for the visible longest streak and peak commit hour.

Private repository work is never requested. Search results only include public authored commits GitHub can attribute. `GITHUB_PAT` is optional and only raises public API rate limits.

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

`total commits` means all-time public authored commits from account creation, not the 365-day window.

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
| `/api/build` | POST | Validates GitHub identity, fetches public signals, derives traits and score, and upserts the V1 build record. |
| `/api/mint-authorization` | POST | Creates a ten-minute EIP-712 authorization for the authenticated builder and connected wallet (V1). |
| `/api/finalize-mint` | POST | Validates the Monad transaction and ERC-721 transfer, uploads a card, and persists V1 receipt data. |
| `/api/metadata/[username]` | GET | Returns live V1 ERC-721 metadata. |
| `/api/og/[username]` | GET | Returns a dynamic proof Open Graph image. |
| `/api/stats` | GET | Returns aggregate build/mint counts, contract data, and latest real mint activity. |
| `/api/weekly-mint-authorization` | POST | Friday UTC Trace mint authorization after OAuth match. |
| `/api/weekly-finalize-mint` | POST | Validates Trace mint tx and persists `BuildRecord` receipt. |
| `/api/weekly-metadata/[username]/[weekKey]` | GET | Trace ERC-721 metadata. |
| `/api/weekly-image/[username]/[weekKey]` | GET | Trace token image. |
| `/api/connections` | — | Builder connection-request endpoints. |

All routes that need database, cryptography, image generation, or RPC access use the Node.js runtime.

## Data layer

### PostgreSQL and Prisma

Supabase-hosted PostgreSQL is accessed through Prisma. `DATABASE_URL` and `DIRECT_URL` are both required by the Prisma schema.

**`Car` (V1 build record)** stores:

- GitHub username, ID, avatar, name, and bio.
- Derived trait JSON, stats snapshot, total commit count, score, and rarity tier.
- Mint timestamp, unique token ID, transaction hash, owner address, and generated public image URL.
- Genesis fields: `isGenesis`, `genesisNumber`, `genesisAt` (written only by the snapshot script).
- Optional `builderId` link to `Builder`.
- Share and view counters plus creation/update timestamps.

**`Builder`** stores profile identity, optional Genesis number/time, legacy V1 cars, weekly `BuildRecord`s, and connection requests.

**`BuildRecord`** stores one weekly Trace record per builder + `weekKey`, with traits, score, mint receipt fields, and contract address/token id.

**`ConnectionRequest`** stores builder-to-builder connection status.

Indexes cover rarity/creation, mint timestamp, rarity score, total commits, Genesis number, and unique GitHub username / token ID / weekly pair fields.

### Genesis snapshot (off-chain only)

- Script: `scripts/snapshot-genesis.mjs` (`npm run genesis:snapshot`).
- Cutoff: `2026-07-24T14:23:00.000Z` (2:23 PM UTC / 3:23 PM Nigeria WAT).
- Eligible: V1 `Car` rows with `createdAt <= cutoff`, ordered by `createdAt` then `id`.
- Locked until the cutoff has passed; dry-run by default; `--apply` writes Genesis fields on `Car` and upserts `Builder`.
- **Not enforced onchain.** `AdmonTrace` does not reference Genesis or the snapshot.

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
- **Deployed V1 (Genesis):** [`0xb6aedBF17a11928A63773F88a9CfD3E252F43a63`](https://monadscan.com/address/0xb6aedBF17a11928A63773F88a9CfD3E252F43a63).
- **Deployed V2 (Trace):** [`0xCc3fc8b272bca9de775ba7399E3dD7fd7a0173b0`](https://monadscan.com/address/0xCc3fc8b272bca9de775ba7399E3dD7fd7a0173b0).
- **Sources:** `contracts/Admon.sol` (V1), `contracts/AdmonTrace.sol` (weekly / V2).
- **Compiler:** Solidity 0.8.24.
- **License:** MIT.

### V1 contract design (`Admon`)

`Admon` extends OpenZeppelin `ERC721`, `EIP712`, and `Ownable`.

- Token name and symbol are `Admon` and `ADMON`.
- `tokenIdByUsername` enforces one token per GitHub username.
- `usernameByTokenId` and `traitsHashOf` make the mint record queryable onchain.
- A token can use a signed per-token URI or fall back to the owner-configured base URI.
- `totalSupply()` returns the monotonically increasing minted-token count.
- Only the contract owner can change the base URI or the authorized signer.
- No Genesis / snapshot fields onchain.

### Trace contract design (`AdmonTrace`)

`AdmonTrace` extends OpenZeppelin `ERC721`, `EIP712`, and `Ownable2Step`.

- Token name and symbol are `Admon Trace` and `TRACE`.
- Record key is `keccak256(abi.encode(username, weekKey))`; one mint per pair.
- Metadata URI is `baseURI + username + "/" + weekKey` (no full URL stored per token).
- EIP-712 `Mint` binds recipient, username, weekKey, traitsHash, and deadline.
- Owner can update base URI (ERC-4906 batch metadata update), authorized signer, and minting pause.
- Does **not** use or store Genesis snapshot data.

### EIP-712 mint authorization

The server-held `MONAD_AUTHORIZER_PRIVATE_KEY` (and optional `MONAD_TRACE_AUTHORIZER_PRIVATE_KEY`) signs typed data only after OAuth identity matches the requested username.

V1 binds recipient, username, trait hash, metadata URI, and a ten-minute deadline. Trace binds recipient, username, weekKey, trait hash, and deadline.

Mint finalization independently checks that the transaction succeeded, targeted the configured contract, and matches the expected onchain identity fields.

## Environment and deployment

| Variable | Scope | Use |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical origin, OAuth callback origin, and NFT metadata origin. |
| `NEXT_PUBLIC_MONAD_RPC_URL` | Public | Monad RPC endpoint. |
| `NEXT_ADMON_CONTRACT_ADDRESS` | Server | Configured production V1 contract address. |
| `NEXT_ADMON_TRACE_CONTRACT_ADDRESS` | Server | Configured AdmonTrace contract address. |
| `NEXT_PUBLIC_LAUNCH_POST_URL` | Public, optional | X launch post included in share links. |
| `GITHUB_OAUTH_CLIENT_ID` | Server | OAuth App client ID. |
| `GITHUB_OAUTH_CLIENT_SECRET` | Server secret | OAuth App client secret and fallback session signer. |
| `GITHUB_SESSION_SECRET` | Server secret | Preferred HMAC signing secret for session/state cookies. |
| `GITHUB_PAT` | Server secret, optional | Public GitHub API rate-limit headroom. |
| `MONAD_AUTHORIZER_PRIVATE_KEY` | Server secret | V1 EIP-712 authorization signer. |
| `MONAD_TRACE_AUTHORIZER_PRIVATE_KEY` | Server secret, optional | Trace EIP-712 signer; falls back to V1 authorizer. |
| `DATABASE_URL` / `DIRECT_URL` | Server secret | Prisma database connection strings. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Server-side Supabase Storage access. |

The production deployment target is Vercel at `https://admon.peerfix.dev`. Its GitHub OAuth callback must be `https://admon.peerfix.dev/api/github/callback`. The production environment must configure all server secrets in Vercel, never in browser code, source control, or a deployed client bundle.

## Deliberate scope boundaries

- Mainnet only. No testnet integration is present.
- The project does not deploy or verify contracts from the repository; the owner deploys and verifies manually in Remix.
- The application does not custody wallets, MON, NFTs, or user private keys.
- No private GitHub data, write scope, or repository source code is requested.
- Build Scores summarize public signals only. They are not employment credentials, financial products, or a measure of personal worth.
- Genesis eligibility is off-chain and V1-only; Trace weekly mints are independent of the snapshot.

## Build attribution

This attribution describes the development process, not a runtime application dependency.

- Prompt Engineering: Mojeeb Titilayo
- Prompt Optimization: Claude (Sonnet 5)
- AI-assisted implementation: Codex (GPT-5.6 Terra)
