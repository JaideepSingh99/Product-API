export interface Product {
    id: string;
    name: string;
    category: string;
    price: string;
    created_at: string;
    updated_at: string;
}

export interface ProductsResponse {
    data: Product[];
    nextCursor: string | null;
    hasMore: boolean;
}