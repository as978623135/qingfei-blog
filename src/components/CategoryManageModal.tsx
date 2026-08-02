import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GripVertical, Trash2, Check, Plus, AlertTriangle, Edit2 } from 'lucide-react';
import { api } from '../services/api';

interface CategoryManageModalProps {
  categories: { name: string; count: number }[];
  onClose: () => void;
  onSave: (deleted: string[], newOrder: string[], added: string[]) => void;
}

export default function CategoryManageModal({ categories, onClose, onSave }: CategoryManageModalProps) {
  const [items, setItems] = useState<{ name: string; count: number }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newCategory, setNewCategory] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setItems(categories.filter(c => c.name !== '全部'));
  }, [categories]);

  const toggleSelect = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.name)));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleAdd = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (items.some(i => i.name === name)) {
      alert('该分类已存在');
      return;
    }
    setItems([...items, { name, count: 0 }]);
    setNewCategory('');
  };

  const startEdit = (name: string) => {
    setEditingCategory(name);
    setEditValue(name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  const saveEdit = async (oldName: string) => {
    const newName = editValue.trim();
    if (!newName) {
      cancelEdit();
      return;
    }
    if (newName === oldName) {
      cancelEdit();
      return;
    }
    if (items.some(i => i.name === newName)) {
      alert('该分类名称已存在');
      return;
    }
    try {
      await api.renameCategory(oldName, newName);
      setItems(items.map(i => i.name === oldName ? { ...i, name: newName } : i));
      setSelected(new Set([...selected].map(s => s === oldName ? newName : s)));
      setEditingCategory(null);
      setEditValue('');
      onSave([], items.map(i => i.name), []);
    } catch (err) {
      alert(err instanceof Error ? err.message : '重命名失败');
    }
  };

  const handleSave = () => {
    const deleted = categories
      .map(c => c.name)
      .filter(name => !items.some(i => i.name === name) && name !== '全部');
    const added = items.filter(i => i.count === 0 && !categories.some(c => c.name === i.name)).map(i => i.name);
    onSave(deleted, items.map(i => i.name), added);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">管理分类</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="新增分类名称"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                className="px-3 py-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 transition-colors flex items-center gap-1"
              >
                <Plus size={16} /> 新增
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleAll}
                  className="rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                />
                全选
              </label>
              <span className="text-xs text-slate-400">{items.length} 个分类</span>
            </div>

            <ul className="space-y-1">
              {items.map((item, index) => (
                <li
                  key={item.name}
                  draggable
                  onDragStart={e => handleDragStart(e, index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    draggedIndex === index ? 'border-sky-400 bg-sky-50' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <GripVertical size={16} className="text-slate-300 cursor-grab active:cursor-grabbing" />
                  <input
                    type="checkbox"
                    checked={selected.has(item.name)}
                    onChange={() => toggleSelect(item.name)}
                    className="rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                  />
                  {editingCategory === item.name ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(item.name);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={() => saveEdit(item.name)}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm border border-sky-300 rounded focus:outline-none focus:border-sky-500"
                    />
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-700">{item.name}</span>
                      <span className="text-xs text-slate-400">({item.count} 篇)</span>
                      <button
                        onClick={() => startEdit(item.name)}
                        className="text-slate-400 hover:text-sky-500 transition-colors"
                        title="重命名"
                      >
                        <Edit2 size={14} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {selected.size > 0 && (
                <>
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span>删除 {selected.size} 个分类，文章将归类到"未分类"</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-1"
              >
                <Check size={16} /> 保存
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
