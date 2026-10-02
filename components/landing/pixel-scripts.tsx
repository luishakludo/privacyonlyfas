"use client"

import Script from "next/script"

/**
 * Injeta os pixels de rastreamento configurados pela modelo na página pública.
 * - Meta Pixel (Facebook): recebe o ID do Pixel e dispara PageView.
 * - Utmify: define window.pixelId e carrega o script de UTMs + pixel.
 * Cada bloco só é renderizado quando o respectivo ID estiver preenchido.
 */
export function PixelScripts({
  facebook,
  utmify,
}: {
  facebook?: string | null
  utmify?: string | null
}) {
  const fb = (facebook ?? "").trim()
  const utm = (utmify ?? "").trim()

  return (
    <>
      {fb && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${fb}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${fb}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {utm && (
        <>
          <Script
            src="https://cdn.utmify.com.br/scripts/utms/latest.js"
            data-utmify-prevent-xcod-sck=""
            data-utmify-prevent-subids=""
            strategy="afterInteractive"
            async
            defer
          />
          <Script id="utmify-pixel" strategy="afterInteractive">
            {`window.pixelId = "${utm}";
var a = document.createElement("script");
a.setAttribute("async", "");
a.setAttribute("defer", "");
a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
document.head.appendChild(a);`}
          </Script>
        </>
      )}
    </>
  )
}
