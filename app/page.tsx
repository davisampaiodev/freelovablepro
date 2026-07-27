"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import FeatureExperience from "./FeatureExperience";
import TechIcon from "./TechIcon";

const Gradient = ({ children }: { children: React.ReactNode }) => (
  <span className="gradient-text">{children}</span>
);

const Arrow = () => <div className="section-arrow" aria-hidden="true">↕</div>;

const Button = ({ children, href = "#planos", secondary = false }: { children: React.ReactNode; href?: string; secondary?: boolean }) => (
  <a href={href} className={`cta ${secondary ? "cta-secondary" : ""}`}>{children}<span>→</span></a>
);

const CREATE_PREFERENCE_URL =
  "https://dxqkzcyzlsnzhqlfybwu.supabase.co/functions/v1/mercadopago-create-preference-v2";
const checkoutPlans: Record<string, { id: string; value: number; contentName: string }> = {
  "Plano Mensal": { id: "plan_30d", value: 47, contentName: "FreeLovable 30 dias" },
  "Plano Trimestral": { id: "plan_90d", value: 111, contentName: "FreeLovable 90 dias" },
  "Oferta Especial": { id: "plan_3650d", value: 324, contentName: "FreeLovable Anual" },
};

function trackPlanSelection(planName: string) {
  const plan = checkoutPlans[planName];
  if (!plan) return;
  trackCustomMeta("SelecionouPlano", {
    plan_name: planName,
    plan_id: plan.id,
    content_name: plan.contentName,
    content_ids: [plan.id],
    content_type: "product",
    currency: "BRL",
    value: plan.value,
  });
}

