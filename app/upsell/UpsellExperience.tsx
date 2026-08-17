"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resolveMetaTracking } from "../metaTracking";

type UpsellOffer = {
  hash: string;
  name: string;
  eyebrow: string;
  duration: string;
  price: number;
  benefits: Array<{ title: string; copy: string; icon: string; material?: boolean; featured?: boolean }>;
};

const OFFERS: Record<string, UpsellOffer> = {
  "1geminipro": {
    hash: "1geminipro",
    name: "Google AI Pro",
    eyebrow: "Você desbloqueou uma condição exclusiva para novos clientes.",
    duration: "18 meses",
    price: 97,
    benefits: [
      { title: "Gemini Pro", copy: "Planeje projetos, analise arquivos, revise códigos e desenvolva ideias.", icon: "/upsell-icons/gemini.svg" },
      { title: "Nano Banana Pro", copy: "Crie imagens, edite artes e produza variações visuais.", icon: "/upsell-icons/nano-banana.png" },
      { title: "Google AI Studio", copy: "Teste prompts e modelos, crie protótipos e integre o Gemini aos seus projetos.", icon: "/upsell-icons/studio.svg", material: true, featured: true },
      { title: "Deep Research", copy: "Pesquise várias fontes, compare dados e receba sínteses organizadas.", icon: "/upsell-icons/research.svg", material: true },
      { title: "Ecossistema Google", copy: "Conecte IA, pesquisa, arquivos e ferramentas Google no mesmo fluxo.", icon: "/upsell-icons/google.svg" },
      { title: "5 TB de armazenamento", copy: "Guarde projetos, imagens, vídeos e documentos no Google Drive.", icon: "/upsell-icons/drive.svg" },
    ],
  },
};

const ACCEPT_URL = "https://freelovablepro.mycartpanda.com/ex-ocu/next-offer/69YNmDvVX7?accepted=yes";
const DECLINE_URL = "https://freelovablepro.mycartpanda.com/ex-ocu/next-offer/69YNmDvVX7?accepted=no";

function ProductArtwork() {
  return (
    <div className="up-product-art" role="img" aria-label="Google AI Pro — Gemini Pro por 18 meses">
      <div className="up-google-ai-lockup" aria-hidden="true">
        <span className="up-google-word"><i>G</i><i>o</i><i>o</i><i>g</i><i>l</i><i>e</i></span>
        <b>AI Pro</b>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="up-gemini-transparent-star"
        src="/gemini-star-transparent.png"
        alt=""
      />
      <strong className="up-gemini-title">GEMINI PRO</strong>
      <div className="up-gemini-months"><b>18</b><span>MESES</span></div>
    </div>
  );
}

function NativeCartPandaControls({ offer }: { offer: UpsellOffer }) {
  const configured = Boolean(ACCEPT_URL && DECLINE_URL);

  return (
    <div className="up-controls" id="cartpanda-native-controls" data-cartpanda-status={configured ? "configured" : "awaiting-config"}>
      {configured ? (
        <>
          <a className="up-accept" href={ACCEPT_URL} rel="nofollow">
            <span>Sim! Quero adicionar o Google AI Pro</span>
            <small>Adicionar {offer.duration} ao meu pedido por R$ 97</small>
          </a>
          <div className="up-trust" aria-label="Informações da oferta">
            <span>✓ Compra segura</span><span>✓ Pagamento único</span><span>✓ Sem novo formulário</span>
          </div>
          <a className="up-decline" href={DECLINE_URL} rel="nofollow">Não, obrigado. Quero continuar apenas com meu FreeLovable.</a>
        </>
      ) : (
        <>
          <button className="up-accept up-accept-preview" type="button" disabled aria-describedby="cartpanda-config-note">
            <span>Sim! Quero adicionar o Google AI Pro</span>
            <small>Adicionar {offer.duration} ao meu pedido por R$ 97</small>
          </button>
          <div className="up-trust" aria-label="Informações da oferta">
            <span>✓ Pagamento único</span><span>✓ 18 meses de acesso</span><span>✓ Sem novo formulário</span>
          </div>
          <p className="up-config-note" id="cartpanda-config-note">Preview seguro: os links nativos de aceite e recusa da CartPanda ainda precisam ser conectados.</p>
          <span className="up-decline up-decline-preview">Não, obrigado. Quero continuar apenas com meu FreeLovable.</span>
        </>
      )}
    </div>
  );
}

