import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RO Clone',
  description: 'A 2.5D web-based multiplayer RPG clone',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
