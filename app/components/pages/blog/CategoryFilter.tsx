'use client';

interface Category {
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
}

export function CategoryFilter({ categories, onCategorySelect, selectedCategory }: CategoryFilterProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onCategorySelect?.(category.name)}
            className={`minecraft-button px-4 py-2 text-sm ${
              selectedCategory === category.name 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                : ''
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}