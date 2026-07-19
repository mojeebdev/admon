# Admon

Admon turns a builder's public GitHub activity into a wallet-bound build record on Monad Mainnet. GitHub OAuth confirms that the builder controls the profile before a record can be minted, protecting public work from impersonation.

- Live app: [admon.peerfix.dev](https://admon.peerfix.dev)
- Garage: [admon.peerfix.dev/garage](https://admon.peerfix.dev/garage)
- OpenSea collection: [Admon](https://opensea.io/collection/admon)
- Verified Monad contract: [`0xb6aedBF17a11928A63773F88a9CfD3E252F43a63`](https://monadscan.com/address/0xb6aedBF17a11928A63773F88a9CfD3E252F43a63)

## What it does

- Confirms a builder's GitHub identity with read-only OAuth.
- Reads only public GitHub signals: commits, streaks, repositories, stars, languages, and account age.
- Creates a transparent Build Score and a vehicle trait set from those signals.
- Mints one ERC-721 proof per GitHub username on Monad Mainnet.
- Links verified mints to Monadscan and OpenSea.

Admon never requests private-repository access, GitHub write access, or a wallet private key. See the in-app [privacy page](https://admon.peerfix.dev/privacy) for the data boundary and builder-protection rationale.

## Stack

Next.js 15, TypeScript, Prisma, Supabase Postgres and Storage, GitHub OAuth, Viem, Wagmi, Monad Mainnet, and an ERC-721 contract with server-issued EIP-712 mint authorization.

[stacks.md](./stacks.md) contains the source-cited technical stack brief generated with [StackBrief](https://www.npmjs.com/package/@blindspotlab/stackbrief).

## Run locally

1. Copy `.env.example` to `.env`, supply the required credentials, and set `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
2. Create a public Supabase Storage bucket named `cars`.
3. Register `http://localhost:3000/api/github/callback` as the GitHub OAuth callback URL for local work.
4. Install dependencies and sync the database:

   ```bash
   npm install
   npx prisma db push
   npm run dev
   ```

## Deploy

Deploy the `mojeebdev/admon` repository to Vercel. Set every variable in `.env.example`, especially:

- `NEXT_PUBLIC_APP_URL=https://admon.peerfix.dev`
- `NEXT_ADMON_CONTRACT_ADDRESS=0xb6aedBF17a11928A63773F88a9CfD3E252F43a63`
- `NEXT_PUBLIC_LAUNCH_POST_URL` after publishing the Admon launch post, so builder shares include it.

Register this production GitHub OAuth callback URL:

```text
https://admon.peerfix.dev/api/github/callback
```

## Spark submission checklist

Admon is a Monad Mainnet submission. Submit these fields:

- **Name:** Admon
- **Description:** Wallet-bound proof of public GitHub build history.
- **Problem:** Builders need a credible, portable way to prove public work without letting others mint their identity.
- **Solution:** GitHub OAuth verifies account control, then Admon turns transparent public signals into a wallet-bound Monad NFT.
- **Project URL:** https://admon.peerfix.dev
- **GitHub repository:** https://github.com/mojeebdev/admon
- **Category:** Monad Mainnet
- **Contract:** `0xb6aedBF17a11928A63773F88a9CfD3E252F43a63`
- **Demo video:** Public URL, three minutes or less.
- **Social post URL:** Required only for the Most Viral Solution prize.

Before submitting, complete a real GitHub verification and Mainnet mint. Spark judges check for live functionality, meaningful commit history, and absence of placeholder or fake interactions.

## License

MIT. See [LICENSE](./LICENSE).
