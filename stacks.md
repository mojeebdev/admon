# Stack Brief - Admon

Last updated: 2026-07-18

## Overview

Admon is a Next.js application that reads a GitHub-authenticated builder's public activity, stores a derived build record in Postgres, and mints a wallet-bound ERC-721 proof on Monad Mainnet. GitHub OAuth identity is verified server-side; the mint path uses a server-held EIP-712 authorizer so a wallet can only mint the verified GitHub record it was authorized for.

## Source Evidence

- `package.json` and `package-lock.json` provide the application dependencies and installed versions.
- `prisma/schema.prisma` defines the persisted build-record and mint fields.
- `.env.example`, `app/lib/monad.ts`, and `contracts/Admon.sol` define the Mainnet and contract configuration.
- `app/api/github/*`, `app/api/mint-authorization/route.ts`, and `app/api/finalize-mint/route.ts` define the verification and mint path.

## Frontend

- **Framework:** Next.js 15.5.15 with React 19.2.5 and the App Router.
- **Styling:** Semantic TSX plus a single global CSS design system in app/globals.css. Tailwind is installed but is not used by the shipped UI.
- **State management:** Local React state for the verification interface; TanStack React Query 5.99.2 is provided for wallet/query integration.
- **Wallet UI:** Wagmi 2.19.5 with an injected EIP-1193 connector. The interface prompts the wallet to switch to Monad Mainnet before minting.

## Backend / API

- **Framework/runtime:** Next.js route handlers on the Node.js runtime.
- **API style:** REST-style route handlers for GitHub OAuth, build analysis, EIP-712 mint authorization, mint finalization, NFT metadata, Open Graph images, and aggregate statistics.
- **GitHub integration:** GitHub OAuth with an HMAC-signed, HTTP-only session cookie. Public GitHub profile, repository, stars, and commit-search data are read after identity verification.

## Data Layer

- **Database:** Supabase-hosted PostgreSQL, configured through DATABASE_URL and DIRECT_URL.
- **ORM:** Prisma 5.22.0 with a Car model holding GitHub identity metadata, trait JSON, rarity score, mint receipt state, owner address, and image URL.
- **Object storage:** Supabase Storage bucket named cars for persisted PNG share cards.

## Media Generation

- **Purpose:** Create a downloadable and social-shareable PNG card for a verified build record.
- **Technology:** Custom SVG vehicle renderer, @resvg/resvg-js 2.6.2, Sharp 0.34.5, and the app's bundled font files.
- **Configuration:** The renderer maps public GitHub traits to chassis, paint, wheels, aero, headlights, finish, and rarity; it is used in both the app and the server-side share image routes.

## Auth

- **GitHub identity:** GitHub OAuth App using GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET.
- **Session security:** HMAC-signed session and OAuth-state cookies using GITHUB_SESSION_SECRET, with secure cookies in production.
- **Wallet identity:** The connected injected wallet signs the onchain transaction. The server authorizes the exact recipient wallet for a short-lived mint.

## Blockchain / Web3

- **Chain:** Monad Mainnet, chain ID 143, native currency MON.
- **Contract:** contracts/Admon.sol. The contract is not assigned a deployed address in source control; the production address is supplied through NEXT_ADMON_CONTRACT_ADDRESS after Remix deployment.
- **Client libraries:** Viem 2.48.1 for RPC, hashes, typed-data signatures, and receipt reads; Wagmi 2.19.5 for the browser wallet connection.
- **Mint security:** Admon is an ERC-721 with one token per GitHub username. It validates an EIP-712 signature over recipient, username, canonical trait hash, token URI, and deadline. The signature is created only after the GitHub OAuth session matches the requested record.

## Infra / Deploy

- **Hosting:** No host-specific configuration is committed. The application expects a Node-compatible Next.js deployment with environment variables configured by the deployer.
- **CI/CD:** No CI pipeline is configured in the repository.
- **Contract deployment and verification:** Performed manually in Remix by the project owner.

## Deliberate Scope Boundaries

No runtime AI model provider, RAG pipeline, fine-tuning process, agent framework, prompt layer, or LLM observability system is present in this codebase. The application uses deterministic GitHub-derived traits and cryptographic authorization rather than model-generated decisions.

## Prompt Engineering and Build Assistance

This attribution describes the development process, not a runtime AI layer in the deployed application.

- **Prompt Engineering by:** Mojeeb Titilayo
- **Optimized by:** Claude (Sonnet 5)
- **AI-assisted implementation by:** Codex (GPT-5.6 Terra)
