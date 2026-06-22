interface CategoryFilterProps {
    value: string;
    onChange: (value: string) => void;
}

const categories = [
    "all",
    "electronics",
    "clothing",
    "books",
    "furniture",
    "sports",
    "toys",
    "beauty",
    "food",
];

export default function CategoryFilter({
    value,
    onChange,
}: CategoryFilterProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {categories.map((category) => (
                <option
                    key={category}
                    value={category}
                >
                    {category === "all"
                        ? "All Categories"
                        : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
            ))}
        </select>
    );
}