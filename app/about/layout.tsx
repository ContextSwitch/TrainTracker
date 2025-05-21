import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Southwest Chief Railcam Tracker',
  description: 'Learn about the Southwest Chief Railcam Tracker, how it works, and the features that help train enthusiasts track Amtrak trains in real-time.',
  openGraph: {
    title: 'About Southwest Chief Railcam Tracker',
    description: 'Learn about the Southwest Chief Railcam Tracker and how it helps train enthusiasts track Amtrak trains in real-time.',
    url: 'https://southwestchieftracker.com/about',
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
    title: 'About Southwest Chief Railcam Tracker',
    description: 'Learn about the Southwest Chief Railcam Tracker and how it helps train enthusiasts track Amtrak trains in real-time.',
    images: ['/train-icon.png'],
    creator: '@southwestchieftracker',
  },
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
