import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IMAGE FORGE MOBILE',
  description: 'Mobile-first image generation front-end',
  manifest: '/manifest.webmanifest',
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
