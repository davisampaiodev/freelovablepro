import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreeLovable — Seu Lovable sem consumir créditos",
  description: "Continue criando projetos no Lovable com créditos infinitos e sem interrupções.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "FreeLovable — Créditos infinitos no Lovable",
    description: "Nunca mais fique sem créditos no Lovable.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "FreeLovable — créditos ilimitados" }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
