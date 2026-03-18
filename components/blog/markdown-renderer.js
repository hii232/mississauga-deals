'use client';

import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      components={{
        h1: ({children}) => <h1 className="font-heading text-2xl font-bold text-navy mb-4 mt-8 first:mt-0">{children}</h1>,
        h2: ({children}) => <h2 className="font-heading text-xl font-bold text-navy mb-3 mt-6">{children}</h2>,
        h3: ({children}) => <h3 className="font-heading text-lg font-semibold text-navy mb-2 mt-5">{children}</h3>,
        p: ({children}) => <p className="text-muted leading-relaxed mb-4">{children}</p>,
        a: ({href, children}) => <a href={href} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
        ul: ({children}) => <ul className="list-disc pl-6 mb-4 text-muted space-y-1.5">{children}</ul>,
        ol: ({children}) => <ol className="list-decimal pl-6 mb-4 text-muted space-y-1.5">{children}</ol>,
        li: ({children}) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({children}) => <blockquote className="border-l-4 border-accent/30 pl-4 italic text-muted my-4">{children}</blockquote>,
        img: ({src, alt}) => <img src={src} alt={alt || ''} className="rounded-xl my-6 w-full" />,
        code: ({children}) => <code className="font-mono bg-cloud rounded px-1.5 py-0.5 text-sm">{children}</code>,
        strong: ({children}) => <strong className="font-bold text-navy">{children}</strong>,
        em: ({children}) => <em className="italic">{children}</em>,
        hr: () => <hr className="border-gray-200 my-8" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
