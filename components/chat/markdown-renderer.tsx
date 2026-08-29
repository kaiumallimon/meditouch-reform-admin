"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  return (
    <div className="text-xs leading-relaxed break-words space-y-1.5 font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-sm font-bold text-stone-900 mt-2 mb-1 border-b border-stone-100 pb-1" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xs font-bold text-stone-900 mt-2 mb-1" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs font-bold text-stone-800 mt-1.5 mb-0.5" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-1 leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-stone-900" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-stone-700" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-4 space-y-0.5 my-1 text-stone-700" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-4 space-y-0.5 my-1 text-stone-700" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-0.5" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-[#5b15fc] pl-2.5 py-0.5 italic text-stone-600 my-1 bg-stone-50 rounded-r-md" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className || !className.includes("language-");
            if (isInline) {
              return (
                <code
                  className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[11px] text-[#5b15fc] font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="rounded-xl bg-stone-900 p-3 overflow-x-auto my-2 text-stone-100 font-mono text-[11px] leading-snug">
                <code className="text-stone-200" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2 rounded-lg border border-stone-200">
              <table className="w-full text-left text-[11px] border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-800 font-semibold" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="p-2 border-r border-stone-200 last:border-r-0" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-2 border-t border-r border-stone-200 last:border-r-0 text-stone-700" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-[#5b15fc] font-semibold underline hover:text-[#4a0fd4]"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-2 border-stone-200" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block h-3.5 w-1.5 ml-0.5 animate-pulse bg-[#5b15fc] align-middle" />
      )}
    </div>
  );
}
