# Leo's NYC Trip

A 6-day NYC trip planner built with Next.js 14 (App Router) and Tailwind CSS. Features an interactive Google Map, day-by-day itinerary with 52 stops across bookstores, vegan restaurants, museums, and parks.

## Setup

### 1. Get Google API Keys

- **Google Maps JavaScript API key** — used client-side for the map. Enable "Maps JavaScript API" in Google Cloud Console.
- **Google Places API key** — used server-side only to fetch live place details. Enable "Places API" in Google Cloud Console.

You can use the same key for both if you prefer, but keeping them separate lets you restrict the Maps key to your domain and the Places key to server IPs.

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your keys:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
GOOGLE_PLACES_API_KEY=your_places_key
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the two environment variables (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and `GOOGLE_PLACES_API_KEY`) in the Vercel project settings.
4. Deploy.

## Features

- **Day tabs** — switch between 6 days of activities
- **Interactive map** — color-coded markers by stop type (food, books, museum, park, shopping, anchor)
- **Stop cards** — click to expand and see live Google Places details (hours, rating, website)
- **Mobile responsive** — toggle between Map and List views
- **Server-side Places proxy** — `/api/place/[placeId]` keeps your Places API key private with 1-hour caching
