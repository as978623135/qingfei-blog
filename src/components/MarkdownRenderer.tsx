import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const CodeBlock: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const lang = className ? className.replace('language-', '') : 'text';
  const codeText = typeof children === 'string' ? children : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败静默处理
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono uppercase">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          aria-label={copied ? '已复制' : '复制代码'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="text-slate-100 p-4 overflow-x-auto">
        <code className="text-sm font-mono">{children}</code>
      </pre>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-body prose prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => <h1 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">{children}</h3>,
          h4: ({ children }) => <h4 className="text-lg font-semibold text-slate-800 mt-5 mb-2">{children}</h4>,
          p: ({ children }) => <p className="text-slate-700 leading-relaxed mb-4">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-sky-500 pl-4 py-2 my-4 bg-sky-50 rounded-r-lg">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-slate-100 text-sky-600 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ) : (
              <CodeBlock className={className}>{children}</CodeBlock>
            );
          },
          ul: ({ children }) => <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-slate-700 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} className="text-sky-500 hover:text-sky-600 underline transition-colors" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="max-w-full rounded-xl shadow-lg my-4" />
          ),
          video: ({ src }) => (
            <video src={src} controls className="w-full rounded-xl my-4 shadow-lg max-h-[600px] bg-slate-900" />
          ),
          audio: ({ src }) => (
            <audio src={src} controls className="w-full my-4" />
          ),
          iframe: ({ src }) => (
            <div className="relative w-full aspect-video my-4 rounded-xl overflow-hidden shadow-lg bg-slate-900">
              <iframe src={src} className="absolute inset-0 w-full h-full" frameBorder="0" allowFullScreen />
            </div>
          ),
          hr: () => <hr className="my-8 border-t-2 border-slate-200" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse border border-slate-300 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-100">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-slate-300 px-4 py-2 text-left font-semibold text-slate-800">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-300 px-4 py-2 text-slate-700">{children}</td>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
