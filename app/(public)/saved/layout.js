export const metadata = {
  title: 'Saved Listings',
  // No canonical here on purpose: Google advises against mixing noindex with
  // rel=canonical — see app/(public)/profile/layout.js.
  robots: { index: false, follow: false },
};

export default function SavedLayout({ children }) {
  return children;
}
