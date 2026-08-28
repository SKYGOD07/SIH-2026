import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SmoothScrollProvider } from '@/lib/lenis/SmoothScrollProvider';
import { AudienceProvider } from '@/components/motion/AudienceProvider';
import { IntroProvider } from '@/components/motion/IntroProvider';
import { Preloader } from '@/components/motion/Preloader';
import { AmbientBackdrop } from '@/components/motion/AmbientBackdrop';
import { GlobalScene } from '@/components/three/GlobalScene';
import { Nav } from '@/components/navigation/Nav';
import { CustomCursor } from '@/components/navigation/CustomCursor';
import { SiteFooter } from '@/components/navigation/SiteFooter';

/**
 * Type system.
 *
 * Four faces, each with one job:
 *
 *  display   Inter Tight — a Swiss neo-grotesk with tight apertures, set very
 *            large at regular/medium weight with heavy negative tracking. This
 *            is the closest freely-licensed face to the Lausanne used on the
 *            reference sites, where the expressiveness comes from scale and
 *            tracking rather than from weight.
 *  accent    Instrument Serif — a display serif used *inside* headlines for
 *            one or two words. That grotesk/serif mix is what makes the
 *            reference headlines read as composed rather than merely large.
 *  body      Inter — for reading.
 *  mono      JetBrains Mono — metadata, labels, numerals.
 *
 * All loaded through next/font, so they are self-hosted, preloaded and subset:
 * no external stylesheet, no render-blocking CDN request, no FOUT mid-animation.
 */
const display = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
                Stacking order, bottom to top:
                  AmbientBackdrop (z-0, fixed)  — the drifting colour ground
                  content         (z-10)        — sections, transparent over it
                  Nav             (z-50)
                  Preloader       (z-120)
                Dark sections are intentionally not opaque so the backdrop reads
                through them; see `.ground-void` in globals.css.
              */}
              <AmbientBackdrop />
              {/* One WebGL layer for the whole document — the forms travel through
                  every section rather than appearing per screen. */}
              <GlobalScene />
              <CustomCursor />
              <Nav />
              <div className="relative z-10">
                <main id="main">{children}</main>
                <SiteFooter />
              </div>
              <Preloader />
            </AudienceProvider>
          </IntroProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
