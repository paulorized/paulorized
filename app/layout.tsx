import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cannabis Scan MVP',
  description: 'Upload cannabis product labels, extract structured data, and save results.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
