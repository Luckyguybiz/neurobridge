import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProviderWrapper } from "./theme-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const SITE_URL = 'https://neurocomputers.io';
const SITE_TITLE = 'Neurocomputers — Open-Source Brain Organoid Analysis';
const SITE_DESC = 'Open-source electrophysiology analysis platform for brain organoids. 9 peer-reviewed methods: criticality (Clauset 2009), IIT Phi (Tononi 2004), burst detection, connectivity, metastability. Tested on 2.6M spikes. MIT License.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  keywords: [
    'brain organoid', 'electrophysiology', 'MEA analysis', 'neural networks',
    'spike sorting', 'burst detection', 'criticality', 'IIT Phi',
    'predictive coding', 'metastability', 'connectivity', 'open source',
    'FinalSpark', 'Cortical Labs', 'biocomputing', 'neuroscience',
  ],
  authors: [{ name: 'Nikita Britikov' }],
  creator: 'Nikita Britikov',
  publisher: 'Neurocomputers',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Neurocomputers',
    title: SITE_TITLE,
    description: SITE_DESC,
    locale: 'en_US',
    images: [{
      url: `${SITE_URL}/og-image.svg`,
      width: 1200,
      height: 630,
      alt: 'Neurocomputers — Open-source brain organoid analysis platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [`${SITE_URL}/og-image.svg`],
    creator: '@nikitabritikov',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {/* Skip link — visible only when keyboard-focused, lets screen-reader
            and keyboard users jump past the sidebar straight to content. */}
        <a href="#main-content" className="skip-to-main">Skip to main content</a>
        {/* JSON-LD structured data (safe: constant content, no user input) */}
        <Script
          id="ld-json"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Neurocomputers',
            applicationCategory: 'ScientificApplication',
            operatingSystem: 'Web',
            url: SITE_URL,
            description: SITE_DESC,
            author: { '@type': 'Person', name: 'Nikita Britikov' },
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            license: 'https://opensource.org/licenses/MIT',
            softwareVersion: '0.2.0',
            keywords: 'brain organoid, electrophysiology, neural networks, MEA analysis, criticality, IIT Phi',
          })}
        </Script>
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
      </body>
    </html>
  );
}
