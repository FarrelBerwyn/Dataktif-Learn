import React, { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface CategoryFilterBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Standard requested category sequence
  const requestedOrder = [
    'All',
    'AI & Technology',
    'Business',
    'Marketing',
    'Programming',
    'Design',
    'Finance',
    'Entrepreneurship',
  ];

  // Merge while preserving unique categories
  const sortedCategories = [
    ...requestedOrder.filter((cat) => cat === 'All' || categories.includes(cat)),
    ...categories.filter((cat) => !requestedOrder.includes(cat) && cat !== 'All'),
  ];

  return (
    <div className="relative mb-6 sm:mb-8">
      {/* Horizontal pill filter bar */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-0 no-scrollbar scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {sortedCategories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          const displayLabel = cat.toLowerCase() === 'all' ? t.catalog.allCategories : cat;

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-[#2867A8] text-white border-[#2867A8] shadow-[0_2px_10px_rgba(40,103,168,0.25)] font-semibold'
                  : 'bg-white/80 hover:bg-white text-[#4A647A] hover:text-[#18324A] hover:bg-[#F4F9FF] border-[rgba(80,140,190,0.2)] shadow-2xs'
              }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
