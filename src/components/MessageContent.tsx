'use client';

import { useMemo } from 'react';

interface MessageContentProps {
  content: string;
  isUser?: boolean;
}

export default function MessageContent({ content, isUser = false }: MessageContentProps) {
  const formattedContent = useMemo(() => {
    // Simple markdown-like formatting
    let formatted = content;
    
    // Bold text: **text** or __text__
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    formatted = formatted.replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>');
    
    // Italic text: *text* or _text_
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Inline code: `code`
    formatted = formatted.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/20 text-[13px] font-mono">$1</code>');
    
    // Links: [text](url)
    formatted = formatted.replace(
      /\[(.+?)\]\((.+?)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-[var(--tr-red)] transition-colors">$1</a>'
    );
    
    // Line breaks for lists
    formatted = formatted.replace(/^[-•]\s/gm, '<span class="text-[var(--tr-red)] mr-2">•</span>');
    formatted = formatted.replace(/^\d+\.\s/gm, (match) => `<span class="text-[var(--tr-red)] mr-2">${match.trim()}</span>`);
    
    return formatted;
  }, [content]);

  return (
    <div 
      className="text-[15px] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
}
