import type { Metadata, Viewport } from 'next';
import { Archivo, Inter, JetBrains_Mono } from 'next/font/google';
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
 * Type system: a grotesk for display, a neutral sans for reading, a monospace
 * for metadata. All three are variable fonts loaded through next/font, so they
 * are self-hosted, preloaded and subset — no external stylesheet, no FOUT
 * mid-animation, and no render-blocking request to a font CDN.
 */
const display = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
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
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bone font-sans text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-saffron focus:px-4 focus:py-2 focus:font-mono focus:text-meta focus:uppercase focus:text-bone-light"
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
                through them; see `.ground-bone` in globals.css.
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
