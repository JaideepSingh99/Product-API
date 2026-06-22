import pool from "../db/client";
import { decodeCursor, encodeCursor } from "../utils/cursor";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export async function getProducts(
    cursor?: string,
    category?: string,
    limitParam?: number
) {
    const limit = Math.min(limitParam ?? DEFAULT_LIMIT, MAX_LIMIT);

    let query: string;
    let params: any[];

    if (cursor) {
        const { createdAt, id } = decodeCursor(cursor);

        if (category) {
            query = `
            select id, name, category, price, created_at, updated_at
            from products
            where category = $1
            and (created_at, id) < ($2, $3)
            order by created_at desc, id desc
            limit $4
            `;

            params = [category, createdAt, id, limit];
        } else {
            query = `
            SELECT id, name, category, price, created_at, updated_at
            FROM products
            WHERE (created_at, id) < ($1, $2)
            ORDER BY created_at DESC, id DESC
            LIMIT $3
            `;

            params = [createdAt, id, limit];
        }
    } else {
        if (category) {
            query = `
            SELECT id, name, category, price, created_at, updated_at
            FROM products
            WHERE category = $1
            ORDER BY created_at DESC, id DESC
            LIMIT $2
            `;
            params = [category, limit];
        } else {
            query = `
            SELECT id, name, category, price, created_at, updated_at
            FROM products
            ORDER BY created_at DESC, id DESC
            LIMIT $1
            `;
            params = [limit];
        }
    }

    const result = await pool.query(query, params);
    const rows = result.rows;

    const lastRow = rows[rows.length - 1];
    const nextCursor = rows.length === limit ? encodeCursor(lastRow.created_at, lastRow.id) : null;

    return {
        data: rows,
        nextCursor,
        hasMore: nextCursor !== null
    };
}