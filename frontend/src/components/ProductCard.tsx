import type { Product } from "../types/product";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({
    product,
}: ProductCardProps) {
    return (
        <div className="product-card">
            <h3 className="product-name">
                {product.name}
            </h3>

            <p className="product-category">
                {product.category.charAt(0).toUpperCase() +
                    product.category.slice(1)}
            </p>

            <p className="product-price">
                ₹
                {Number(product.price).toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                )}
            </p>
        </div>
    );
}