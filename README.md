# Admon

Admon turns a builder's public GitHub activity into a wallet-bound, onchain build record on Monad Mainnet. Anyone can inspect a public GitHub username, but GitHub OAuth confirms the builder controls the profile before a record can be created or minted, protecting public work from impersonation.

- Live app: [admon.peerfix.dev](https://admon.peerfix.dev)
- Garage: [admon.peerfix.dev/garage](https://admon.peerfix.dev/garage)
- OpenSea collection: [Admon](https://opensea.io/collection/admon)
- Verified Monad contract: [`0xb6aedBF17a11928A63773F88a9CfD3E252F43a63`](https://monadscan.com/address/0xb6aedBF17a11928A63773F88a9CfD3E252F43a63)
- License: [MIT](./LICENSE)

## What Admon does

1. Anyone can check a public GitHub username and inspect its public build preview without signing in.
2. Admon reads public GitHub signals only, via the Commit Search and user/repo APIs:
   - **All-time public authored commits** from the account's `created_at` date to now (not limited to 365 days).
   - **Commits in the last 365 days** as a recent-activity signal.
   - Public repositories, stars, longest visible streak and peak hour from a recent commit sample, account age, and top language.
3. The public preview computes a transparent Build Score, rarity tier, and vehicle traits. It does not create a database record or mint authorization.
4. A builder signs in with GitHub using the read-only `read:user` scope.
5. Admon confirms the requested username exactly matches that authenticated GitHub account, then creates or refreshes the mintable build record.
6. The builder connects an injected wallet and mints one ERC-721 record for that GitHub username on Monad Mainnet.
7. The mint receipt, metadata, share card, Monadscan link, and OpenSea asset link are available from the build record.

Admon does not request private repository access, GitHub write permissions, private source code, or a wallet private key. It uses only two strictly necessary HTTP-only cookies for GitHub OAuth state and the signed-in GitHub session, not advertising or tracking cookies. See the in-app [privacy policy](https://admon.peerfix.dev/privacy) and [terms](https://admon.peerfix.dev/terms).

## Current stack

The application uses Next.js 16.2.10 with React 19, TypeScript 5.9, Prisma 5, Supabase Postgres and Storage, GitHub OAuth, Viem 2, Wagmi 3, Vercel Analytics, and Solidity ERC-721 contracts on Monad Mainnet (`Admon` V1 + `AdmonTrace` weekly).

The detailed, source-evidenced stack reference is [stack.md](./stack.md). It is maintained from the current codebase and lockfile. StackBrief was not run automatically because it is a third-party package that could export workspace contents.

## Local setup

### Prerequisites

- Node.js 20.9 or newer. The project is currently validated on Node.js 24.
- A Supabase project with Postgres and a public `cars` Storage bucket.
- A GitHub OAuth App.
- An injected EVM wallet, such as MetaMask, for a real mint.
- Monad Mainnet RPC access. The default is `https://rpc.monad.xyz`.

### Configure environment variables

Copy `.env.example` to `.env`. Do not commit `.env`.

```powershell
Copy-Item .env.example .env
```

For local work, set `NEXT_PUBLIC_APP_URL=http://localhost:3000`, then register this callback in the GitHub OAuth App:

```text
http://localhost:3000/api/github/callback
```

Set every required variable from `.env.example`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical application URL and NFT metadata origin. |
| `NEXT_PUBLIC_MONAD_RPC_URL` | Monad Mainnet RPC URL. |
| `NEXT_ADMON_CONTRACT_ADDRESS` | Deployed Admon (V1) contract address. This is server-only despite its historical `NEXT_` prefix. |
| `NEXT_ADMON_TRACE_CONTRACT_ADDRESS` | Deployed AdmonTrace contract address for the weekly collection. Server-only. |
| `NEXT_PUBLIC_LAUNCH_POST_URL` | Optional X launch post included in builder share links. |
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth credentials. |
| `GITHUB_SESSION_SECRET` | Random secret used to sign OAuth state and the HTTP-only GitHub session cookie. |
| `GITHUB_PAT` | Optional GitHub token used only to raise public API limits. |
| `MONAD_AUTHORIZER_PRIVATE_KEY` | Server-only private key that issues short-lived EIP-712 mint authorizations for V1. Never expose it in a browser or commit it. |
| `MONAD_TRACE_AUTHORIZER_PRIVATE_KEY` | Optional Trace-only EIP-712 signer. If unset, Trace reuses `MONAD_AUTHORIZER_PRIVATE_KEY`. |
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres connection URLs used by Prisma. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase credentials used to persist generated public share cards. |

### Install and run

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

`npm run dev` uses webpack intentionally because the project has a small custom webpack externals configuration. Visit [http://localhost:3000](http://localhost:3000).

### Validate a release

```bash
npx prisma generate
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

The current release passes these checks with zero production dependency vulnerabilities.

## Production deployment

Deploy `mojeebdev/admon` to Vercel, where Vercel Analytics is already integrated in the app. Set the full environment-variable set above in Vercel, with at least:

```text
NEXT_PUBLIC_APP_URL=https://admon.peerfix.dev
NEXT_ADMON_CONTRACT_ADDRESS=0xb6aedBF17a11928A63773F88a9CfD3E252F43a63
```

Register this production callback URL in the GitHub OAuth App:

```text
https://admon.peerfix.dev/api/github/callback
```

Create a public Supabase Storage bucket named `cars`. The application uploads generated PNG share cards with the server-only service-role key. Do not place that key in client code or browser-exposed environment variables.

## Contract and mint security

The verified [Admon contract](https://monadscan.com/address/0xb6aedBF17a11928A63773F88a9CfD3E252F43a63) is an MIT-licensed ERC-721 deployed on Monad Mainnet, chain ID `143`. The Solidity source is [contracts/Admon.sol](./contracts/Admon.sol).

- Contract name: `Admon`
- Token symbol: `ADMON`
- Compiler: Solidity `0.8.24`
- Constructor arguments: `initialBaseURI` and `initialAuthorizedSigner`
- One token can be minted for each GitHub username.
- A mint requires a server-issued EIP-712 signature binding the recipient wallet, username, canonical trait hash, token URI, and a ten-minute deadline.
- The contract owner can update the base URI and authorizer. The deployed owner is the wallet that deployed the contract in Remix.

The authorizer is necessary because GitHub OAuth happens offchain. It lets the server attest that the authenticated GitHub account and the recipient wallet were verified together, without ever needing the builder's wallet private key.

## Routes and public records

- `/` - verification landing page, live mint activity, and wallet connection.
- `/api/check` - public GitHub username preview. It does not write a build record or issue a mint authorization.
- `/garage` - public ranking of build records by Build Score, then total commits.
- `/garage/[username]` - public proof page with traits, score, onchain mint data, and OpenSea link.
- `/builder/[username]` - public builder ledger with historical records, Genesis status, and connection controls.
- `/preview/[username]` - public GitHub build preview that cannot be minted without GitHub OAuth.
- `/privacy` and `/terms` - data and builder-protection boundaries.
- `/api/metadata/[username]` - ERC-721 metadata endpoint.
- `/api/og/[username]` - dynamic social image endpoint.
- `/api/stats` - live aggregate and latest-mint activity endpoint.

Legacy `/commitcar` paths remain as compatibility routes, but all new links use `/garage`.

## Admon Trace weekly collection

Admon V1 remains the **Genesis collection**. Verified V1 records can be marked off-chain by the Genesis snapshot script after the cutoff below.

**Admon Trace** is a separate weekly collection. It does **not** read or enforce the Genesis snapshot onchain or in the Solidity contract. Trace mints are independent weekly proofs: one authenticated GitHub owner can mint one new record per UTC Friday, identified onchain by `GitHub username + Friday date` (`weekKey`).

Before deploying Admon Trace, add this server-only variable in Vercel and locally:

```text
NEXT_ADMON_TRACE_CONTRACT_ADDRESS=<deployed AdmonTrace address>
```

The Solidity source is [contracts/AdmonTrace.sol](./contracts/AdmonTrace.sol). Deploy it in Remix with:

1. `initialBaseURI`: `https://admon.peerfix.dev/api/weekly-metadata/`
2. `initialAuthorizedSigner`: the public address of `MONAD_TRACE_AUTHORIZER_PRIVATE_KEY`, or the existing `MONAD_AUTHORIZER_PRIVATE_KEY` if reusing the same signer.

The contract resolves token metadata from this base URI instead of saving a full URL per token. When Admon has its own metadata domain, the contract owner can call `setBaseURI` and indexers receive an ERC-4906 metadata update event. Keep `admon.peerfix.dev` serving V1 metadata because V1 token URLs were stored at mint time.

Use the same EIP-712 authorizer key as V1 by default, or define `MONAD_TRACE_AUTHORIZER_PRIVATE_KEY` to use a separate Trace signer.

Related app routes:

- `/builder/[username]` - builder ledger, Genesis badge when snapshotted, and Friday Trace mint.
- `/api/weekly-mint-authorization` / `/api/weekly-finalize-mint` - Trace mint auth and receipt.
- `/api/weekly-metadata/[username]/[weekKey]` / `/api/weekly-image/[username]/[weekKey]` - Trace token metadata and image.

Concept sketches live under [docs/](./docs/).

### Genesis snapshot

Genesis is an **off-chain database marking** of V1 `Car` records (and linked `Builder` rows). Neither `Admon.sol` nor `AdmonTrace.sol` stores Genesis numbers or the snapshot cutoff.

Eligibility: every persisted, GitHub-authenticated V1 build record with `createdAt` on or before **`2026-07-24T14:23:00Z`** (2:23 PM UTC / 3:23 PM Nigeria WAT). Anonymous previews do not create a database record and are not eligible.

The script refuses to run until that cutoff has passed. After applying the Prisma schema to the target database, inspect the deterministic snapshot first:

```bash
npm run genesis:snapshot
```

Then write it once you have reviewed the displayed order:

```bash
npm run genesis:snapshot -- --apply
```

The script assigns Genesis numbers in verified-record creation order, using the database ID as a stable tie-breaker. It is idempotent: rerunning it preserves the same numbers.

## Spark submission checklist

Admon is a Monad Mainnet submission. Submit:

- **Name:** Admon
- **Description:** Wallet-bound proof of public GitHub build history.
- **Problem:** Builders need a credible, portable way to prove public work without enabling others to mint their identity.
- **Solution:** GitHub OAuth verifies account control, then Admon turns transparent public signals into a wallet-bound Monad NFT.
- **Project URL:** https://admon.peerfix.dev
- **GitHub repository:** https://github.com/mojeebdev/admon
- **Category:** Monad Mainnet
- **Contract:** `0xb6aedBF17a11928A63773F88a9CfD3E252F43a63`
- **Demo video:** Public URL, three minutes or less.
- **Social post URL:** Required only for the Most Viral Solution prize.

Before submission, complete a real GitHub verification and Mainnet mint. The live product contains no mock records or fake activity.

## Credits

- Prompt Engineering: Mojeeb Titilayo
- Prompt Optimization: Claude (Sonnet 5)
- AI-assisted implementation: Codex (GPT-5.6 Terra)
