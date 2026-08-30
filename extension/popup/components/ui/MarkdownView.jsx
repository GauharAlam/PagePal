import React from 'react';

/**
 * Lightweight safe Markdown renderer for chat & summaries.
 * Parses bold, italic, inline code, fenced code blocks, headers, bullet lists, and numbered lists.
 */
export default function MarkdownView({ content, className = '' }) {
  if (!content) return null;

  // Split into blocks by newlines
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="my-2 overflow-x-auto rounded-lg bg-zinc-900 p-2.5 text-[11px] font-mono text-zinc-100 dark:bg-zinc-950">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockContent = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3);
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="mt-2 text-xs font-bold text-foreground">{renderInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="mt-2.5 text-xs font-bold uppercase tracking-wider text-foreground">{renderInline(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="mt-3 text-sm font-extrabold text-foreground">{renderInline(line.slice(2))}</h2>);
      continue;
    }

    // Bullet list
    if (/^[\*\-]\s+/.test(line)) {
      elements.push(
        <div key={i} className="my-0.5 flex items-start gap-1.5 pl-1">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/60" />
          <span className="text-xs leading-relaxed">{renderInline(line.replace(/^[\*\-]\s+/, ''))}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={i} className="my-0.5 flex items-start gap-1.5 pl-1">
          <span className="font-semibold text-[11px] text-muted-foreground">{numMatch[1]}.</span>
          <span className="text-xs leading-relaxed">{renderInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} className="text-xs leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

function renderInline(text) {
  if (!text) return '';

  // Parse `code`, **bold**, *italic*
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/);
    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/);
    // Italic
    const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*(.*)$/);

    // Pick whichever matches earliest
    const candidates = [];
    if (codeMatch) candidates.push({ type: 'code', index: codeMatch[1].length, match: codeMatch });
    if (boldMatch) candidates.push({ type: 'bold', index: boldMatch[1].length, match: boldMatch });
    if (italicMatch) candidates.push({ type: 'italic', index: italicMatch[1].length, match: italicMatch });

    if (!candidates.length) {
      parts.push(remaining);
      break;
    }

    candidates.sort((a, b) => a.index - b.index);
    const earliest = candidates[0];

    if (earliest.type === 'code') {
      if (earliest.match[1]) parts.push(earliest.match[1]);
      parts.push(
        <code key={key++} className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
          {earliest.match[2]}
        </code>
      );
      remaining = earliest.match[3];
    } else if (earliest.type === 'bold') {
      if (earliest.match[1]) parts.push(earliest.match[1]);
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {earliest.match[2]}
        </strong>
      );
      remaining = earliest.match[3];
    } else if (earliest.type === 'italic') {
      if (earliest.match[1]) parts.push(earliest.match[1]);
      parts.push(
        <em key={key++} className="italic">
          {earliest.match[2]}
        </em>
      );
      remaining = earliest.match[3];
    }
  }

  return parts;
}
