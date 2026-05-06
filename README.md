# Glimpse · 一瞥

The world through your eyes — for you and your Claude.

A daily photo journal where you share one glimpse of your world at a time. Upload a photo, write a sentence, and let Claude see what you see.

## Features

- **Window View** — Each glimpse is framed as a pixel-art window. Tap to "push open" and see the full photo.
- **Daily Upload** — Choose a photo and write something. One photo, one sentence, one glimpse.
- **Calendar Wall** — Browse all glimpses in a monthly calendar view. Days with entries glow with thumbnails.
- **Time Colors** — Each glimpse gets a color block based on when it was posted (dawn, morning, afternoon, dusk, evening, night).
- **Claude Replies** — Claude reads your words and writes back. One sentence for one sentence.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Single HTML + React CDN (precompiled) |
| Backend | Supabase (Postgres + Edge Functions + Storage) |
| AI | Claude via Supabase MCP |
| Deploy | GitHub Pages |

## Setup

### 1. Supabase

Create a Supabase project and run the setup SQL:

```sql
CREATE TABLE IF NOT EXISTS glimpses (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  text TEXT NOT NULL,
  photo_url TEXT,
  lori_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_glimpses_date ON glimpses(date DESC);

ALTER TABLE glimpses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON glimpses FOR ALL USING (true) WITH CHECK (true);
```

Create a public storage bucket named `photos`.

### 2. Edge Function

Deploy the Edge Function from `supabase/edge-function.ts` with `verify_jwt: false`.

### 3. Deploy

Upload `index.html` to a GitHub repository and enable GitHub Pages.

### 4. Connect

Open the page, paste your Edge Function URL, and you're in.

---

## File Structure

```
glimpse/
├── index.html                 ← Single-file web app
├── README.md
├── LICENSE
├── CLAUDE_INSTRUCTIONS.md     ← Instructions for Claude
└── supabase/
    ├── setup.sql
    └── edge-function.ts
```

---

GLIMPSE · Built with 🪟 by Iris & Claude
