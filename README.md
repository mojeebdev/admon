# Admon

Admon gives public GitHub build history a verifiable onchain record. A builder signs in with GitHub, Admon derives transparent traits from public activity, and a wallet-bound NFT mint stores the result on Monad Mainnet. The vehicle is the shareable artifact; the identity check, traits, and transaction are the proof.

## Documentation

- [stacks.md](./stacks.md) is the repository's source-cited technical stack brief, generated using the [StackBrief workflow](https://www.npmjs.com/package/@blindspotlab/stackbrief).
- [HACKATHON.md](./HACKATHON.md) tracks the Spark requirements and remaining submission evidence.
- [LAUNCH_POST.md](./LAUNCH_POST.md) contains the prepared public launch post.

## Stack

- Next.js 15, React 19, and TypeScript
- Prisma and Supabase Postgres plus Storage
- GitHub OAuth with signed, HTTP-only sessions
- Viem and Wagmi with an injected wallet connector
- Monad Mainnet, chain ID 143
- ERC-721 contract with server-issued EIP-712 mint authorization
- Custom SVG vehicle rendering and server-generated share cards

## Local setup

1. Copy .env.example to .env and supply the application values. Prisma CLI reads the root .env file; Next.js reads it too. You may use .env.local for Next-only overrides, but keep DATABASE_URL and DIRECT_URL in .env for Prisma.
2. Create a GitHub OAuth App with callback URL:

   http://localhost:3000/api/github/callback

3. Create a public Supabase Storage bucket named cars, then install dependencies and apply the Prisma schema:

   npm install
   npx prisma db push

4. Start the app:

   npm run dev

## Deploy to Vercel

1. Import the `mojeebdev/admon` repository into Vercel. Next.js is detected automatically, so no `vercel.json` file is required.
2. Add every value from `.env.example` as a Vercel environment variable. Keep `NEXT_ADMON_CONTRACT_ADDRESS` empty until the Remix deployment is verified.
3. Deploy, then set `NEXT_PUBLIC_APP_URL` to the final HTTPS Vercel domain and redeploy.
4. In your GitHub OAuth App, add this exact callback URL:

   https://YOUR_VERCEL_DOMAIN/api/github/callback

5. Send the final domain here after it is live so the production URL can be checked.

## Deploy and verify with Remix

You deploy and verify the contract manually. The deployable source is contracts/Admon.sol.

1. Open contracts/Admon.sol in Remix, compiling with Solidity 0.8.24 and OpenZeppelin Contracts v5 imports enabled.
2. Connect Remix to Monad Mainnet, chain ID 143.
3. Deploy Admon with:
   - initialBaseURI: https://YOUR_APP_URL/api/metadata/
   - initialAuthorizedSigner: the public address for MONAD_AUTHORIZER_PRIVATE_KEY
4. Verify the contract yourself through the Monad Mainnet explorer.
5. In the hosted application, set NEXT_ADMON_CONTRACT_ADDRESS to the verified deployment address. Do not use a NEXT_PUBLIC contract environment variable.
6. Redeploy the web app and complete a real GitHub OAuth to Mainnet mint before submitting.

The contract address is public by nature, but it is deliberately read server-side from NEXT_ADMON_CONTRACT_ADDRESS and passed only where the mint UI needs it.

## User flow

1. Connect GitHub with OAuth.
2. Admon reads public profile, repository, star, and commit activity.
3. Review the generated build record and vehicle traits.
4. Connect an injected wallet on Monad Mainnet.
5. The server signs a ten-minute EIP-712 authorization for that GitHub profile and wallet.
6. The wallet mints the ERC-721. The app verifies the Monad receipt, stores the owner and transaction, and generates a share card.

## Routes

- /: problem-led verification landing page
- /commitcar: public proof garage. This route remains for backward-compatible links.
- /commitcar/[username]: individual proof, mint, and share card
- /api/github/*: OAuth login, callback, session, and logout
- /api/build: authenticated public GitHub analysis
- /api/mint-authorization: wallet-bound EIP-712 authorization
- /api/finalize-mint: Monad receipt verification and share-card persistence
- /api/metadata/[username]: ERC-721 metadata
- /api/og/[username]: PNG share image

## Spark submission

Read HACKATHON.md before submitting. The judging agent checks for static placeholder data and fake interactions, so do not submit until the hosted app, GitHub OAuth, database, share card, and Mainnet mint all work with real credentials.
