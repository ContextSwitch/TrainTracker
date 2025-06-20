"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export default function AnalyticsScripts() {
  const pathname = usePathname();
  const isAdminPage = pathname ? pathname.startsWith('/admin') : false;

  // Only render scripts if NOT on an admin page AND in production environment
  if (isAdminPage || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-P7C9DTHZ68"
        strategy="afterInteractive"
      />
      <Script id="google-analytics-script" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-P7C9DTHZ68');
        `}
      </Script>
    </>
  );
}
