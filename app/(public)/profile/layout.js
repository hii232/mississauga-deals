export const metadata = {
  title: 'My Profile',
  robots: { index: false, follow: false },
  alternates: { canonical: '/profile' },
};

export default function ProfileLayout({ children }) {
  return children;
}
