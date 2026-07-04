export const metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cloud px-4 py-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