export default function UpsellExperience() {
  const [offerHash, setOfferHash] = useState("1geminipro");
  const [showSticky, setShowSticky] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);
  const offer = useMemo(() => OFFERS[offerHash] || OFFERS["1geminipro"], [offerHash]);
  const monthlyPrice = (offer.price / 18).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    const scriptId = "cartpanda-ocu-external";
    const isLocalPreview = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalPreview) return;

    const initialize = () => {
      const cartPandaWindow = window as typeof window & { OcuExternal?: new () => unknown };
      if (cartPandaWindow.OcuExternal) new cartPandaWindow.OcuExternal();
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      initialize();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://assets.mycartpanda.com/cartx-ecomm-ui-assets/js/libs/ocu-external.js";
    script.onload = initialize;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const syncHash = () => setOfferHash(window.location.hash.slice(1).toLowerCase() || "1geminipro");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    resolveMetaTracking();
    const fbq = (window as typeof window & { fbq?: (...args: unknown[]) => void }).fbq;
    fbq?.("track", "ViewContent", {
      content_name: "Upsell Google AI Pro - 18 meses",
      content_category: "Upsell pós-compra",
      content_ids: [offer.hash],
      content_type: "product",
      currency: "BRL",
      value: offer.price,
    });
    return () => window.removeEventListener("hashchange", syncHash);
  }, [offer.hash, offer.price]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), { threshold: 0.15 });
    observer.observe(controls);
    return () => observer.disconnect();
  }, []);

  const scrollToControls = () => controlsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <main className="upsell-page">
      <div className="up-background" aria-hidden="true"><i /><i /><i /></div>
      <section className="up-hero">
        <div className="up-shell">
          <div className="up-confirmation"><span>✓</span><b>Seu acesso ao FreeLovable está garantido</b></div>

          <div className="up-hero-grid">
            <div className="up-hero-copy">
              <div className="up-eyebrow"><i /> {offer.eyebrow}</div>
              <h1>Você já eliminou o limite do Lovable.<br /><em>Agora, turbine todo seu arsenal de IA.</em></h1>
              <p className="up-lead">Adicione <b>{offer.duration} de {offer.name}</b> ao seu pedido e leve seu fluxo de criação para outro nível.</p>
            </div>

            <div className="up-product-offer-card">
              <ProductArtwork />
              <div className="up-card-benefits" aria-label="Benefícios do Google AI Pro">
                {offer.benefits.map((benefit) => (
                  <div key={benefit.title} className={benefit.featured ? "featured" : ""}>
                    <i aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={`${benefit.material ? "material-icon" : "brand-icon"}${benefit.title === "Nano Banana Pro" ? " nano-banana-icon" : ""}`}
                        src={benefit.icon}
                        alt=""
                      />
                    </i>
                    <span>
                      <b>{benefit.title}</b>
                      <small>{benefit.copy}</small>
                    </span>
                    {benefit.featured && <em>PARA QUEM CRIA COM IA</em>}
                  </div>
                ))}
              </div>
              <div className="up-offer-box">
                <span className="up-offer-label">PAGAMENTO ÚNICO</span>
                <div className="up-price"><small>R$</small><strong>{offer.price}</strong></div>
                <b className="up-duration">{offer.duration} de acesso</b>
                <p>Equivale a aproximadamente <strong>R$ {monthlyPrice}/mês</strong> durante o período.</p>
                <div ref={controlsRef}><NativeCartPandaControls offer={offer} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`up-sticky ${showSticky ? "visible" : ""}`}>
        <span><b>Google AI Pro</b><small>18 meses · R$ 97</small></span>
        <button type="button" onClick={scrollToControls}>VER OFERTA</button>
      </div>
    </main>
  );
}
