# surf · mindshare

Crypto social intelligence dashboard powered by [Surf](https://asksurf.ai). Kaito-style mindshare arena, yapper leaderboard, news pulse, and event timeline — all backed by the Surf API.

## Features

- **Mindshare Leaderboard** across the top 100 of ~5k indexed crypto projects
- **Top-15 category filter** matching Surf's `--tag` enum exactly (L1, L2, DEX, Perps, CEX, GameFi, NFT, Oracle, Prediction, RWA, Yield, Data, DevTool, Compliance, Meme)
- **Pre-TGE / Post-TGE** split
- **Category Arena** — top projects of current category battling by rank
- **Project Spotlight** with mindshare trend, share-of-category (tag_percents), smart followers history, follower geography
- **Key events overlaid on the mindshare chart** — news + twitter signals with dated list
- **Mindshare Contributors panel** — Yappers (search-social-posts aggregated by author, ranked by view share) + Smart Followers tabs
- **News & Narratives** — AI Pulse (project-ai-news synthesized pulses with tldr bullets + sources) + News Feed (17 crypto sources with multi-select filter + trending/recency sort)
- **Live Posts** stream
- **Project search** across Surf's entire 5k+ project index
- Background prefetch of all 15 tag rankings on load
- Stale-while-revalidate on every panel

## Tech stack

- Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Recharts
- Dark theme: warm black `#0C0B0A` + electric lime `#C8FF3D` + amber / teal / rose accents
- Space Grotesk (display) · Inter (UI) · IBM Plex Mono (data)

## Local development

```bash
cp .env.example .env.local
# Open .env.local and paste your SURF_API_KEY
# (grab it from https://agents.asksurf.ai dashboard, or
#  read it from your surf CLI config and paste it in yourself).

npm install
npm run dev
# open http://localhost:3030
```

## Deploy to Vercel

The app is a zero-config Next.js app. Set one env var and deploy:

```bash
# one-time: link project to vercel
vercel link

# push env var (paste key when prompted)
vercel env add SURF_API_KEY production

# deploy
vercel --prod
```

The app calls the Surf HTTP API directly (no CLI binary). Any Vercel region works.

## Architecture

```
src/
  app/
    api/mindshare/
      ranking/         GET social-ranking
      trend/           GET social-mindshare (incl. tag_percents)
      detail/          GET social-detail
      smart-followers/ GET social-smart-followers-history
      posts/           GET search-social-posts
      yappers/         GET search-social-posts, aggregated by author
      search/          GET search-project
      events/          GET search-events
      news/            GET project-ai-news
      news-feed/       GET news-feed (supports multi-source fan-out)
  lib/
    surf.ts            HTTP client with per-request TTL cache,
                       in-flight dedup, 8-way concurrency gate
```

## License

MIT — data from [Surf](https://asksurf.ai).
