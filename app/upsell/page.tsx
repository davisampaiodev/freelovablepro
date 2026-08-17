import type { Metadata } from "next";
import UpsellExperience from "./UpsellExperience";
import "./upsell.css";

export const metadata: Metadata = {
  title: "Oferta exclusiva | Google AI Pro por 18 meses",
  description: "Oferta pós-compra exclusiva para clientes FreeLovable.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Google AI Pro por 18 meses | FreeLovable",
    description: "Oferta exclusiva pós-compra: 18 meses por R$ 97, pagamento único.",
    images: [{ url: "/upsell-social.png", alt: "Google AI Pro por 18 meses, R$ 97 em pagamento único" }],
  },
  twitter: { card: "summary_large_image", images: ["/upsell-social.png"] },
};

export default function UpsellPage() {
  return <UpsellExperience />;
}
