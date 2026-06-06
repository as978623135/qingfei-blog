import React, { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Bold, Italic, List, ListOrdered, Quote, Code, Link, Image, Table, Minus, Heading,
  Upload, Video, AudioLines, Globe, ImagePlus
} from 'lucide-react';
import { api } from '../services/api';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, placeholder }) => {
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = useCallback((before: string, after: string = '') => {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  }, [textareaRef, value, onChange]);

  // 检测文本是否为表格格式（制表符分隔或多空格对齐）
  const detectAndConvertTable = (text: string): string | null => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;

    const hasTabs = lines.some(line => line.includes('\t'));
    if (hasTabs) {
      const rows = lines.map(line => line.split('\t').map(cell => cell.trim()));
      const maxCols = Math.max(...rows.map(r => r.length));
      const normalized = rows.map(r => {
        while (r.length < maxCols) r.push('');
        return r;
      });
      const mdRows = normalized.map(cells => '| ' + cells.join(' | ') + ' |');
      const separator = '| ' + Array(maxCols).fill('------').join(' | ') + ' |';
      mdRows.splice(1, 0, separator);
      return mdRows.join('\n');
    }

    if (lines[0].includes('|')) {
      return null;
    }

    const multiSpacePattern = /^\s*(\S+.*?\s{2,}\S+.*)$/;
    if (lines.some(line => multiSpacePattern.test(line))) {
      const rows = lines.map(line => line.trim().split(/\s{2,}/).map(cell => cell.trim()));
      const maxCols = Math.max(...rows.map(r => r.length));
      if (maxCols >= 2) {
        const normalized = rows.map(r => {
          while (r.length < maxCols) r.push('');
          return r;
        });
        const mdRows = normalized.map(cells => '| ' + cells.join(' | ') + ' |');
        const separator = '| ' + Array(maxCols).fill('------').join(' | ') + ' |';
        mdRows.splice(1, 0, separator);
        return mdRows.join('\n');
      }
    }

    return null;
  };

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const tableMarkdown = detectAndConvertTable(pastedText);

    if (tableMarkdown && textareaRef) {
      e.preventDefault();
      const start = textareaRef.selectionStart;
      const end = textareaRef.selectionEnd;
      const newText = value.substring(0, start) + tableMarkdown + value.substring(end);
      onChange(newText);
      setTimeout(() => {
        textareaRef.focus();
        const newCursor = start + tableMarkdown.length;
        textareaRef.setSelectionRange(newCursor, newCursor);
      }, 0);
    }
  }, [textareaRef, value, onChange]);

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.uploadImage(file);
      insertText(`![${file.name}](${data.url})`, '');
    } catch (err: any) {
      alert('上传失败：' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toolbarItems = [
    { icon: Heading, title: '标题', action: () => insertText('## ', '') },
    { icon: Bold, title: '加粗', action: () => insertText('**', '**') },
    { icon: Italic, title: '斜体', action: () => insertText('*', '*') },
    { icon: List, title: '无序列表', action: () => insertText('- ', '') },
    { icon: ListOrdered, title: '有序列表', action: () => insertText('1. ', '') },
    { icon: Quote, title: '引用', action: () => insertText('> ', '') },
    { icon: Code, title: '代码块', action: () => insertText('```\n', '\n```') },
    { icon: Link, title: '链接', action: () => insertText('[', '](url)') },
    { icon: Image, title: '图片外链', action: () => insertText('![', '](url)') },
    { icon: Table, title: '表格', action: () => insertText('| 表头1 | 表头2 |\n|------|------|\n| 内容1 | 内容2 |', '') },
    { icon: Minus, title: '分割线', action: () => insertText('\n---\n', '') },
  ];

  const mediaItems = [
    {
      icon: ImagePlus,
      title: '上传图片',
      action: () => fileInputRef.current?.click(),
      disabled: uploading
    },
    {
      icon: Video,
      title: '插入视频',
      action: () => insertText('<video src="视频URL" controls width="100%"></video>', '')
    },
    {
      icon: AudioLines,
      title: '插入音频',
      action: () => insertText('<audio src="音频URL" controls></audio>', '')
    },
    {
      icon: Globe,
      title: '嵌入网页',
      action: () => insertText('<iframe src="网页URL" frameborder="0" allowfullscreen width="100%" height="400"></iframe>', '')
    },
  ];

  return (
    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-sky-50 to-sky-100 border-b border-slate-200 flex-wrap">
        {toolbarItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            title={item.title}
            className="p-2 rounded-lg text-slate-600 hover:bg-sky-200 hover:text-sky-700 transition-colors"
          >
            <item.icon size={16} />
          </button>
        ))}
        <div className="w-px h-5 bg-slate-300 mx-1" />
        {mediaItems.map((item, index) => (
          <button
            key={`media-${index}`}
            onClick={item.action}
            title={item.title}
            disabled={item.disabled}
            className="p-2 rounded-lg text-slate-600 hover:bg-sky-200 hover:text-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <item.icon size={16} />
          </button>
        ))}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-200" style={{ minHeight: '400px' }}>
        <textarea
          ref={setTextareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholder || '在此输入 Markdown 内容...'}
          className="w-full p-4 resize-none outline-none font-mono text-sm leading-relaxed bg-slate-50"
          style={{ minHeight: '400px' }}
        />
        <div className="p-4 overflow-auto prose prose-slate max-w-none" style={{ minHeight: '400px' }}>
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-slate-400 italic">预览区域...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
