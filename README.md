# Product API

A backend API for browsing 200,000 products with fast, stable pagination.

The system uses cursor-based (keyset) pagination with PostgreSQL indexes to provide page-depth independent performance.

Built with Node.js, TypeScript, Express, and PostgreSQL (Supabase).

**Live URL:** https://product-api-x9ua.onrender.com

---

## Architecture

| Layer     | Technology              | Reason                                        |
| --------- | ----------------------- | --------------------------------------------- |
| Runtime   | Node.js + TypeScript    | Type safety, clean architecture               |
| Framework | Express                 | Minimal, easy to reason about                 |
| Database  | PostgreSQL via Supabase | Reliable, free, supports advanced index types |
| Hosting   | Render                  | Free tier, simple deployment                  |

No ORM was used. Raw SQL gives full control over query structure and index usage, which is critical for keyset pagination correctness and performance.

---

## API

### GET /products

Browse products, newest first.

### Query Parameters

| Param    | Type    | Required | Description         |
| -------- | ------- | -------- | ------------------- |
| cursor   | string  | No       | Omit for first page |
| category | string  | No       | Filter by category  |
| limit    | integer | No       | Default 20, max 50  |

The maximum limit is capped at 50 to prevent excessively large responses and protect backend resources.

### Response

```json
{
  "data": [...],
  "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI0...",
  "hasMore": true
}
```

Pass `nextCursor` as `cursor` in your next request to get the next page.

`nextCursor` is `null` on the last page.

---

### GET /health

Returns:

```json
{
  "status": "ok"
}
```

Used by Render to verify the service is running.

---

## Pagination Strategy

OFFSET pagination was rejected because it degrades with scale. A query with `OFFSET 10000` forces PostgreSQL to read and discard 10,000 rows on every request. As page depth increases, query cost increases as well.

Keyset pagination was used instead. Rather than skipping rows, each page uses the last row seen as a reference point:

```sql
WHERE (created_at, id) < ($cursor_created_at, $cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 20
```

The cursor is a Base64-encoded JSON object containing the `created_at` and `id` of the last product on the current page. The client treats it as an opaque token and passes it back unchanged.

`id` is included as a tiebreaker because multiple products can share the same `created_at` timestamp. Without it, pagination would be non-deterministic at timestamp boundaries.

Query performance remains effectively constant regardless of page depth because PostgreSQL can seek directly into the index using the cursor position rather than scanning and discarding earlier rows.

---

## Consistency Guarantees

Within a browsing session, users will not encounter duplicate or skipped products caused by pagination while traversing a stable ordering of products.

### New Inserts

New products receive a `created_at` value newer than any cursor already issued.

Since pagination only requests products older than the cursor position, newly inserted products do not appear in the middle of an active browsing session.

They become visible naturally when a new browsing session begins.

### Updates

Products are ordered by `created_at`, which never changes after insertion.

Updating a product's:

* price
* name
* category

does not affect its position in results.

`updated_at` is used for auditing only and is never used for ordering.

### Why No Snapshots?

These guarantees are a consequence of keyset pagination on an immutable sort key (`created_at`). Because ordering never changes after insertion, PostgreSQL can provide stable traversal without requiring locks, transactions, or database snapshots.

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

`category` is the leftmost column in `idx_products_browse` because it is an equality filter and eliminates a large portion of rows immediately.

The remaining columns match the query ordering, allowing PostgreSQL to avoid an additional sort operation.

A separate index for the unfiltered case is necessary because PostgreSQL cannot efficiently use the category-prefixed index when category filtering is absent.

---

## Seed Strategy

200,000 products were generated using a single PostgreSQL `generate_series()` statement:

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

This runs entirely inside PostgreSQL with a single round trip.

Row-by-row insertion in a loop was avoided because it would require hundreds of thousands of network round trips and scale poorly compared to a set-based PostgreSQL operation.

The seed script is committed at:

```text
seed/seed.sql
```

---

## Testing

The following scenarios were verified:

* First-page retrieval
* Cursor pagination across multiple pages
* Category filtering
* Deep pagination
* Invalid cursor handling
* No duplicate products across pages
* Pagination behavior after inserting additional products
* Health endpoint availability

---

## Local Setup

1. Clone the repository.

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```env
DATABASE_URL=your_supabase_connection_string
PORT=3000
```

4. Run the schema migration in the Supabase SQL Editor:

```text
src/db/migrations/001_create_products.sql
```

5. Seed the database:

```text
seed/seed.sql
```

6. Start the development server:

```bash
npm run dev
```

---

## Future Improvements

* Full-text search on product names using PostgreSQL GIN indexes
* Cursor expiration and validation
* Redis caching for high-traffic first-page requests
* API rate limiting
* Additional filtering options
* Structured logging and observability
* Automated integration tests
* Read replicas for larger-scale deployments

---

## How I Used AI

I used Claude as a mentor throughout this project. It helped me reason through engineering decisions rather than generating a complete solution.

Areas where AI was useful:

* Understanding keyset pagination and its tradeoffs
* Identifying the need for a composite cursor (`created_at` + `id`)
* Explaining index design and column ordering
* Reviewing architectural decisions
* Challenging assumptions around scalability and consistency

Issues I identified and fixed myself:

* Cursor encoding bug caused by serializing dates incorrectly
* Parameter count mismatch in one query branch
* Connection string issues during Supabase integration
