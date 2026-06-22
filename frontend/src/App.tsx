import { useEffect, useState } from "react";
import ProductList from "./components/ProductList";
import CategoryFilter from "./components/CategoryFilter";
import { getProducts } from "./services/api";
import type { Product } from "./types/product";

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("all");
  const [error, setError] = useState("");

  async function fetchFirstPage(selectedCategory: string) {
    try {
      setLoading(true);
      setError("");

      const response = await getProducts({
        category: selectedCategory,
      });

      setProducts(response.data);
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError("Failed to load products.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!cursor || loading) return;

    try {
      setLoading(true);

      const response = await getProducts({
        cursor,
        category,
      });

      setProducts((prev) => [...prev, ...response.data]);
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError("Failed to load more products.");
      console.error("Product fetch error:", err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFirstPage(category);
  }, [category]);

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "2rem",
      }}
    >
      <h1>Product Browser</h1>

      <p>
        Cursor-Based Pagination Demo
      </p>

      <p>
        200,000 Products
      </p>

      <div
        style={{
          marginBottom: "1rem",
        }}
      >
        <CategoryFilter
          value={category}
          onChange={setCategory}
        />
      </div>

      {error && (
        <p
          style={{
            color: "red",
          }}
        >
          {error}
        </p>
      )}

      <ProductList products={products} />

      {loading && <p>Loading...</p>}

      {!loading && hasMore && (
        <button
          onClick={loadMore}
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            cursor: "pointer",
          }}
        >
          Load More
        </button>
      )}
    </div>
  );
}

export default App;