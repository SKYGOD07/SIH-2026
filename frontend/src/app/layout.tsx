import type { Metadata, Viewport } from 'next';
import { Inter, Poppins, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SmoothScrollProvider } from '@/lib/lenis/SmoothScrollProvider';
import { AudienceProvider } from '@/components/motion/AudienceProvider';
import { IntroProvider } from '@/components/motion/IntroProvider';
import { CustomCursor } from '@/components/navigation/CustomCursor';
import { SiteChrome } from '@/components/navigation/SiteChrome';
import { MaximizeOrigin } from '@/components/console/MaximizeOrigin';
import { MinimizeReveal } from '@/components/console/MinimizeReveal';

/**
 * Type system.
 *
 * Four faces, each with one job:
 *
 *  display   Poppins, at 800/900. A geometric sans set very large and very
 *            heavy with tight negative tracking — the reference sets it at
 *            80-200px with -0.05em. Weight is doing the work here, which is the
 *            opposite of a Swiss grotesk and is the point: it reads as loud
 *            rather than as refined.
 *  accent    Instrument Serif — a display serif used *inside* headlines for
 *            one or two words. That grotesk/serif mix is what makes the
 *            reference headlines read as composed rather than merely large.
 *  body      Inter — for reading.
 *  mono      JetBrains Mono — metadata, labels, numerals.
 *
 * All loaded through next/font, so they are self-hosted, preloaded and subset:
 * no external stylesheet, no render-blocking CDN request, no FOUT mid-animation.
 */
const display = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

const accent = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-accent',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MahaInnovate — Innovation Procurement Intelligence Platform',
    template: '%s · MahaInnovate',
  },
  description:
    'A transparent, competitive and legally compliant innovation-procurement pathway: define the challenge, discover startups, verify eligibility against sources, evaluate, pilot, measure, procure and scale.',
  applicationName: 'MahaInnovate',
  keywords: [
    'innovation procurement',
    'government challenges',
    'startup pilots',
    'milestone contracting',
    'evidence-based procurement',
  ],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#EDE7DD',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${accent.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-void font-sans text-chalk antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-signal focus:px-4 focus:py-2 focus:font-mono focus:text-meta focus:uppercase focus:text-void"
        >
          Skip to content
        </a>

        <SmoothScrollProvider>
          <IntroProvider>
            <AudienceProvider>
              {/*
                The cursor is the one piece of chrome that belongs to both
                products — a console is still the same hand moving.
              */}
              <CustomCursor />
              {/* Records where a console-bound click happened, so the console
                  can maximise out of that point on the other side of the
                  navigation. Renders nothing. */}
              <MaximizeOrigin />
              <SiteChrome>{children}</SiteChrome>
              {/* The cover that contracts on the way back out of the console.
                  Lives here so it survives the route change it animates. */}
              <MinimizeReveal />
            </AudienceProvider>
          </IntroProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
