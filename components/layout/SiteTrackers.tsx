'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { isBoothMapPrivatePath } from '@/lib/booth-map/paths'

/**
 * Meta Pixel, Google Analytics 4 and Microsoft Clarity, plus the resource hints
 * for them. Moved out of app/layout.tsx unchanged so they load only on the public
 * site (app/(site) and the 404 page), never on booth map vendor or admin pages.
 *
 * React 19 hoists the <link> hints into <head>. The Pixel snippet now sits at the
 * start of <body> instead of in <head>; it still runs during the first parse and
 * fires the same single PageView.
 *
 * It is a client component with a path check as a second guard: the root 404 screen
 * uses SiteShell, and a 404 under a vendor URL must still load no trackers.
 */
export default function SiteTrackers() {
  const pathname = usePathname() ?? ''
  if (isBoothMapPrivatePath(pathname)) return null
  return (
    <>
      {/* Google Analytics 4 */}
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

      {/* Resource Hints for External Domains */}
      <link rel="preconnect" href="https://connect.facebook.net" />
      <link rel="dns-prefetch" href="https://connect.facebook.net" />
      <link rel="preconnect" href="https://scontent.facebook.com" />
      <link rel="dns-prefetch" href="https://scontent.facebook.com" />
      <link rel="preconnect" href="https://scontent.xx.fbcdn.net" />
      <link rel="dns-prefetch" href="https://scontent.xx.fbcdn.net" />
      <link rel="preconnect" href="https://maps.google.com" />
      <link rel="dns-prefetch" href="https://maps.google.com" />
      <link rel="preconnect" href="https://maps.googleapis.com" />
      <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      <link rel="preconnect" href="https://www.google.com" />
      <link rel="dns-prefetch" href="https://www.google.com" />

      {/* Meta Pixel Code - Inline for immediate execution */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '852163140862887');
              fbq('track', 'PageView');
            `,
        }}
      />

      {/* Google Analytics 4 - gtag.js */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-8LTQL1YW44" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8LTQL1YW44');
          `}
      </Script>

      {/* Microsoft Clarity - Session recording & heatmaps */}
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "uxxqhkqoqk");
          `}
      </Script>

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=852163140862887&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  )
}
