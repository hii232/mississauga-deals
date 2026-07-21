import { CityscapePanorama } from '@/components/art/cityscape';

/**
 * Shared compact hero for secondary pages — navy dusk band with the
 * Mississauga skyline. Keeps every page on the same visual identity.
 *
 * Props: eyebrow (small label), title, subtitle, children (CTAs/search),
 * align ('left' | 'center'), compact (shorter band for utility pages).
 */
export function PageHero({ eyebrow, title, subtitle, children, align = 'left', compact = false }) {
  const alignCls = align === 'center' ? 'text-center items-center' : 'text-left items-start';
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#16223D] via-navy to-[#25355C]">
      <div className={`relative z-10 max-w-7xl mx-auto px-4 ${compact ? 'pt-10 pb-16 md:pt-14 md:pb-20' : 'pt-14 pb-24 md:pt-20 md:pb-32'}`}>
        <div className={`flex flex-col gap-3 ${alignCls} ${align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>
          {eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading text-3xl font-bold leading-tight text-white md:text-4xl">{title}</h1>
          {subtitle ? <p className="text-sm leading-relaxed text-white/70 md:text-base">{subtitle}</p> : null}
          {children ? <div className="mt-2 w-full">{children}</div> : null}
        </div>
      </div>
      <CityscapePanorama variant="dusk" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-90 md:h-32" />
    </section>
  );
}
