import './globals.css';

export const metadata = {
  title: 'TFF Troop Registry',
  description: 'KvK Tracker 710 troop, hero and availability submission form',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
    <body>{children}</body>
    </html>
  );
}
