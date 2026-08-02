import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Search, Folder, Archive, Home as HomeIcon, Palette, Volume2, VolumeX, Download, Share2, Check, PenLine, Settings } from 'lucide-react';
import JSZip from 'jszip';
import { api, Post } from '../services/api';
import { useClickSoundContext } from '../components/ClickSoundProvider';
import safeStorage from '../utils/storage';
import AdminLoginModal from '../components/AdminLoginModal';
import CategoryManageModal from '../components/CategoryManageModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isEnabled, setEnabled } = useClickSoundContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'global' | 'title' | 'content'>('global');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [weather] = useState({ city: '北京', temp: '25°C', condition: '☀️' });
  const [bgType, setBgType] = useState<'color' | 'image'>('color');
  const [selectedColor, setSelectedColor] = useState('#e0f2fe');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!safeStorage.getItem('admin_token'));
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState('');
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [pageTip, setPageTip] = useState('');
  const lastWheelTime = useRef(0);
  const postsPerPage = 5;

  const colors = [
    '#e0f2fe', '#f0f9ff', '#ffffff', '#fef3c7', '#fce7f3',
    '#dbeafe', '#d1fae5', '#ede9fe', '#fee2e2', '#ffedd5'
  ];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setBgType('color');
    safeStorage.setItem('blog_bg_type', 'color');
    safeStorage.setItem('blog_bg_color', color);
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
        safeStorage.setItem('blog_bg_type', 'image');
        safeStorage.setItem('blog_bg_image', result);
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
  }, []);

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
      const query = searchQuery.toLowerCase();
      let matchSearch = true;
      if (query) {
        if (searchType === 'title') {
          matchSearch = post.title.toLowerCase().includes(query);
        } else if (searchType === 'content') {
          matchSearch = post.content.toLowerCase().includes(query);
        } else {
          matchSearch = post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query);
        }
      }
      const matchCategory = selectedCategory === '全部' || (post.category || '未分类') === selectedCategory;
      const matchTag = !selectedTag || post.tags?.includes(selectedTag);
      const matchYear = !selectedYear || (post.created_at && formatDate(post.created_at) === selectedYear);
      let matchDateRange = true;
      if (dateRange.start || dateRange.end) {
        const postDate = post.created_at ? new Date(post.created_at).toISOString().slice(0, 10) : '';
        if (dateRange.start && postDate < dateRange.start) matchDateRange = false;
        if (dateRange.end && postDate > dateRange.end) matchDateRange = false;
      }
      return matchSearch && matchCategory && matchTag && matchYear && matchDateRange;
    });
  }, [posts, searchQuery, searchType, selectedCategory, selectedTag, selectedYear, dateRange]);

  // 当筛选条件变化时重置到第1页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchType, selectedCategory, selectedTag, selectedYear, dateRange]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * postsPerPage;
    return filteredPosts.slice(start, start + postsPerPage);
  }, [filteredPosts, currentPage]);

  // 翻页时显示页码提示
  useEffect(() => {
    if (totalPages > 1) {
      setPageTip(`第 ${currentPage} / ${totalPages} 页`);
      const timer = setTimeout(() => setPageTip(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentPage, totalPages]);

  // 登录成功后自动跳转
  useEffect(() => {
    if (isLoggedIn && pendingRedirect) {
      navigate(pendingRedirect);
      setPendingRedirect(null);
    }
  }, [isLoggedIn, pendingRedirect, navigate]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const sanitizeFileName = (name: string): string => {
    return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'untitled';
  };

  const handleExportAll = async () => {
    try {
      const allPosts = await api.getPosts();
      if (!allPosts.length) {
        alert('当前没有文章可导出');
        return;
      }
      const zip = new JSZip();
      allPosts.forEach((post) => {
        const fileName = `${sanitizeFileName(post.title)}.md`;
        const content = `# ${post.title}\n\n> 分类：${post.category || '未分类'}\n> 发布时间：${formatDate(post.created_at)}\n\n${post.content}`;
        zip.file(fileName, content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `青飞博客文章_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('导出失败，请稍后重试');
    }
  };

  return (
    <div className="container max-w-screen-2xl pb-4">
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
          <Link to="/" className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 shadow-sm">
            <HomeIcon size={16} />
            首页
          </Link>
          <button
            onClick={() => {
              if (isLoggedIn) {
                navigate('/admin/edit');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 shadow-sm"
          >
            <PenLine size={16} />
            写文章
          </button>
          <button
            onClick={() => {
              if (isLoggedIn) {
                navigate('/admin/dashboard');
              } else {
                setPendingRedirect('/admin/dashboard');
                setIsLoginModalOpen(true);
              }
            }}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 shadow-sm"
          >
            <Folder size={16} />
            文章管理
          </button>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 shadow-sm"
            title="导出所有文章为 Markdown"
          >
            <Download size={16} />
            导出
          </button>
          <div className="w-px h-5 bg-slate-300 mx-1"></div>
          <div className="relative">
            <button
              onClick={() => setShowBgPanel(!showBgPanel)}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 shadow-sm"
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
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 shadow-sm"
          >
            {isEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            音效
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>
          <button
            onClick={() => {
              if (isLoggedIn) {
                safeStorage.removeItem('admin_token');
                setIsLoggedIn(false);
                alert('已退出登录');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 shadow-sm"
          >
            {isLoggedIn ? (
              <>
                <Check size={16} className="text-green-500" />
                已登录
              </>
            ) : (
              '登录'
            )}
          </button>
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
        <div className="relative max-w-lg mx-auto flex items-center border-2 border-slate-200 rounded-xl focus-within:border-sky-400 transition-colors bg-white overflow-hidden">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'global' | 'title' | 'content')}
            className="h-full pl-3 pr-2 py-2.5 bg-slate-50 text-sm text-slate-600 border-r border-slate-200 focus:outline-none cursor-pointer appearance-none"
          >
            <option value="global">全局</option>
            <option value="title">标题</option>
            <option value="content">内容</option>
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文章..."
              className="w-full pl-10 pr-4 py-2.5 focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* 三栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧边栏 - 文章分类 */}
        <aside className="lg:col-span-2">
          <div className="bg-white/90 rounded-xl shadow-sm border border-sky-100 p-4 overflow-y-auto max-h-[850px]">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <Folder size={16} className="text-sky-500" />
              文章分类
            </h3>
            {isLoggedIn && (
              <button
                onClick={() => setShowCategoryModal(true)}
                className="absolute top-4 right-4 text-slate-400 hover:text-sky-500 transition-colors"
                title="管理分类"
              >
                <Settings size={16} />
              </button>
            )}
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
        <main
          className="lg:col-span-8"
          onWheel={(e) => {
            if (totalPages <= 1) return;
            const now = Date.now();
            if (now - lastWheelTime.current < 800) return;
            if (e.deltaY > 0 && currentPage < totalPages) {
              lastWheelTime.current = now;
              setCurrentPage(p => Math.min(totalPages, p + 1));
              e.preventDefault();
            } else if (e.deltaY < 0 && currentPage > 1) {
              lastWheelTime.current = now;
              setCurrentPage(p => Math.max(1, p - 1));
              e.preventDefault();
            }
          }}
        >
          {loading ? (
            <div className="text-center py-20 text-slate-400">加载中...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl text-slate-300 mb-3">✍️</div>
              <p className="text-slate-500">暂无匹配文章</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedPosts.map((post, index) => (
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
                  </Link>
                  <div className="flex items-center justify-between">
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
                    <button
                      onClick={async () => {
                        const shareText = `【${post.title}】 ${window.location.origin}/#/post/${post.id}`;
                        try {
                          await navigator.clipboard.writeText(shareText);
                          setCopiedId(post.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        } catch {
                          alert('复制失败，请手动复制');
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-500 transition-colors"
                      title="复制标题和链接"
                    >
                      {copiedId === post.id ? (
                        <>
                          <Check size={12} className="text-green-500" />
                          <span className="text-green-500">已复制</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={12} />
                          <span>分享</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.article>
              ))}

              {/* 分页器 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 bg-white text-slate-600 hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-sky-500 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-sky-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 bg-white text-slate-600 hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                  <span className="text-xs text-slate-400 ml-2">
                    共 {filteredPosts.length} 条
                  </span>
                </div>
              )}
            </div>
          )}
        </main>

        {/* 右侧边栏 - 时间归档 */}
        <aside className="lg:col-span-2">
          <div className="bg-white/90 rounded-xl shadow-sm border border-sky-100 p-4 overflow-y-auto max-h-[850px]">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <Archive size={16} className="text-sky-500" />
              时间归档
            </h3>

            {/* 日期范围选择 */}
            <div className="mb-3 space-y-2">
              <div className="flex gap-1">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setSelectedYear(''); }}
                  className="flex-1 min-w-0 text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-400 bg-white"
                  title="开始日期"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setSelectedYear(''); }}
                  className="flex-1 min-w-0 text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-400 bg-white"
                  title="结束日期"
                />
              </div>
              {(dateRange.start || dateRange.end) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-600">
                    {dateRange.start || '...'} ~ {dateRange.end || '...'}
                  </span>
                  <button
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    清除
                  </button>
                </div>
              )}
            </div>

            <ul className="space-y-1">
              {archives.map(([date, count]) => (
                <li key={date}>
                  <button
                    onClick={() => { setSelectedYear(selectedYear === date ? '' : date); setSelectedTag(''); setDateRange({ start: '', end: '' }); }}
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


        </aside>
      </div>

      {/* 翻页提示 */}
      {pageTip && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-800/80 text-white px-6 py-3 rounded-xl text-lg font-medium backdrop-blur-sm pointer-events-none">
          {pageTip}
        </div>
      )}

      {/* 登录弹窗 */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setIsLoggedIn(true)}
        redirectToEdit={false}
      />

      {/* 分类管理弹窗 */}
      <CategoryManageModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories.filter(c => c !== '全部')}
        onSave={async (newCats, deleted, added) => {
          try {
            const token = safeStorage.getItem('admin_token');
            if (deleted.length > 0) {
              await fetch('/api/categories/batch-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ categories: deleted }),
              });
            }
            if (added.length > 0) {
              await fetch('/api/categories/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ categories: added }),
              });
            }
            await fetch('/api/categories/reorder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ order: newCats }),
            });
            const postsData = await api.getPosts();
            setPosts(postsData);
          } catch (err) {
            console.error('分类管理失败:', err);
          }
        }}
      />
    </div>
  );
};

export default Home;
