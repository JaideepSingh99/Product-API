import axios from "axios";
import type { ProductsResponse } from "../types/product";

const API_URL = import.meta.env.VITE_API_URL;

interface GetProductsParams {
    cursor?: string | null;
    category?: string;
    limit?: number;
}

export async function getProducts({
    cursor,
    category,
    limit = 20,
}: GetProductsParams): Promise<ProductsResponse> {
    const params = new URLSearchParams();

    if (cursor) params.append("cursor", cursor);
    if (category && category !== "all") {
        params.append("category", category);
    }

    params.append("limit", limit.toString());

    const response = await axios.get<ProductsResponse>(
        `${API_URL}/products?${params.toString()}`
    );

    console.log("API URL:", API_URL);
    console.log("Request URL:", `${API_URL}/products?${params.toString()}`);

    return response.data;
}