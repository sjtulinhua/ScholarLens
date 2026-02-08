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
    // 1. 将 \[ \] 替换为 $$ $$
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    // 2. 将 \( \) 替换为 $ $
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    // 3. 处理 Qwen 有时会产生的过度转义：比如 \\\\frac -> \frac
    .replace(/\\\\\\\\/g, '\\')
    // 4. “强制拯救”：如果某一行包含明显的 LaTeX 指令（如 \Rightarrow, \frac）且没有任何 $ 符号，尝试给它包上 $
    .split('\n')
    .map(line => {
      const hasLatex = /\\(frac|sqrt|Rightarrow|triangle|angle|cdot|times|left|right|alpha|beta|theta)/.test(line);
      const hasDelimiters = line.includes('$');
      if (hasLatex && !hasDelimiters) {
        return `$${line.trim()}$`;
      }
      return line;
    })
    .join('\n');

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[
          [rehypeKatex, { 
            throwOnError: false, 
            strict: false,
            errorColor: '#374151' // Use a dark gray instead of red for errors
          }]
        ]}
        components={{
          p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
