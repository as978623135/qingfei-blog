import React from 'react';
import { motion } from 'framer-motion';

interface PostCardProps {
  title: string;
  summary: string;
  date: string;
  onClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ title, summary, date, onClick }) => {
  return (
    <motion.article
      className="bg-white/90 rounded-2xl p-7 shadow-lg border border-blue-100 cursor-pointer relative overflow-hidden"
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(59, 130, 246, 0.15)' }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-500 to-sky-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      <h2 className="text-xl font-semibold text-slate-800 mb-3 leading-snug">{title}</h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-4">{summary}</p>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span><i className="far fa-calendar-alt mr-1.5 text-sky-500"></i>{date}</span>
        <span><i className="far fa-clock mr-1.5 text-sky-500"></i>阅读全文</span>
      </div>
    </motion.article>
  );
};

export default PostCard;