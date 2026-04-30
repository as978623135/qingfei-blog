import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { Post } from '../services/api';

interface ArchiveSidebarProps {
  posts: Post[];
  selectedArchive: string | null;
  onSelectArchive: (archive: string | null) => void;
}

const ArchiveSidebar: React.FC<ArchiveSidebarProps> = ({
  posts,
  selectedArchive,
  onSelectArchive,
}) => {
  const archives = React.useMemo(() => {
    const archiveMap = new Map<string, number>();
    posts.forEach((post) => {
      if (post.created_at) {
        const date = new Date(post.created_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}年${month}月`;
        archiveMap.set(key, (archiveMap.get(key) || 0) + 1);
      }
    });
    return Array.from(archiveMap.entries()).sort((a, b) => {
      const dateA = new Date(a[0].replace('年', '-').replace('月', ''));
      const dateB = new Date(b[0].replace('年', '-').replace('月', ''));
      return dateB.getTime() - dateA.getTime();
    });
  }, [posts]);

  const tags = React.useMemo(() => {
    const tagMap = new Map<string, number>();
    posts.forEach((post) => {
      if (post.tags) {
        post.tags.forEach((tag) => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
      }
    });
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [posts]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-64 bg-white/90 rounded-2xl shadow-lg border border-sky-100 p-6 h-fit"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-500" />
          时间归档
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => onSelectArchive(null)}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
              selectedArchive === null
                ? 'bg-sky-500 text-white'
                : 'text-slate-600 hover:bg-sky-50'
            }`}
          >
            全部时间
          </button>
          {archives.map(([archive, count]) => (
            <button
              key={archive}
              onClick={() => onSelectArchive(archive)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all flex justify-between items-center ${
                selectedArchive === archive
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <span>{archive}</span>
              <span className={`text-xs ${selectedArchive === archive ? 'text-white/80' : 'text-slate-400'}`}>
                {count}篇
              </span>
            </button>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-500" />
            热门标签
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => onSelectArchive(`tag:${tag}`)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedArchive === `tag:${tag}`
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-600'
                }`}
              >
                {tag} ({count})
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export default ArchiveSidebar;
