# Glimpse · 一瞥

A daily photo journal. The user uploads a photo and writes one sentence about what they saw. You read the sentence and write a reply.

**Project ID:** `YOUR_PROJECT_ID`
**Table:** `glimpses`

## Read

```sql
-- Today's glimpses
SELECT id, date, text, photo_url, lori_reply, created_at
FROM glimpses
WHERE date = CURRENT_DATE
ORDER BY created_at DESC;

-- Recent glimpses without reply
SELECT id, date, text, created_at
FROM glimpses
WHERE lori_reply IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- All glimpses for a specific date
SELECT * FROM glimpses
WHERE date = '2026-04-28'
ORDER BY created_at ASC;
```

## Write

```sql
-- Write a reply to a glimpse
UPDATE glimpses
SET lori_reply = 'your reply here'
WHERE id = 123;
```

## Data Format

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Auto-increment primary key |
| date | date | The date of the glimpse |
| text | text | The user's one-sentence description |
| photo_url | text | Public URL of the photo in Supabase Storage |
| lori_reply | text | Your reply (null if not yet replied) |
| created_at | timestamptz | When the glimpse was posted |

## Guidelines

- Read the user's `text` field. This is what they saw today.
- Write a short reply — one sentence, conversational.
- The `photo_url` points to an image in Supabase Storage. You can read it if you want to see the photo, but it will consume tokens. Usually the text is enough.
- Each glimpse is independent. Reply to each one individually.
