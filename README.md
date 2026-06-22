# Product API

A backend API for browsing 200,000 products with fast, stable pagination.

Built with Node.js, TypeScript, Express, and PostgreSQL (Supabase).

Live URL: https://product-api-x9ua.onrender.com

---

## Architecture

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js + TypeScript | Type safety, clean architecture |
| Framework | Express | Minimal, easy to reason about |
| Database | PostgreSQL via Supabase | Reliable, free, supports advanced index types |
| Hosting | Render | Free tier, simple deployment |

No ORM was used. Raw SQL gives full control over query structure and index usage — critical for keyset pagination correctness.

---

## API

### GET /products

Browse products, newest first.

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| cursor | string | No | Omit for first page |
| category | string | No | Filter by category |
| limit | integer | No | Default 20, max 50 |

**Response:**

```json
{
  "data": [...],
  "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI0...",
  "hasMore": true
}
```

Pass `nextCursor` as `cursor` in your next request to get the next page.
`nextCursor` is `null` on the last page.

### GET /health

Returns `{ "status": "ok" }`. Used by Render to verify the service is running.

---

## Pagination Strategy

OFFSET pagination was rejected because it degrades with scale. A query with `OFFSET 10000` forces PostgreSQL to read and discard 10,000 rows on every request. At 200,000 products, deep pages become unacceptably slow.

Keyset pagination was used instead. Rather than skipping rows, each page uses the last row seen as a reference point:

```sql
WHERE (created_at, id) < ($cursor_created_at, $cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 20
```

The cursor is a base64-encoded JSON object containing the `created_at` and `id` of the last product on the current page. The client treats it as an opaque token — it is never parsed, only passed back unchanged.

`id` is included as a tiebreaker because two products can share the same `created_at` timestamp. Without it, pagination would be non-deterministic at timestamp boundaries.

Page load time is constant regardless of page depth — there is no performance difference between page 1 and page 1,000.

---

## Consistency Guarantees

Within a browsing session, users will never see duplicate products or miss products, even while data is changing.

**New inserts:** New products receive a `created_at` of now, which is newer than any cursor in an active session. Since the query only returns rows older than the cursor, new inserts never appear mid-session. They will appear naturally when a new session begins.

**Updates:** Products are ordered by `created_at`, which never changes after insert. Updating a product's price, name, or category does not affect its position in results. `updated_at` is used for auditing only, never for ordering.

These guarantees are a natural consequence of keyset pagination on an immutable sort key. No database transactions, locks, or snapshots are required.

---

## Index Strategy

Two indexes were created:

```sql
-- Filtered browsing (with category)
CREATE INDEX idx_products_browse
ON products (category, created_at DESC, id DESC);

-- Unfiltered browsing (no category)
CREATE INDEX idx_products_created
ON products (created_at DESC, id DESC);
```

`category` is the leftmost column in `idx_products_browse` because it is an equality filter — it eliminates the majority of rows instantly. The remaining columns are already sorted in the index, so PostgreSQL performs no additional sort step.

A separate index for the unfiltered case is necessary because PostgreSQL cannot efficiently skip the leading `category` column when it is absent from the query.

---

## Seed Strategy

200,000 products were generated using a single PostgreSQL `generate_series` statement:

```sql
INSERT INTO products (name, category, price, created_at, updated_at)
SELECT
  'Product ' || gs,
  (ARRAY['electronics','clothing','books','furniture','sports','toys','beauty','food'])[floor(random() * 8 + 1)],
  round((random() * 9999 + 1)::numeric, 2),
  NOW() - (random() * interval '365 days'),
  NOW() - (random() * interval '365 days')
FROM generate_series(1, 200000) AS gs;
```

This runs entirely inside PostgreSQL with a single round trip. Row-by-row insertion in a loop was avoided — at 200,000 rows with a remote database, that approach would take hours.

The seed script is committed at `seed/seed.sql`.

---

## Local Setup

1. Clone the repo
2. Install dependencies:
```bash
   npm install
```
3. Create `.env`:
DATABASE_URL=your_supabase_connection_string

PORT=3000
4. Run the schema migration in Supabase SQL Editor (`src/db/migrations/001_create_products.sql`)
5. Seed the database (`seed/seed.sql`)
6. Start the server:
```bash
   npm run dev
```

---

## Future Improvements

- **Full-text search on name** — add a GIN index on `to_tsvector(name)` for keyword search
- **Cursor expiry** — reject cursors older than a configurable TTL
- **Response caching** — cache first-page responses with a short TTL using Redis
- **COPY-based seeding** — for datasets beyond 1 million rows, PostgreSQL COPY via pg-copy-streams would be faster than multi-row INSERT
- **Rate limiting** — protect the API from abuse using express-rate-limit
- **Pagination metadata** — return total category counts without COUNT(*) using approximate counts via pg_stat_user_tables

---

## How I Used AI

I used Claude as a mentor throughout this project. It guided me through engineering decisions rather than generating code directly — explaining tradeoffs, challenging weak decisions, and forcing me to reason through each choice before implementation.

Specific areas where AI helped:
- Explaining keyset pagination and why OFFSET fails at scale
- Identifying the composite cursor requirement (created_at + id tiebreaker)
- Explaining index column ordering and why category must be leftmost
- Explaining why the Supabase JS SDK was the wrong tool for this task

Things I caught or fixed myself:
- Cursor encoding bug — date was serialized as locale string instead of ISO format, causing PostgreSQL timezone error
- Parameter count mismatch in the cursor + category query branch
- Accidentally exposed database credentials in chat — rotated immediately

The backend logic, SQL queries, and architecture decisions were reasoned through collaboratively. I understand every line of code and can explain and modify it live.