const faqs = [
  ["Funciona em qualquer dispositivo?", "Sim. Você só precisa de um navegador atualizado e conexão com a internet."],
  ["Preciso criar uma nova conta?", "Não. O acesso é simples e as instruções completas chegam logo após a compra."],
  ["Minha conta pode ser banida?", "O FreeLovable funciona de forma independente, sem colocar sua conta principal em risco."],
  ["Como recebo os créditos renovados?", "A renovação acontece conforme o plano escolhido, sem burocracia."],
  ["Se eu tiver dificuldades na instalação, o que faço?", "Você terá um tutorial passo a passo e suporte para começar."],
  ["Essa extensão pode sair do ar?", "O serviço recebe manutenção constante para continuar estável e disponível."],
  ["Quanto tempo tenho para usar?", "Você pode usar durante todo o período contratado, sem limite de projetos."],
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [playing, setPlaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const pricingRef = useRef<HTMLElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = pricingRef.current;
    if (!section) return;
    let fired = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!fired && entry.isIntersecting && entry.intersectionRatio >= 0.18) {
        fired = true;
        trackMeta("ViewContent", {
          content_name: "Planos FreeLovable",
          content_category: "Landing Page",
          content_ids: ["plano_mensal", "plano_trimestral", "oferta_especial"],
          content_type: "product_group",
          currency: "BRL",
          value: 47,
        });
        observer.disconnect();
      }
    }, { threshold: [0.18] });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan || checkoutLoading) return;
    const plan = checkoutPlans[selectedPlan];
    if (!plan) {
      setCheckoutError("Não foi possível identificar o plano selecionado.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const payload = {
      plan: plan.id,
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim().toLowerCase(),
      whatsapp: String(form.get("whatsapp") || "").replace(/\D+/g, ""),
      tracking: getMetaTracking(),
    };
    trackMeta("Lead", {
      content_name: `Lead - ${selectedPlan}`,
      content_category: "Seleção de plano",
      currency: "BRL",
      value: plan.value,
      plan: plan.id,
    });
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const response = await fetch(CREATE_PREFERENCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null) as {
        success?: boolean;
        init_point?: string;
        error?: string;
      } | null;
      if (!response.ok || !data?.success || !data.init_point) {
        throw new Error(data?.error || "Não foi possível iniciar o pagamento.");
      }
      trackMeta("InitiateCheckout", {
        content_ids: [plan.id],
        content_type: "product",
        content_name: plan.contentName,
        currency: "BRL",
        value: plan.value,
        num_items: 1,
      });
      window.location.assign(data.init_point);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.");
      setCheckoutLoading(false);
    }
  }

  async function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
      video.muted = false;
      video.volume = 1;
      try {
        await video.play();
      } catch (error) {
        console.error("Não foi possível reproduzir o vídeo com áudio.", error);
      }
    } else {
      video.pause();
    }
  }

  function updateActivePlan() {
    const track = plansRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    const cards = Array.from(track.children) as HTMLElement[];
    const closest = cards.reduce((best, card, index) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Number.POSITIVE_INFINITY });
    setActivePlan(closest.index);
  }

  function showPlan(index: number) {
    const card = plansRef.current?.children[index] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActivePlan(index);
  }

  return (
    <main>
      <section className="hero">
        <div className="aurora aurora-one" />
        <div className="container hero-content">
          <div className="hero-brand"><img src="/freelovable-logo-transparent.png" alt="FreeLovable" /></div>
          <div className="eyebrow"><span /> NOVA EXTENSÃO · ACESSO ILIMITADO</div>
          <h1>Nunca mais fique sem<br className="title-break"/>{" "}<Gradient>créditos no Lovable.</Gradient></h1>
          <p>Instale em menos de 1 minuto e continue criando apps, automações e<br className="desktop"/> projetos sem interrupções, filas ou bloqueios.</p>
          <div className="hero-benefits"><span>✓ WINDOWS & MAC</span><span>✓ ACESSO IMEDIATO</span><span>✓ INSTALAÇÃO SIMPLES</span></div>
          <Button>VER COMO FUNCIONA</Button>
          <div className="avatars">{[1,2,3,4].map(n=><img key={n} src={`/user-avatars/avatar-${String(n).padStart(2,'0')}.jpg`} alt="" />)}<i/><b>28907 USUÁRIOS ATIVOS</b></div>
          <button
            className={`video-phone ${playing ? "playing" : ""}`}
            onClick={toggleVideo}
            aria-label={playing ? "Pausar vídeo de apresentação" : "Reproduzir vídeo de apresentação"}
            aria-pressed={playing}
          >
            <span className="phone-notch"/>
            <video
              ref={videoRef}
              loop
              playsInline
              preload="auto"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            >
              <source src="/videos/freelovable-4.mp4" type="video/mp4" />
            </video>
            <span className={`play ${playing ? "pause-indicator" : ""}`}>{playing ? "Ⅱ" : "▶"}</span>
          </button>
        </div>
      </section>

      <Arrow />

      <section className="container comparison glow-card">
        <div className="eyebrow blue">✣ O MELHOR DO LOVABLE, SEM A PARTE RUIM</div>
        <h2>
          <span className="comparison-line comparison-line-primary">O Lovable é uma ferramenta incrível para tirar projetos do papel.</span>
          <span className="comparison-line comparison-line-secondary">
            <span>O problema é que </span>
            <strong>os créditos acabam rápido</strong>
            <span> e os planos para continuar criando são caros demais.</span>
          </span>
        </h2>
        <div className="price-panel lovable-price">
          <header><img src="/lovable-logo.jpg" alt="Lovable"/><span><b>Plano Pro do Lovable</b><small>COBRANÇA MENSAL</small></span><em>100 CRÉDITOS</em></header>
          <div><small>PREÇO EM DÓLAR</small><strong>US$ 25<em>/mês</em></strong><span>US$ 0,25 por crédito</span></div>
          <div><small>CONVERTIDO EM REAIS</small><strong className="pink">R$ 127,77<em>/mês</em></strong><span>≈ R$ 1,28 por crédito</span></div>
          <footer>Conversão aproximada pela cotação comercial, sem IOF ou taxas.</footer>
        </div>
        <div className="project-credit-impact">
          <span>CONSUMO MÉDIO POR PROJETO</span>
          <strong>300 a 600 créditos</strong>
          <p>Isso representa aproximadamente <b>R$ 383,31 a R$ 766,62</b> em créditos para concluir um único projeto.</p>
          <small>Estimativa baseada em 3 a 6 pacotes de 100 créditos pelo valor convertido acima.</small>
        </div>
        <div className="tiny-divider">✦</div>
        <h3>Com a <span className="solution-brand"><img src="/freelovable-logo-transparent.png" alt="" /><span className="solution-word"><Gradient>Free</Gradient><b>Lovable</b></span></span>, você continua criando sem se<br className="title-break"/>{" "}preocupar com créditos.</h3>
        <div className="price-panel free-panel">
          <header><span className="free-logo-mark"><img src="/freelovable-logo-transparent.png" alt="FreeLovable"/></span><span><b><Gradient>Free</Gradient>Lovable Mensal</b><small>COBRANÇA MENSAL</small></span><em>CRÉDITOS INFINITOS</em></header>
          <div><small>PREÇO EM REAIS</small><strong className="pink">R$ 47<em>/mês</em></strong><span>Valor fixo em real</span></div>
          <div><small>CRÉDITOS INCLUÍDOS</small><strong>∞</strong><span>Sem custo por crédito</span></div>
          <footer>Continue criando sem contar cada tentativa.</footer>
        </div>
      </section>

      <section className="container about glow-card split">
        <div>
          <div className="eyebrow blue">EXTENSÃO PARA CHROME</div>
          <h2>O que é o <Gradient>FreeLovable?</Gradient></h2>
          <p><b>FreeLovable é uma extensão para Chrome que libera créditos ilimitados no Lovable durante o período do seu plano, para você continuar criando com créditos infinitos sem interromper seus projetos.</b></p>
        </div>
        <div className="steps-window">
          <div className="window-top"><i/><i/><i/><small>NA PRÁTICA</small></div>
          {[['download','Instala a extensão','Adicione o FreeLovable ao Chrome.'],['token','Ativa com seu token','Insira o token exclusivo recebido após a compra.'],['ai','Escreve seus prompts','Envie seus prompts normalmente pelo painel.'],['check','Continua criando com créditos infinitos','Use o Lovable sem se preocupar com créditos acabando.']].map((x,i)=><div className="step-flow" key={i}><div className="step"><TechIcon type={x[0]}/><span><b>{x[1]}</b><small>{x[2]}</small></span></div>{i<3&&<div className="step-connector" aria-hidden="true">↓</div>}</div>)}
        </div>
        <div className="full-cta"><Button>COMO RECEBO MEU ACESSO</Button></div>
      </section>

      <FeatureExperience />

      <Arrow />

      <section className="container access split">
        <div><div className="eyebrow blue">✉ ENTREGA DO ACESSO</div><h2>Como recebo meu<br className="title-break"/>{" "}<Gradient>token de acesso?</Gradient></h2><p className="access-intro"><b>Assim que o pagamento for aprovado, você recebe seu token por e-mail junto com o link da extensão e o tutorial rápido de ativação.</b></p><div className="access-instructions"><div className="mini-steps"><span><b>1</b> ESCOLHA SEU PLANO</span><span><b>2</b> RECEBA O TOKEN POR E-MAIL</span><span><b>3</b> INSTALE E ATIVE</span></div><p>O token é sua chave de ativação. Basta colar na extensão e usar na sua própria conta Lovable.</p></div></div>
        <div className="access-ui">
          <div className="access-delivery">
            <div className="access-card mail-card"><TechIcon type="mail"/><span><small>E-MAIL RECEBIDO</small><b>Seu acesso FreeLovable chegou</b></span><i className="mail-notification">1</i></div>
            <ul><li><i>✓</i> Link para download da extensão</li><li><i>✓</i> Token de ativação</li><li><i>✓</i> Tutorial rápido</li></ul>
          </div>
          <div className="access-card bonus-card">
            <span>
              <small><TechIcon type="ai"/> BÔNUS LIBERADOS COM O ACESSO</small>
              <span className="bonus-grid">
                <b><i>✓</i> Download dos projetos</b>
                <b><i>✓</i> Sem marca d’água</b>
                <b><i>✓</i> Melhorador de prompts</b>
                <b><i>✓</i> Atualizações incluídas</b>
              </span>
            </span>
          </div>
        </div>
      </section>

      <Arrow />

      <section className="container testimonials">
        <div className="eyebrow blue">FEEDBACKS DOS USUÁRIOS</div><h2>Quem testou, <Gradient>continuou usando</Gradient></h2><p>Relatos de usuários que queriam apenas uma forma de continuar criando sem interrupções.</p>
        <div className="review-grid">{[
          ['Lucas M.','“Eu estava literalmente desistindo dos meus projetos porque os créditos acabavam toda hora. Depois que comecei a usar, consigo criar com liberdade.”','Desenvolvedor'],
          ['Ana P.','“O que mais me surpreendeu foi continuar usando meus projetos sem me preocupar. Foi uma das melhores decisões.”','Product Designer'],
          ['Rafael L.','“Eu sempre chegava naquele ponto em que queria testar mais uma coisa e os créditos acabavam. Agora simplesmente continuo.”','Programador'],
          ['Mariana C.','“Consigo validar mais rápido e não preciso mais esperar o dia seguinte. Minha produtividade mudou.”','UX Designer'],
          ['Gabriel C.','“Crio para clientes sem medo de parar no meio do processo. Simples, rápido e funciona.”','Freelancer'],
          ['Juliana A.','“Instalei em poucos minutos. Foi a solução mais prática que encontrei para continuar no Lovable.”','Empreendedora']
        ].map(([n,t,r],i)=><article key={n}><img className="review-portrait" src={`/testimonials/testimonial-${i+1}.jpg`} alt="" aria-hidden="true"/><div className="stars">★★★★★</div><p>{t}</p><footer><img src={`/testimonials/testimonial-${i+1}.jpg`} alt={n}/><b>{n}<small>{r}</small></b><img className="review-brand-mark" src="/freelovable-logo-transparent.png" alt="FreeLovable"/></footer></article>)}</div>
        <div className="metrics"><div><TechIcon type="users"/><span className="metric-avatars">{[1,2,3,4].map(n=><img key={n} src={`/user-avatars/avatar-${String(n).padStart(2,'0')}.jpg`} alt=""/>)}</span><strong>28937</strong><small>USUÁRIOS ATIVOS</small></div><div><TechIcon type="projects"/><strong>+12 mil</strong><small>PROJETOS CRIADOS</small></div><div><TechIcon type="check"/><strong>97%</strong><small>SATISFAÇÃO</small></div></div>
        <div className="community-strip">
          <div>{Array.from({length:12},(_,i)=><img key={i} src={`/user-avatars/avatar-${String(i+6).padStart(2,'0')}.jpg`} alt="" />)}</div>
          <span><b>Uma comunidade inteira criando</b><small>Novos projetos ganham vida todos os dias com FreeLovable.</small></span>
          <img className="community-logo" src="/freelovable-logo-transparent.png" alt="FreeLovable" />
        </div>
      </section>

      <Arrow />

      <section ref={pricingRef} id="planos" className="container pricing"><h2>Escolha seu acesso aos créditos infinitos:</h2><p>Escolha o período ideal para continuar criando no Lovable sem ficar sem créditos.</p>
        <div className="plans" ref={plansRef} onScroll={updateActivePlan}>
          <Plan title="Plano Mensal" price="R$ 47" note="/mês" button="QUERO O PLANO MENSAL" featured onSelect={setSelectedPlan} />
          <Plan title="Plano Trimestral" price="3× de R$ 37" note="R$ 101,13 à vista" button="QUERO O PLANO TRIMESTRAL" badge="MAIS ESCOLHIDO" onSelect={setSelectedPlan} />
          <GiftPlan onSelect={setSelectedPlan} />
        </div>
        <div className="plan-dots" aria-label="Navegação dos planos">
          {[0,1,2].map(index=><button key={index} type="button" className={`${activePlan===index?"active":""} ${index===2?"gift-dot":""}`} aria-label={index===2?"Ver oferta secreta":`Ver plano ${index+1}`} aria-current={activePlan===index?"true":undefined} onClick={()=>showPlan(index)}>{index===2&&<TechIcon type="gift"/>}</button>)}
        </div>
        <div className="guarantee"><span>✓</span><div><h3>Teste por 7 dias com garantia total</h3><p>Você pode instalar, ativar e usar a FreeLovable no seu fluxo real. Se não fizer sentido para você, solicite o reembolso dentro de 7 dias.</p></div></div>
      </section>

      <section className="container faq"><h2>Perguntas frequentes</h2>{faqs.map(([q,a],i)=><div className={`faq-item ${openFaq===i?'open':''}`} key={q}><button onClick={()=>setOpenFaq(openFaq===i?null:i)} aria-expanded={openFaq===i}><span>{q}</span><b>{openFaq===i?'−':'+'}</b></button><p>{a}</p></div>)}</section>

      <section className="final-cta"><div className="container"><h2>Pronto para usar<br className="title-break"/>{" "}<Gradient>créditos infinitos no Lovable?</Gradient></h2><p>Instale em menos de 1 minuto e continue criando sem limites, interrupções ou créditos acabando.</p><Button href="#planos">LIBERAR MEU ACESSO ⚡</Button><div className="safe"><span>✓ Instalação em menos de 1 minuto</span><span>✓ Sem limites de uso</span><span>✓ Direto da sua própria conta</span></div></div></section>
      <footer className="site-footer"><div className="container"><span className="footer-brand"><img src="/freelovable-logo-transparent.png" alt="" /><span><b>Free</b>Lovable</span></span><small>© 2026 FreeLovable. Todos os direitos reservados.</small></div></footer>
      {selectedPlan && (
        <div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-title">
          <button className="lead-backdrop" aria-label="Fechar formulário" onClick={() => { if (!checkoutLoading) { setSelectedPlan(null); setCheckoutError(""); } }} />
          <div className="lead-panel">
            <button className="lead-close" aria-label="Fechar" disabled={checkoutLoading} onClick={() => { setSelectedPlan(null); setCheckoutError(""); }}>×</button>
            <img src="/freelovable-logo-transparent.png" alt="" />
            <small>VOCÊ ESCOLHEU</small>
            <h2 id="lead-title">{selectedPlan === "Oferta Especial" ? "Oferta Especial Anual" : selectedPlan}</h2>
            <p>Preencha seus dados para liberar a próxima etapa do seu acesso.</p>
            <form onSubmit={submitLead}>
              <label>Nome completo<input name="name" autoComplete="name" required disabled={checkoutLoading} placeholder="Digite seu nome" /></label>
              <label>E-mail<input name="email" type="email" autoComplete="email" required disabled={checkoutLoading} placeholder="voce@email.com" /></label>
              <label>WhatsApp<input name="whatsapp" inputMode="tel" autoComplete="tel" required disabled={checkoutLoading} minLength={10} placeholder="(11) 99999-9999" /></label>
              {checkoutError && <div className="lead-error" role="alert">{checkoutError}</div>}
              <button type="submit" className="cta" disabled={checkoutLoading}>
                {checkoutLoading ? "ABRINDO PAGAMENTO..." : "CONTINUAR COM ESTE PLANO"} <span>→</span>
              </button>
              <em>🔒 Pagamento processado com segurança pelo Mercado Pago.</em>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Plan({title,price,note,button,badge,featured=false,onSelect}:{title:string;price:string;note:string;button:string;badge?:string;featured?:boolean;onSelect:(plan:string)=>void}){
  const quarterly = title === "Plano Trimestral";
  return <article className={`plan ${featured?'featured-plan':''} ${badge?'highlighted-plan':''} ${quarterly?'quarterly-plan':''}`}>{badge&&<div className="plan-badge">{badge}</div>}<h3>{title}</h3><strong className={quarterly ? "quarterly-price" : ""}>{quarterly&&<small>3× de</small>}{quarterly?'R$ 37':price}</strong>{featured&&<em>{note}</em>}<p>{featured?'Ideal para projetos rápidos.':note}</p><ul><li>Créditos ilimitados</li><li>Suporte prioritário</li><li>Atualizações</li><li>16 mil fluxos N8N</li></ul><button className="cta" onClick={() => { trackPlanSelection(title); onSelect(title); }}>{button}<TechIcon type="tap" className="cta-tap"/></button></article>
}

function GiftPlan({onSelect}:{onSelect:(plan:string)=>void}) {
  const [opened, setOpened] = useState(false);

  return (
    <article className={`gift ${opened ? "gift-opened" : ""}`}>
      <div className="gift-surprise" aria-hidden={!opened}>
        <div className="annual-access-badge">ACESSO TOTAL</div>
        <h3>Plano Anual</h3>
        <strong className="annual-price"><small>12× de</small>R$ 27</strong>
        <em>R$ 261,42 à vista</em>
        <ul className="annual-core-list">
          <li>Tudo dos outros planos</li>
          <li>Suporte VIP</li>
          <li>Updates por 1 ano</li>
        </ul>
        <div className="annual-bonus-box">
          <h4><TechIcon type="gift"/> BÔNUS EXCLUSIVOS</h4>
          <ul className="annual-bonus-list">
            <li>Guia Prático - Do Lovable para o Ar</li>
            <li>Gemini Pro por 18 meses</li>
            <li>Gemini 3 + Nano Banana 2</li>
            <li>Veo 3.1 para vídeos com IA</li>
            <li>5 TB + Google Workspace</li>
            <li>Ativação por link na conta atual</li>
          </ul>
        </div>
        <button className="cta lead-cta" onClick={() => { trackPlanSelection("Oferta Especial"); onSelect("Oferta Especial"); }}>
          QUERO MEU PLANO ANUAL <TechIcon type="tap" className="cta-tap"/>
        </button>
      </div>

      <div className="gift-wrap" aria-hidden={opened}>
        <div className="front-gift-box" aria-hidden="true">
          <div className="front-gift-body" />
          <div className="front-gift-lid" />
          <div className="front-gift-ribbon" />
          <div className="front-gift-bow">
            <i className="bow-loop bow-loop-left" />
            <i className="bow-loop bow-loop-right" />
            <b />
          </div>
        </div>
        <div className="gift-wrap-copy">
          <small>OFERTA SECRETA</small>
          <h3>Um presente para você</h3>
          <p>Abra para revelar a melhor condição do plano anual.</p>
        </div>
        <button className="gift-open-button" onClick={() => setOpened(true)}>
          <span>ABRIR MEU PRESENTE</span>
          <b aria-hidden="true">✦</b>
        </button>
      </div>
    </article>
  );
}

function trackMeta(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  document.documentElement.dataset.metaEvent = event;
  const fbq = (window as typeof window & { fbq?: (...args: unknown[]) => void }).fbq;
  if (fbq) fbq("track", event, data);
}

function trackCustomMeta(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  document.documentElement.dataset.metaCustomEvent = event;
  const fbq = (window as typeof window & { fbq?: (...args: unknown[]) => void }).fbq;
  if (fbq) fbq("trackCustom", event, data);
}

function getMetaTracking() {
  if (typeof window === "undefined") return { fbp: "", fbc: "" };

  const fbp = readCookie("_fbp");
  let fbc = readCookie("_fbc");

  if (!fbc) {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid")?.trim();
    if (fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
      writeTrackingCookie("_fbc", fbc);
    }
  }

  return { fbp, fbc };
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}

function writeTrackingCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=7776000; SameSite=Lax${secure}`;
}
