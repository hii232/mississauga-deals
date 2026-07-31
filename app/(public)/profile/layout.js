export const metadata = {
  title: 'My Profile',
  // No canonical here on purpose: Google advises against mixing noindex with
  // rel=canonical — the canonical nominates the URL for indexing while the
  // robots directive forbids it, and Google may pick whichever signal it likes.
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }) {
  return children;
}
