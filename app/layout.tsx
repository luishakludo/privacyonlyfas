import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { NoContextMenu } from '@/components/no-context-menu'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'A maior plataforma de conteúdos privados do Brasil.',
  icons: {
    icon: [
      {
        url: '/icon.png',
        type: 'image/png',
      },
    ],
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/*
          Redirecionamento por localização (executa antes da página pintar).
          Só atua na home "/". Se o fuso horário do visitante NÃO for do Brasil,
          ele é enviado instantaneamente para a página internacional "/en".
          Usamos o fuso horário porque é o melhor indicador de localização
          disponível no navegador (funciona em qualquer host, inclusive Netlify).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                if (location.pathname !== "/") return;
                var tz = "";
                try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
                var brTz = /^America\\/(Sao_Paulo|Bahia|Fortaleza|Recife|Maceio|Araguaina|Belem|Santarem|Manaus|Boa_Vista|Porto_Velho|Rio_Branco|Eirunepe|Cuiaba|Campo_Grande|Noronha)$/;
                var langs = (navigator.languages || [navigator.language || ""]).join(",").toLowerCase();
                var isBrazil;
                if (tz) {
                  isBrazil = brTz.test(tz);
                } else {
                  // Sem fuso: recorre ao idioma pt-BR como indício de Brasil.
                  isBrazil = /pt-br/.test(langs);
                }
                if (!isBrazil) {
                  location.replace("/en");
                }
              } catch (e) {}
            })();`,
          }}
        />
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "y2aw8vz4cu");`}
        </Script>
      </head>
      <body className="font-sans antialiased">
        <NoContextMenu />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
