import type { Metadata } from 'next';
import './globals.css';
import Nav from '../components/Nav';

export const metadata: Metadata = { title: 'UZEED', description: 'UZEED' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen text-white antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
          <Nav />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
