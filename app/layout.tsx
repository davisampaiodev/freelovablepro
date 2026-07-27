import type { Metadata } from "next";
import "./globals.css";
import MetaPixel from "./MetaPixel";

export const metadata: Metadata = {
  title: "FreeLovable — Seu Lovable sem consumir créditos",
  description: "Continue criando projetos no Lovable com créditos infinitos e sem interrupções.",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.png", apple: "/apple-touch-icon.png" },
  openGraph: {
    title: "FreeLovable — Créditos infinitos no Lovable",
    description: "Nunca mais fique sem créditos no Lovable.",
    images: [{ url: "/open-graph.png", alt: "FreeLovable — créditos ilimitados" }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/open-graph.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          async
          defer
          data-utmify-prevent-xcod-sck=""
          data-utmify-prevent-subids=""
        />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window,document,"clarity","script","x94a65kanv");
            `,
          }}
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-WQ32ST5NXQ" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag("js",new Date());
              gtag("config","G-WQ32ST5NXQ");
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
              (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','1154397371091882');
              fbq('track','PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1154397371091882&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body><MetaPixel />{children}</body>
    </html>
  );
}
