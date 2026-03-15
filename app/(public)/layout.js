import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import CookieBanner from '@/components/layout/cookie-banner';
import { FloatingContactButton } from '@/components/ui/contact-cta';

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CookieBanner />
      <FloatingContactButton />
    </>
  );
}
