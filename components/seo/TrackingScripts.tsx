// components/seo/TrackingScripts.tsx
// Inject tracking pixels din setările admin. Scripturile pleacă doar dacă
// ID-urile sunt setate. Server component — randează scripturi în HTML.
import Script from "next/script"
import type { TrackingSettings } from "@/lib/settings/appSettings"

export function TrackingScripts({ settings }: { settings: TrackingSettings }) {
  const { gaId, fbPixelId, googleAdsId, snapchatPixelId, pinterestTagId } = settings

  return (
    <>
      {/* Google Analytics 4 + Google Ads (shared gtag infrastructure) */}
      {(gaId || googleAdsId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId || googleAdsId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${gaId ? `gtag('config', '${gaId}', { anonymize_ip: true });` : ""}
              ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ""}
            `}
          </Script>
        </>
      )}

      {/* Facebook (Meta) Pixel */}
      {fbPixelId && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
              (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Snapchat Pixel */}
      {snapchatPixelId && (
        <Script id="snap-pixel" strategy="afterInteractive">
          {`
            (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){
              a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
              a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
              r.src=n;var u=t.getElementsByTagName(s)[0];
              u.parentNode.insertBefore(r,u);})(window,document,
              'https://sc-static.net/scevent.min.js');
            snaptr('init', '${snapchatPixelId}');
            snaptr('track', 'PAGE_VIEW');
          `}
        </Script>
      )}

      {/* Pinterest Tag */}
      {pinterestTagId && (
        <Script id="pinterest-tag" strategy="afterInteractive">
          {`
            !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(
              Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";
              var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];
              r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
            pintrk('load', '${pinterestTagId}');
            pintrk('page');
          `}
        </Script>
      )}
    </>
  )
}
