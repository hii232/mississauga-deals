import PreConstructionProjectsClient from './projects-client';
import { FALLBACK_PROJECTS } from '@/lib/precon/fallback-projects';

// This page was a 'use client' shell until 2026-07-31: crawlers saw ZERO of
// the "80+ projects" its meta description promises (only a loading skeleton
// and a "0+ Active Projects" hero chip), because the whole list arrived via a
// client-side /api/precon fetch after hydration. Now the list is fetched
// server-side and passed as initial props — same restructure pattern as the
// listing detail page (app/(public)/listings/[id]/page.js), including the
// VERCEL-gated SITE_URL: deployed builds hit the public domain, local dev and
// local `next start` both hit localhost, and env-less builds fail the fetch
// fast and render the curated fallback (still real, indexable content).
export const revalidate = 300; // matches /api/precon's s-maxage=300

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL ? 'https://www.mississaugainvestor.ca' : 'http://localhost:3000');

async function fetchProjects() {
  try {
    const res = await fetch(`${SITE_URL}/api/precon`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data.projects) && data.projects.length > 0) return data.projects;
    return null;
  } catch (err) {
    // Expected on env-less builds (no server to hit) and transient outages —
    // the client component retries /api/precon from the browser in that case.
    console.error('[precon/projects] SSR fetch failed:', err?.name || err?.message || err);
    return null;
  }
}

export default async function PreConstructionProjectsPage() {
  const projects = await fetchProjects();
  return (
    <PreConstructionProjectsClient
      initialProjects={projects || FALLBACK_PROJECTS}
      fromApi={Boolean(projects)}
    />
  );
}
