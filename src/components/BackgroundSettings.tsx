import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Image, X, Check } from 'lucide-react';

const COLORS = [
  '#e0f2fe', '#f0f9ff', '#ffffff', '#fef3c7', '#fce7f3',
  '#dbeafe', '#d1fae5', '#ede9fe', '#fee2e2', '#ffedd5'
];

const BackgroundSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bgType, setBgType] = useState<'color' | 'image'>('color');
  const [selectedColor, setSelectedColor] = useState('#e0f2fe');
  const [bgImage, setBgImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedType = localStorage.getItem('blog_bg_type') as 'color' | 'image';
    const savedColor = localStorage.getItem('blog_bg_color');
    const savedImage = localStorage.getItem('blog_bg_image');
    
    if (savedType) setBgType(savedType);
    if (savedColor) setSelectedColor(savedColor);
    if (savedImage) setBgImage(savedImage);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (bgType === 'color') {
      root.style.setProperty('--bg-color', selectedColor);
      root.style.setProperty('--bg-image', 'none');
      document.body.style.background = selectedColor;
    } else if (bgType === 'image' && bgImage) {
      document.body.style.background = `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(${bgImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, [bgType, selectedColor, bgImage]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setBgType('color');
    localStorage.setItem('blog_bg_type', 'color');
    localStorage.setItem('blog_bg_color', color);
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
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-slate-600 hover:text-sky-500 transition-colors"
      >
        <Palette size={16} />
        背景
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white/95 rounded-xl shadow-lg border border-sky-100 p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">背景设置</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setBgType('color')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors ${
                  bgType === 'color' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Palette size={12} />
                纯色
              </button>
              <button
                onClick={() => setBgType('image')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors ${
                  bgType === 'image' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Image size={12} />
                图片
              </button>
            </div>

            {bgType === 'color' ? (
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      selectedColor === color ? 'border-sky-500 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Check size={14} className="text-sky-600 mx-auto" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 text-xs hover:border-sky-400 hover:text-sky-500 transition-colors"
                >
                  点击上传图片
                </button>
                {bgImage && (
                  <div className="relative">
                    <img src={bgImage} alt="背景预览" className="w-full h-20 object-cover rounded-lg" />
                    <button
                      onClick={() => { setBgImage(''); localStorage.removeItem('blog_bg_image'); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BackgroundSettings;
