"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // 优化段落间距
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          // 优化公式显示
          span: ({ node, ...props }) => {
            if (props.className?.includes('math-inline')) {
              return <span {...props} className="px-1" />;
            }
            return <span {...props} />;
          },
          div: ({ node, ...props }) => {
            if (props.className?.includes('math-display')) {
              return <div {...props} className="py-4 overflow-x-auto" />;
            }
            return <div {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
