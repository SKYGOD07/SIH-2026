import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SetuBharat (SIH26136) — Digital Startup Verification & Government Collaboration Platform',
  description:
    'A unified digital platform connecting startups and government departments across the innovation lifecycle: Discover, Verify, Evaluate, Pilot, Fund, Monitor, Procure, and Scale.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-govblue-100 selection:text-govblue-900">
        {children}
      </body>
    </html>
  );
}
