import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Southwest Chief Railcam Tracker',
  description: "Real-time tracking of Amtrak's Southwest Chief train with live railcam feeds, delay information, and station updates between Chicago and Los Angeles.",
  keywords: 'Amtrak, Southwest Chief, train tracker, railcam, live train tracking, Chicago to Los Angeles, train status, train delay',
  authors: [{ name: 'Southwest Chief Railcam Tracker' }],
  creator: 'Southwest Chief Railcam Tracker',
  publisher: 'Southwest Chief Railcam Tracker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://southwestchieftracker.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Southwest Chief Railcam Tracker',
    description: "Watch Amtrak's Southwest Chief in real-time with live railcam feeds",
    url: 'https://southwestchieftracker.com',
    siteName: 'Southwest Chief Railcam Tracker',
    images: [
      {
        url: '/train-icon.png',
        width: 512,
        height: 512,
        alt: 'Southwest Chief train icon',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Southwest Chief Railcam Tracker',
    description: "Real-time tracking of Amtrak's Southwest Chief train",
    images: ['/train-icon.png'],
    creator: '@southwestchieftracker',
  },
  icons: {
    icon: [
      { url: '/train-icon.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    shortcut: ['/train-icon.png'],
    apple: [{ url: '/train-icon.png', sizes: '180x180' }],
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Southwest Chief Railcam Tracker",
              "description": "Real-time tracking of Amtrak's Southwest Chief train with live railcam feeds",
              "applicationCategory": "Transportation",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Southwest Chief Railcam Tracker"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
