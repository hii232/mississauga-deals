import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import CookieBanner from '@/components/layout/cookie-banner';

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
