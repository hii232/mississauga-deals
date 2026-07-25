// Server component on public blog pages: keeps react-markdown out of the
// client bundle. (Still bundles client-side when imported from admin pages.)
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content }) {
    if (!content) return null;

  return (
        <ReactMarkdown
        // GFM: without it, a Markdown table renders as raw "| Area | Price |"
        // pipe text. Posts comparing neighbourhoods by the numbers reach for a
        // table constantly, so this was the single biggest legibility bug on
        // the blog. Also enables strikethrough and autolinks.
        remarkPlugins={[remarkGfm]}
        components={{
                  h1: ({children}) => <h2 className="font-heading text-2xl font-bold text-navy mb-4 mt-8 first:mt-0">{children}</h2>,
                  h2: ({children}) => <h2 className="font-heading text-xl font-bold text-navy mb-3 mt-6">{children}</h2>,
          h3: ({children}) => <h3 className="font-heading text-lg font-semibold text-navy mb-2 mt-5">{children}</h3>,
          p: ({children}) => <p className="text-muted leading-relaxed mb-4 text-[15px] md:text-base">{children}</p>,
          a: ({href, children}) =>
            href?.startsWith('/')
              ? <a href={href} className="text-accent hover:underline">{children}</a>
              : <a href={href} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
          ul: ({children}) => <ul className="list-disc pl-6 mb-4 text-muted space-y-1.5">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-6 mb-4 text-muted space-y-1.5">{children}</ol>,
          li: ({children}) => <li className="leading-relaxed text-[15px] md:text-base">{children}</li>,
          blockquote: ({children}) => <blockquote className="border-l-4 border-accent/30 pl-4 italic text-muted my-4">{children}</blockquote>,
          // Data tables: the wrapper scrolls on its own at 375px so a wide
          // comparison table never forces the whole article to scroll sideways.
          table: ({children}) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({children}) => <thead className="bg-cloud">{children}</thead>,
          tbody: ({children}) => <tbody>{children}</tbody>,
          tr: ({children}) => <tr className="border-b border-slate-100 last:border-0">{children}</tr>,
          th: ({children}) => (
            <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {children}
            </th>
          ),
          td: ({children}) => <td className="px-4 py-2.5 align-top text-[15px] text-muted">{children}</td>,
          del: ({children}) => <del className="text-slate-500 line-through">{children}</del>,
          img: ({src, alt}) => <img src={src} alt={alt || ''} loading="lazy" decoding="async" className="rounded-xl my-6 w-full" />,
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
