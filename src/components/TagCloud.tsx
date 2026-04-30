import React from 'react';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

interface TagCloudProps {
  tags: { name: string; count: number }[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

const TagCloud: React.FC<TagCloudProps> = ({ tags, selectedTag, onSelectTag }) => {
  return (
    <div className="bg-white/90 rounded-2xl p-6 shadow-lg border border-sky-100">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-sky-100">
        <Tag className="w-5 h-5 text-sky-500" />
        <h3 className="font-semibold text-slate-800">标签云</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-slate-400 text-sm">暂无标签</p>
        ) : (
          tags.map((tag) => (
            <motion.button
              key={tag.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectTag(selectedTag === tag.name ? null : tag.name)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedTag === tag.name
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600'
              }`}
            >
              {tag.name}
              <span className="ml-1 text-xs opacity-70">({tag.count})</span>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default TagCloud;
