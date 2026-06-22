interface CursorPayload {
    createdAt: string;
    id: string;
}

export function encodeCursor(createdAt: Date, id: string): string {
    const payload: CursorPayload = {
        createdAt: createdAt.toISOString(),
        id
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function decodeCursor(cursor: string): CursorPayload {
    try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        return JSON.parse(decoded) as CursorPayload;
    } catch {
        throw new Error('Invalid cursor');
    }
}