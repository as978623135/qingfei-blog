import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Search, Folder, Tag, Archive, Home as HomeIcon, Settings, Palette, Volume2, VolumeX, Music } from 'lucide-react';
import { api, Post } from '../services/api';
import { useClickSoundContext } from '../components/ClickSoundProvider';

const Home: React.FC = () => {
  const { isEnabled, setEnabled } = useClickSoundContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [weather, setWeather] = useState({ city: '定位中...', temp: '--', condition: '☀️' });
  const [bgType, setBgType] = useState<'color' | 'image'>('color');
  const [selectedColor, setSelectedColor] = useState('#e0f2fe');
  const [bgImage, setBgImage] = useState('');
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [showMusicPanel, setShowMusicPanel] = useState(false);

  // 本地音乐播放器初始化
  useEffect(() => {
    const audio = document.getElementById('local-music-audio') as HTMLAudioElement;
    const playBtn = document.getElementById('local-music-play');
    const pauseBtn = document.getElementById('local-music-pause');
    const vinylDisc = document.getElementById('vinyl-disc');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const progressThumb = document.getElementById('progress-thumb');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const vinylContainer = document.getElementById('vinyl-container');
    let isDragging = false;
    let rotation = 0;
    let animationId: number | null = null;

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const rotateVinyl = () => {
      if (vinylDisc && !audio.paused) {
        rotation += 1;
        vinylDisc.style.transform = `rotate(${rotation}deg)`;
        animationId = requestAnimationFrame(rotateVinyl);
      }
    };

    const stopRotation = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    if (audio) {
      // 加载元数据时更新总时长
      audio.onloadedmetadata = () => {
        if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration || 0);
      };

      // 播放时开始旋转
      audio.onplay = () => {
        if (!animationId) rotateVinyl();
      };

      // 暂停时停止旋转
      audio.onpause = () => {
        stopRotation();
      };

      // 更新进度条
      audio.ontimeupdate = () => {
        if (!isDragging && progressBar && progressThumb && currentTimeEl) {
          const percent = (audio.currentTime / (audio.duration || 1)) * 100;
          progressBar.style.width = `${percent}%`;
          progressThumb.style.left = `${percent}%`;
          currentTimeEl.textContent = formatTime(audio.currentTime);
        }
      };

      // 进度条点击跳转
      if (progressContainer) {
        progressContainer.onclick = (e) => {
          const rect = progressContainer.getBoundingClientRect();
          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          if (progressBar && progressThumb) {
            progressBar.style.width = `${percent * 100}%`;
            progressThumb.style.left = `${percent * 100}%`;
          }
          audio.currentTime = percent * (audio.duration || 0);
        };
      }
    }

    if (playBtn) {
      playBtn.onclick = () => {
        audio?.play();
      };
    }
    if (pauseBtn) {
      pauseBtn.onclick = () => {
        audio?.pause();
      };
    }

    return () => {
      stopRotation();
    };
  }, [showMusicPanel]);

  const colors = [
    '#e0f2fe', '#f0f9ff', '#ffffff', '#fef3c7', '#fce7f3',
    '#dbeafe', '#d1fae5', '#ede9fe', '#fee2e2', '#ffedd5'
  ];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setBgType('color');
    localStorage.setItem('blog_bg_type', 'color');
    localStorage.setItem('blog_bg_color', color);
    document.body.style.background = color;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBgImage(result);
        setBgType('image');
        localStorage.setItem('blog_bg_type', 'image');
        localStorage.setItem('blog_bg_image', result);
        document.body.style.background = `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(${result})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    loadPosts();
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const data = await res.json();
      const cityRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`);
      const cityData = await cityRes.json();
      const condition = data.current_weather.weathercode < 3 ? '☀️' : data.current_weather.weathercode < 50 ? '☁️' : '🌧️';
      setWeather({
        city: cityData.city || cityData.locality || '本地',
        temp: Math.round(data.current_weather.temperature) + '°C',
        condition
      });
    } catch {
      setWeather({ city: '北京', temp: '25°C', condition: '☀️' });
    }
  };

  const loadPosts = async () => {
    try {
      const data = await api.getPosts();
      setPosts(data);
    } catch (err) {
      console.error('加载文章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(posts.map(p => p.category || '未分类'));
    return ['全部', ...Array.from(cats)];
  }, [posts]);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach(p => {
      p.tags?.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [posts]);

  const archives = useMemo(() => {
    const dateMap = new Map<string, number>();
    posts.forEach(p => {
      if (p.created_at) {
        const date = new Date(p.created_at);
        const dateKey = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    });
    return Array.from(dateMap.entries())
      .sort((a, b) => {
        const dateA = new Date(a[0].replace(/[年月日]/g, '-'));
        const dateB = new Date(b[0].replace(/[年月日]/g, '-'));
        return dateB.getTime() - dateA.getTime();
      });
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === '全部' || (post.category || '未分类') === selectedCategory;
      const matchTag = !selectedTag || post.tags?.includes(selectedTag);
      const matchYear = !selectedYear || (post.created_at && formatDate(post.created_at) === selectedYear);
      return matchSearch && matchCategory && matchTag && matchYear;
    });
  }, [posts, searchQuery, selectedCategory, selectedTag, selectedYear]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="container pb-4">
      {/* 顶部导航 */}
      <div className="flex justify-between items-center mb-4" style={{ marginTop: '25px' }}>
        {/* 左侧：日期和天气 */}
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Calendar size={16} className="text-sky-500" />
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-sky-500">{weather.condition}</span>
            {weather.city} {weather.temp}
          </span>
        </div>
        {/* 右侧导航按钮组：首页、管理、背景、音效、音乐 */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
            <HomeIcon size={16} />
            首页
          </Link>
          <Link to="/admin" className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
            <Settings size={16} />
            管理
          </Link>
          <div className="w-px h-5 bg-slate-300 mx-1"></div>
          <div className="relative">
            <button
              onClick={() => setShowBgPanel(!showBgPanel)}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              <Palette size={16} />
              背景
            </button>
            <AnimatePresence>
              {showBgPanel && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white/95 rounded-xl shadow-lg border border-sky-100 p-4 z-50"
                >
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setBgType('color')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs ${bgType === 'color' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      纯色
                    </button>
                    <button
                      onClick={() => setBgType('image')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs ${bgType === 'image' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      图片
                    </button>
                  </div>
                  {bgType === 'color' ? (
                    <div className="grid grid-cols-5 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          className={`w-8 h-8 rounded-lg border-2 ${selectedColor === color ? 'border-sky-500' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-xs"
                      />
                      {bgImage && (
                        <img src={bgImage} alt="背景" className="w-full h-20 object-cover rounded-lg" />
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setEnabled(!isEnabled)}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
          >
            {isEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            音效
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMusicPanel(!showMusicPanel)}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              <Music size={16} />
              音乐
            </button>
            <AnimatePresence>
              {showMusicPanel && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white/95 rounded-xl shadow-lg border border-sky-100 p-4 z-50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-slate-700">音乐播放器</h3>
                    <button onClick={() => setShowMusicPanel(false)} className="text-slate-400 hover:text-slate-600">×</button>
                  </div>
                  {/* 本地音乐播放器 */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-800 mb-2 truncate font-medium" id="local-music-title">冰牙的白虎_白虎龍神丸</div>
                    <div className="flex items-center gap-3">
                      {/* 唱片图标 - 黑红配色精致设计 */}
                      <div id="vinyl-container" className="w-[60px] h-[60px] flex-shrink-0">
                        <div id="vinyl-disc" className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center relative overflow-hidden border-2 border-red-600 shadow-lg shadow-red-900/20">
                          {/* 唱片纹路 - 精细同心圆 */}
                          <div className="absolute inset-0 rounded-full" style={{background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 2px, rgba(220,38,38,0.15) 2px, rgba(220,38,38,0.15) 3px)'}}></div>
                          {/* 高光效果 */}
                          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-700/50 via-transparent to-transparent"></div>
                          {/* 外圈红色装饰环 */}
                          <div className="absolute inset-3 rounded-full border border-red-500/40"></div>
                          <div className="absolute inset-5 rounded-full border border-red-500/30"></div>
                          {/* 中心标签 - 红色主题 */}
                          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-inner">
                            <div className="w-3 h-3 rounded-full bg-black border border-red-400"></div>
                          </div>
                          {/* 反光效果 */}
                          <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-white/20 blur-sm"></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        {/* 进度条 - 粗条带进度钮 */}
                        <div className="flex items-center gap-2 group">
                          <span id="current-time" className="text-xs text-slate-500 w-8 text-right tabular-nums font-medium">0:00</span>
                          <div className="flex-1 relative h-3 bg-gray-200 rounded-full cursor-pointer" id="progress-container">
                            {/* 进度填充 */}
                            <div id="progress-bar" className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" style={{width: '0%'}}></div>
                            {/* 进度钮 */}
                            <div id="progress-thumb" className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-red-500 opacity-0 group-hover:opacity-100 transition-opacity" style={{left: '0%'}}></div>
                          </div>
                          <span id="total-time" className="text-xs text-slate-500 w-8 tabular-nums font-medium">0:00</span>
                        </div>
                        {/* 播放控制按钮 */}
                        <div className="flex gap-2">
                          <button id="local-music-play" className="flex-1 px-3 py-1.5 bg-sky-500 text-white text-xs rounded-lg hover:bg-sky-600 transition-colors">播放</button>
                          <button id="local-music-pause" className="flex-1 px-3 py-1.5 bg-slate-400 text-white text-xs rounded-lg hover:bg-slate-500 transition-colors">暂停</button>
                        </div>
                      </div>
                    </div>
                    <audio id="local-music-audio" className="hidden">
                      <source src="https://hwndaght0uij.meoo.pub/api/storage/v1/object/public/audio/冰牙的白虎_白虎龍神丸.mp3" type="audio/mpeg" />
                    </audio>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">自动加载服务器本地音频文件</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 页面标题和搜索区 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-8 mb-6"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">
          欢迎来到青飞的小站
        </h1>
        <p className="text-slate-500 mb-6">记录技术成长，分享编程心得</p>

        {/* 搜索框 */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章标题..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-sky-400 focus:outline-none transition-colors"
          />
        </div>
      </motion.div>

      {/* 三栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* 左侧边栏 - 文章分类 */}
        <aside className="lg:col-span-2">
          <div className="bg-white/90 rounded-xl shadow-sm border border-sky-100 p-4 sticky top-24">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <Folder size={16} className="text-sky-500" />
              文章分类
            </h3>
            <ul className="space-y-1">
              {categories.map(cat => (
                <li key={cat}>
                  <button
                    onClick={() => { setSelectedCategory(cat); setSelectedTag(''); setSelectedYear(''); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-600 hover:bg-sky-50'
                    }`}
                  >
                    {cat}
                    <span className="ml-2 text-xs opacity-70">
                      ({cat === '全部' ? posts.length : posts.filter(p => (p.category || '未分类') === cat).length})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* 中间主内容区 */}
        <main className="lg:col-span-6">
          {loading ? (
            <div className="text-center py-20 text-slate-400">加载中...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl text-slate-300 mb-3">✍️</div>
              <p className="text-slate-500">暂无匹配文章</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="bg-white/90 rounded-xl p-5 shadow-sm border border-sky-100 cursor-pointer group"
                >
                  <Link to={`/post/${post.id}`} className="block">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-sky-500 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-slate-500 text-sm mb-3 line-clamp-2">{post.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-sky-500" />
                        {formatDate(post.created_at || '')}
                      </span>
                      {post.category && (
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded">
                          {post.category}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </main>

        {/* 右侧边栏 - 时间归档 */}
        <aside className="lg:col-span-2">
          <div className="bg-white/90 rounded-xl shadow-sm border border-sky-100 p-4 sticky top-24">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <Archive size={16} className="text-sky-500" />
              时间归档
            </h3>
            <ul className="space-y-1">
              {archives.map(([date, count]) => (
                <li key={date}>
                  <button
                    onClick={() => { setSelectedYear(selectedYear === date ? '' : date); setSelectedTag(''); }}
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedYear === date
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-600 hover:bg-sky-50'
                    }`}
                  >
                    <span>{date}</span>
                    <span className="text-xs opacity-70">{count}篇</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 标签云 */}
          {tags.length > 0 && (
            <div className="bg-white/90 rounded-xl shadow-sm border border-sky-100 p-4 mt-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
                <Tag size={16} className="text-sky-500" />
                标签云
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setSelectedTag(selectedTag === tag ? '' : tag); setSelectedYear(''); }}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                      selectedTag === tag
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-sky-100'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Home;
