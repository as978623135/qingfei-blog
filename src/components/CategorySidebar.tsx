import React from 'react';
import { motion } from 'framer-motion';
import { Folder, FolderOpen } from 'lucide-react';

interface CategorySidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  postCounts: Record<string, number>;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  postCounts
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/90 rounded-2xl shadow-lg shadow-sky-100/50 border border-sky-100 p-6 sticky top-24"
    >
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Folder className="w-5 h-5 text-sky-500" />
        文章分类
      </h3>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category}>
            <button
              onClick={() => onSelectCategory(category)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-md'
                  : 'hover:bg-sky-50 text-slate-600'
              }`}
            >
              <span className="flex items-center gap-2">
                {selectedCategory === category ? (
                  <FolderOpen className="w-4 h-4" />
                ) : (
                  <Folder className="w-4 h-4" />
                )}
                {category}
              </span>
              <span className={`text-sm ${selectedCategory === category ? 'text-white/80' : 'text-slate-400'}`}>
                {postCounts[category] || 0}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default CategorySidebar;
