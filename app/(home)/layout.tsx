import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Southwest Chief Railcam Tracker | Live Train Tracking',
  description: "Track Amtrak's Southwest Chief train in real-time with live railcam feeds, delay information, and station updates between Chicago and Los Angeles.",
  openGraph: {
    title: 'Southwest Chief Railcam Tracker | Live Train Tracking',
    description: "Track Amtrak's Southwest Chief train in real-time with live railcam feeds",
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
    title: 'Southwest Chief Railcam Tracker | Live Train Tracking',
    description: "Track Amtrak's Southwest Chief train in real-time with live railcam feeds",
    images: ['/train-icon.png'],
    creator: '@southwestchieftracker',
  },
  alternates: {
    canonical: '/',
  },
};

export default function HomeLayout({
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
