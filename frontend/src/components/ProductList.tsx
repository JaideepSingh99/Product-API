import type { Product } from "../types/product";
import ProductCard from "./ProductCard";

interface ProductListProps {
    products: Product[];
}

export default function ProductList({
    products,
}: ProductListProps) {
    if (products.length === 0) {
        return (
            <div className="empty-state">
                <h3>No products found</h3>
                <p>
                    Try selecting a different category.
                </p>
            </div>
        );
    }

    return (
        <div className="product-grid">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                />
            ))}
        </div>
    );
}