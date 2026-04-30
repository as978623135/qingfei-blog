import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, X, ChevronUp, ChevronDown, Play, Pause } from 'lucide-react';

interface MusicPlatform {
  name: string;
  pattern: RegExp;
  getEmbedUrl: (url: string) => string | null;
}

const platforms: MusicPlatform[] = [
  {
    name: '网易云音乐',
    pattern: /music\.163\.com.*song.*id=(\d+)/,
    getEmbedUrl: (url) => {
      const match = url.match(/id=(\d+)/);
      return match ? `https://music.163.com/outchain/player?type=2&id=${match[1]}&auto=0&height=66` : null;
    }
  },
  {
    name: 'QQ音乐',
    pattern: /y\.qq\.com.*song.*mid=([\w]+)/,
    getEmbedUrl: (url) => {
      const match = url.match(/mid=([\w]+)/);
      return match ? `https://y.qq.com/n/ryqq/player?mid=${match[1]}` : null;
    }
  },
  {
    name: '汽水音乐',
    pattern: /qishui\.douyin\.com/,
    getEmbedUrl: () => null
  }
];

const MusicPlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [platform, setPlatform] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const p of platforms) {
      if (p.pattern.test(url)) {
        const embed = p.getEmbedUrl(url);
        if (embed) {
          setEmbedUrl(embed);
          setPlatform(p.name);
          setIsPlaying(true);
        }
        break;
      }
    }
  };

  const clearPlayer = () => {
    setEmbedUrl('');
    setPlatform('');
    setIsPlaying(false);
    setUrl('');
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white/95 rounded-2xl shadow-xl border border-sky-100 p-4 mb-3 w-80"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Music size={16} className="text-sky-500" />
                音乐播放器
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {!embedUrl ? (
              <form onSubmit={handleUrlSubmit} className="space-y-3">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="粘贴音乐分享链接..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-sky-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-sky-500 text-white text-sm rounded-lg hover:bg-sky-600 transition-colors"
                >
                  播放
                </button>
                <p className="text-xs text-slate-400 text-center">
                  支持网易云音乐、QQ音乐
                </p>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{platform}</span>
                  <button
                    onClick={clearPlayer}
                    className="text-xs text-slate-400 hover:text-red-500"
                  >
                    清除
                  </button>
                </div>
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  className="rounded-lg"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full shadow-lg flex items-center justify-center text-white"
      >
        {isOpen ? <ChevronDown size={20} /> : <Music size={20} />}
      </motion.button>
    </motion.div>
  );
};

export default MusicPlayer;
