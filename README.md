# StickyClick

Shopify app that adds a sticky add-to-cart button to product pages.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Fill in SHOPIFY_API_KEY, SHOPIFY_API_SECRET, DATABASE_URL, DIRECT_URL

# 3. Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# 4. Link your Shopify app
npm run config:link

# 5. Start dev server
npm run dev
```

## Project Structure

```
app/
  routes/
    app.tsx              — Embedded app shell (auth + AppProvider)
    app._index.tsx       — Settings form (enable, colors)
    auth.login/          — Login page
  db.server.ts           — Prisma client singleton
  shopify.server.ts      — Shopify app config
prisma/
  schema.prisma          — Session + ShopSettings models
extensions/
  sticky-button/         — Theme App Extension
    blocks/              — Liquid block
    assets/              — JS logic
```

## Tech Stack

- React Router v7 + Vite
- Shopify App Bridge + Polaris
- Prisma (PostgreSQL)
- Theme App Extension (Liquid + vanilla JS)
