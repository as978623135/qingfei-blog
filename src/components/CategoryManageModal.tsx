import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryItem {
  name: string;
  count: number;
}

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onSave: (deleted: string[], newOrder: string[], added: string[]) => void;
}

export default function CategoryManageModal({ isOpen, onClose, categories, onSave }: CategoryManageModalProps) {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newCategory, setNewCategory] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (isOpen) {
      setItems(categories.map(c => ({ ...c })));
      setSelected(new Set());
      setNewCategory('');
    }
  }, [isOpen, categories]);

  const toggleSelect = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.name)));
  };

  const handleAdd = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (items.some(i => i.name === name)) return;
    setItems([...items, { name, count: 0 }]);
    setNewCategory('');
  };

  const handleDelete = () => {
    if (selected.size === 0) return;
    const deleted = Array.from(selected);
    const remaining = items.filter(i => !selected.has(i.name));
    setItems(remaining);
    setSelected(new Set());
    onSave(deleted, remaining.map(i => i.name), []);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newItems = [...items];
    const dragged = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, dragged);
    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = () => {
    onSave([], items.map(i => i.name), []);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">管理分类</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                />
                全选
              </label>
              <span className="text-xs text-slate-400">拖动调整顺序</span>
            </div>

            <ul ref={listRef} className="space-y-1">
              {items.map((item, index) => (
                <li
                  key={item.name}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-move ${
                    draggedIndex === index ? 'border-sky-400 bg-sky-50 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <GripVertical size={16} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="checkbox"
                    checked={selected.has(item.name)}
                    onChange={() => toggleSelect(item.name)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                  />
                  <span className="flex-1 text-sm text-slate-700">{item.name}</span>
                  <span className="text-xs text-slate-400">{item.count} 篇</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="输入新分类名称"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              />
              <button
                onClick={handleAdd}
                className="px-3 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                新增
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={selected.size === 0}
                className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 size={16} />
                删除选中 ({selected.size})
              </button>
              <button
                onClick={handleSaveOrder}
                className="flex-1 px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                保存排序
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
