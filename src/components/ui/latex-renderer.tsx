"use client"

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface LatexRendererProps {
  content: string
  className?: string
}

export function LatexRenderer({ content, className }: LatexRendererProps) {
  // Ensure content is a string and not null/undefined to prevent crashes on .replace()
  const safeContent = typeof content === 'string' ? content : JSON.stringify(content || '');

  const processedContent = safeContent
    // 将 \[ \] 替换为 $$ $$
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    // 将 \( \) 替换为 $ $
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
