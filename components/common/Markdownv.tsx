
"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"

export function MarkdownView({ content }: { content?: string | null }) {
  const text = (content ?? "").trim()

  if (!text) return null

  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, defaultSchema]]}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
