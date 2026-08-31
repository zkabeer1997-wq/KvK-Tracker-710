// The login page itself is a client component, so its metadata lives here.
export const metadata = {
  title: 'Admin Sign In',
  description: 'Kingdom 710 leadership access.',
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }) {
  return children;
}
