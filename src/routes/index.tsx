import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import {
  Sparkles, Download, Eye, Wand2, Check, X, ShieldCheck, Star, Monitor,
  Plus, Minus, ArrowRight, Play, Pause, Maximize, User, Mail, Phone, Lock, Zap,
} from "lucide-react";
import {
  buildTrackedCheckoutUrl,
  captureAttribution,
  getStoredAttribution,
} from "@/lib/utm-tracking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FreeLovable — Seu Lovable sem consumir créditos" },
      { name: "description", content: "Pare de ficar sem créditos no Lovable. Use o FreeLovable para continuar criando com créditos infinitos; downloads, marca d'água e prompt enhancer entram como bônus." },
    ],
  }),
  component: Landing,
});

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/freelovable-logo-interface-160.webp"
        alt="FreeLovable Logo"
        width={160}
        height={160}
        decoding="async"
        className="h-10 w-10 rounded-lg object-cover"
      />
      <span className="text-lg font-bold tracking-tight">
        <span className="text-gradient">Free</span>
        <span>Lovable</span>
      </span>
    </div>
  );
}

function Nav({ onOpenModal }: { onOpenModal: (planName?: string) => void }) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 border-b border-border/60 md:bg-background/70 md:backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#funcionalidades" className="hover:text-foreground transition">FUNCIONALIDADES</a>
          <a href="#planos" className="hover:text-foreground transition">PLANOS</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          <a href="#revendedor" className="hover:text-foreground transition">PAINEL DO REVENDEDOR</a>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://wa.me/5571993388520"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient px-4 py-2 rounded-lg text-xs font-bold tracking-wide inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.891-11.893 11.891a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
            </svg>
            SUPORTE
          </a>
          <button onClick={() => onOpenModal()} className="btn-gradient px-4 py-2 rounded-lg text-xs font-bold tracking-wide cursor-pointer">
            BAIXE A EXTENSÃO
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onOpenModal }: { onOpenModal: (planName?: string) => void }) {
  return (
    <section className="relative overflow-hidden text-center">
      <div className="absolute inset-x-0 top-10 -z-10 mx-auto h-80 max-w-3xl bg-gradient-to-r from-blue-950/30 via-blue-700/18 to-slate-950/30 blur-3xl md:blur-[120px]" />
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-10 pt-7 md:pb-14">
        <div className="flex max-w-4xl flex-col items-center">
          <img
            src="/freelovable-logo-interface-160.webp"
            alt="FreeLovable"
            width={160}
            height={160}
            decoding="async"
            className="mb-4 h-12 w-12 rounded-2xl border border-white/10 object-cover shadow-2xl"
          />
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-pink" />
            Nova extensão · acesso ilimitado
          </div>
          <h1 className="hero-headline max-w-4xl text-[2.15rem] font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl">
            <span className="block sm:whitespace-nowrap">Nunca mais fique sem</span>
            <span className="hero-highlight block sm:whitespace-nowrap">créditos no Lovable.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-muted-foreground md:text-lg">
            Instale em menos de 1 minuto e continue criando apps, automações e
            projetos sem interrupções, filas ou bloqueios.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-5 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-success" /> Windows & Mac
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-success" /> Acesso imediato
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-success" /> Instalação simples
            </span>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#o-que-e" className="btn-gradient inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-black uppercase tracking-wide shadow-2xl transition-all hover:scale-105 active:scale-95 md:text-base">
  Ver como funciona
  <ArrowRight className="h-5 w-5 animate-bounce-x" />
</a>
           
          </div>
         <div className="mt-7 flex items-center justify-center gap-2.5 opacity-85 md:gap-3 md:opacity-100">
  <div className="flex -space-x-3 md:-space-x-4">
    <img
      src="/avatars/avatar1-96.webp"
      width={96}
      height={96}
      decoding="async"
      className="h-10 w-10 rounded-full border-2 border-background object-cover md:h-12 md:w-12"
      alt="Usuário 1"
    />

    <img
      src="/avatars/avatar2-96.webp"
      width={96}
      height={96}
      decoding="async"
      className="h-10 w-10 rounded-full border-2 border-background object-cover md:h-12 md:w-12"
      alt="Usuário 2"
    />

    <img
      src="/avatars/avatar3-96.webp"
      width={96}
      height={96}
      decoding="async"
      className="h-10 w-10 rounded-full border-2 border-background object-cover md:h-12 md:w-12"
      alt="Usuário 3"
    />

    <img
      src="/avatars/avatar4-96.webp"
      width={96}
      height={96}
      decoding="async"
      className="h-10 w-10 rounded-full border-2 border-background object-cover md:h-12 md:w-12"
      alt="Usuário 4"
    />
  </div>

  <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-white/82 md:text-sm md:font-black md:tracking-wide md:text-white">
    +4.000 USUÁRIOS ATIVOS
  </span>
</div>
</div>

        <div className="relative group mt-14 flex w-full justify-center md:mt-10">
          <div className="absolute -inset-20 hidden rounded-full bg-gradient-to-br from-blue-950/45 via-blue-800/28 to-slate-950/45 opacity-40 blur-[100px] transition-opacity duration-700 group-hover:opacity-65 md:block" />
          
          <div className="relative aspect-[9/16] w-full max-w-[232px] overflow-hidden rounded-[36px] border border-white/10 bg-black/60 p-3 shadow-[0_0_48px_-24px_rgba(88,28,135,0.55)] ring-1 ring-white/20 md:max-w-[310px] md:rounded-[44px] md:shadow-[0_0_100px_-20px_rgba(88,28,135,0.6)] md:backdrop-blur-3xl">
            {/* Phone Notch/Island */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-3xl z-30 flex items-center justify-center gap-2 border-x border-b border-white/5">
               <div className="w-10 h-1 rounded-full bg-white/10" />
               <div className="w-2 h-2 rounded-full bg-white/10" />
            </div>
            
            <div className="relative h-full w-full rounded-[36px] overflow-hidden bg-black group/video">
              <VimeoPlayer videoId="1199890672" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VimeoPlayer({ videoId }: { videoId: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const togglePlay = () => {
    const action = isPlaying ? 'pause' : 'play';
    iframeRef.current?.contentWindow?.postMessage({ method: action }, '*');
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const value = isMuted ? 1 : 0;
    iframeRef.current?.contentWindow?.postMessage({ method: 'setVolume', value: value }, '*');
    setIsMuted(!isMuted);
  };


  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-black/20" />
      
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${videoId}?autoplay=0&loop=1&muted=0&quality=auto&controls=0&api=1`}
        title="Demonstração do FreeLovable"
        loading="lazy"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350%] h-[110%] z-0 pointer-events-none scale-110"
        allow="autoplay; fullscreen"
        style={{ border: 'none', background: 'transparent' }}
      />
      
      {/* Custom Controls Layer */}
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        {!isPlaying && (
          <button 
            onClick={togglePlay}
            className="h-16 w-16 rounded-full btn-gradient flex items-center justify-center shadow-lg scale-100 hover:scale-105 transition-transform duration-300 pointer-events-auto cursor-pointer md:h-24 md:w-24 md:shadow-2xl md:hover:scale-110"
          >
            <Play className="h-7 w-7 text-white fill-current ml-0.5 md:h-10 md:w-10 md:ml-1" />
          </button>
        )}
      </div>

      {isPlaying && (
        <div className="absolute right-3 top-3 z-40 md:right-4 md:top-4">
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white transition-colors hover:bg-black/80 cursor-pointer md:h-10 md:w-10 md:bg-black/42 md:backdrop-blur-md md:hover:bg-black/58"
            aria-label="Pausar video"
          >
            <Pause className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </button>
        </div>
      )}
    </div>
  );
}


function WhatIsFreeLovable() {
  const flow = [
    { title: "Instala a extensão", text: "Adicione o FreeLovable ao Chrome.", icon: Download },
    { title: "Ativa com seu token", text: "Insira o token exclusivo recebido após a compra.", icon: Lock },
    { title: "Escreve seus prompts", text: "Envie seus prompts normalmente pelo painel.", icon: Wand2 },
    { title: "Continua criando com créditos infinitos", text: "Use o Lovable sem se preocupar com créditos acabando.", icon: Check },
  ];

  const highlights = [
    {
      title: "Painel dentro do Lovable",
      text: "A extensão aparece sobre a interface do Lovable no seu navegador.",
      icon: Monitor,
    },
    {
      title: "Mesma conta e projetos",
      text: "Você não abre outro site, não cria outra conta e mantém seu fluxo normal.",
      icon: User,
    },
    {
      title: "Token libera seu plano",
      text: "Após a compra, insira o token recebido para liberar seu acesso.",
      icon: Lock,
    },
  ];

  return (
    <section className="mx-auto flex min-h-svh max-w-7xl items-start px-4 pb-10 pt-2 md:min-h-[calc(100svh-4rem)] md:items-center md:px-6 md:py-12">
      <div id="o-que-e" className="relative w-full scroll-mt-0 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-5 md:scroll-mt-16 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-pink/10" />

        <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-brand-pink">
              Extensão para Chrome
            </div>

            <h2 className="text-3xl font-black leading-tight md:text-4xl">
              O que é o <span className="text-gradient">FreeLovable?</span>
            </h2>

            <p className="mt-4 text-base font-semibold leading-relaxed text-foreground/90 md:text-lg">
              Free Lovable é uma extensão para Chrome que libera créditos
              ilimitados no Lovable durante o período do seu plano, para você
              continuar criando com créditos infinitos sem interromper seus
              projetos.
            </p>

          </div>

          <div className="relative">
            <div className="absolute inset-0 hidden rounded-[28px] bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 blur-2xl md:block" />
            <div className="relative rounded-[28px] border border-white/10 bg-[#0A0A0B] p-4 md:p-5">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-danger/60" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/60" />
                  <span className="h-3 w-3 rounded-full bg-success/60" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Na prática
                </span>
              </div>

              <div className="grid gap-3">
                {flow.map(({ title, text, icon: Icon }, index) => (
                  <div key={title}>
                    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple/25 to-brand-pink/25">
                        <Icon className="h-5 w-5 text-brand-pink" />
                      </div>
                      <div>
                        <h3 className="font-black">{title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {text}
                        </p>
                      </div>
                    </div>

                    {index < flow.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowRight className="h-5 w-5 rotate-90 text-brand-pink" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-8 flex justify-center">
          <a
            href="#como-recebo"
            className="btn-gradient inline-flex items-center gap-3 rounded-2xl px-7 py-4 text-sm font-black uppercase tracking-wide shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            Como recebo meu acesso
            <ArrowRight className="h-5 w-5 animate-bounce-x" />
          </a>
        </div>
      </div>

    </section>
  );
}

function SectionDivider({ href, className = "" }: { href: string; className?: string }) {
  return (
    <div className={`relative z-10 mx-auto flex max-w-7xl justify-center px-6 py-8 md:py-10 ${className}`}>
      <a
        href={href}
        className="inline-flex flex-col items-center justify-center text-brand-pink"
      >
        <div className="flex flex-col items-center justify-center leading-none">
          <ArrowRight className="h-5 w-5 rotate-90" />
          <ArrowRight className="-mt-1 h-5 w-5 rotate-90 opacity-70" />
        </div>
      </a>
    </div>
  );
}


function AccessDelivery() {
  const emailItems = [
    { title: "Link para download da extensão", icon: Download },
    { title: "Token de ativação", icon: Lock },
    { title: "Tutorial rápido", icon: Eye },
  ];

  const bonusItems = [
    "Download dos projetos",
    "Sem marca d'água",
    "Melhorador de prompts",
    "Atualizações incluídas",
  ];

  const practicalSteps = [
    "Escolha seu plano",
    "Receba o token por e-mail",
    "Instale e ative",
  ];

  return (
    <section id="como-recebo" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-8 md:py-10">
      <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-brand-pink">
            <Mail className="h-3.5 w-3.5" />
            Entrega do acesso
          </div>

          <h2 className="text-3xl font-black leading-tight md:text-4xl">
            Como recebo meu{" "}
            <span className="text-gradient">token de acesso?</span>
          </h2>

          <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-foreground/85">
            Assim que o pagamento for aprovado, você recebe seu token por
            e-mail junto com o link da extensão e o tutorial rápido de ativação.
          </p>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#0A0A0B] p-4 md:p-5">
            <div className="grid gap-2 sm:grid-cols-3">
              {practicalSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-black text-brand-pink">
                    {index + 1}
                  </span>
                  <span className="text-sm font-black uppercase tracking-wide">
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">
              O token é sua chave de ativação. Basta colar na extensão e usar na
              sua própria conta Lovable.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 hidden rounded-[28px] bg-gradient-to-br from-brand-purple/25 to-brand-pink/20 blur-2xl md:block" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0A0A0B] p-4 md:p-5">
            <div className="animate-email-arrive relative mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-pink/70 to-transparent" />
              <div className="pointer-events-none absolute right-5 top-5 hidden h-16 w-16 rounded-full bg-brand-pink/20 blur-2xl md:block" />

              <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="animate-email-pulse relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-pink/10 text-brand-pink">
                  <Mail className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[9px] font-black text-black">
                    1
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    E-mail recebido
                  </p>
                  <h3 className="mt-1 font-black">Seu acesso FreeLovable chegou</h3>
                </div>
              </div>

              <div className="grid gap-3">
                {emailItems.map(({ title }, index) => (
                  <div
                    key={title}
                    className="animate-email-item-in flex items-center gap-3 text-sm font-bold opacity-0"
                    style={{ "--email-item-delay": `${0.35 + index * 0.16}s` } as CSSProperties & Record<string, string>}
                  >
                    <Check className="h-4 w-4 text-success" />
                    <span>{title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-pink">
                <Sparkles className="h-3.5 w-3.5" />
                Bônus liberados com o acesso
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {bonusItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-foreground/90"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function WhatYouGet() {
  const pains = [
    "Créditos acabando no meio do projeto",
    "Limites diários travando sua produtividade",
    "Esperar filas para continuar criando",
    "Gastar cada vez mais com créditos",
    "Perder velocidade nas entregas",
  ];

  const benefits = [
    "Créditos infinitos",
    "Continue gerando prompts sem travas",
    "Economize dinheiro em créditos",
    "Bônus: suporte prioritário",
    "Bônus: atualizações constantes",
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="border-t border-white/10 pt-10">
        <h2 className="text-center text-3xl md:text-4xl font-black">
          Você provavelmente está cansado de...
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {pains.map((pain) => (
            <div
              key={pain}
              className="min-h-32 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <X className="mb-6 h-5 w-5 text-danger" />
              <p className="text-sm font-bold leading-snug">{pain}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-center text-3xl md:text-4xl font-black">
          O que você desbloqueia com a FreeLovable
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {benefits.map((benefit) => (
            <div
              key={benefit}
              className="flex min-h-20 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <Check className="h-5 w-5 shrink-0 text-success" />
              <span className="text-sm font-bold leading-snug">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[28px] border border-brand-pink/20 bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 p-6 text-center">
  <h3 className="text-3xl font-black">
    Pare de ficar sem créditos.
  </h3>
  <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
    Instale a extensão, ative seu token e continue criando seus projetos sem interrupções.
  </p>
</div>
      </div>
    </section>
  );
}


function Pitch() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 text-center">
      <p className="text-3xl md:text-4xl font-bold leading-tight">
        <span className="text-muted-foreground/60">Que o </span>
        Lovable é uma ferramenta incrível
        <span className="text-muted-foreground/60"> para construir seus projetos todo mundo sabe, né? Entretanto, </span>
        os créditos acabam rápido e são caros demais.
      </p>
      <p className="mt-10 text-3xl md:text-4xl font-bold leading-tight">
      Porém, com o <img src="/freelovable-logo-interface-160.webp" width={160} height={160} loading="lazy" decoding="async" className="inline h-8 w-8 rounded-md -mt-1 mx-1 object-contain" alt="" />{" "}
        <span className="text-gradient">Free</span> Lovable, você não precisa mais se preocupar com isso!
      </p>
    </section>
  );
}
function SocialProof() {
  const testimonials = [
    {
      name: "Lucas M.",
      role: "Criador de apps com Lovable",
      content:
        "Eu estava literalmente dividindo meus prompts porque não queria gastar crédito à toa. Depois que instalei, voltei a testar as coisas sem ficar pensando nisso toda hora.",
    },
    {
      name: "Ana P.",
      role: "Freelancer",
      content:
        "O que mais me surpreendeu foi continuar usando a mesma conta e os mesmos projetos. Achei que seria outra plataforma complicada, mas foi bem mais simples do que imaginei.",
    },
    {
      name: "Rafael S.",
      role: "Desenvolvedor",
      content:
        "Eu sempre chegava naquela parte do projeto onde precisava testar várias versões e os créditos acabavam. Agora consigo iterar muito mais rápido sem interromper o fluxo.",
    },
    {
      name: "Marina C.",
      role: "Infoprodutora",
      content:
        "Confesso que fiquei desconfiada no começo. Comprei o plano diário para testar e em menos de 10 minutos já estava usando. Acabei pegando o mensal depois.",
    },
    {
      name: "Gabriel C.",
      role: "Agência digital",
      content:
        "A melhor parte não é nem economizar. É não perder o raciocínio no meio da criação porque apareceu aviso de crédito esgotado.",
    },
    {
      name: "Juliana L.",
      role: "Designer",
      content:
        "Antes eu evitava fazer alterações porque sabia que cada teste consumia crédito. Hoje testo muito mais ideias e os projetos ficam melhores por causa disso.",
    },
  ];

  return (
    <section id="depoimentos" className="relative mx-auto max-w-7xl overflow-hidden px-4 py-16 md:px-6 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-10 hidden h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-pink/18 via-brand-purple/16 to-orange-500/14 blur-[95px] md:block" />
        <div className="absolute bottom-0 right-0 hidden h-80 w-80 rounded-full bg-gradient-to-br from-orange-500/12 via-brand-pink/12 to-brand-purple/12 blur-[90px] md:block" />
      </div>

      <div className="relative mx-auto mb-10 max-w-3xl text-center md:mx-0 md:text-left">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-brand-pink">
          Feedback dos usuários
        </div>
        <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
          Quem testou, <span className="text-gradient">continuou usando</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Relatos de usuários que queriam apenas uma forma de continuar criando
          sem interrupções.
        </p>
      </div>

      <div className="relative mb-12 grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-3">
        {testimonials.map((item) => (
          <div
            key={item.name}
            className="card-glow group relative flex flex-col gap-3 overflow-hidden rounded-2xl border-white/10 p-4 md:gap-4 md:rounded-3xl md:p-6"
          >
            <img
              src="/freelovable-logo-interface-160.webp"
              alt=""
              width={160}
              height={160}
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full border border-white/8 object-cover opacity-15 transition group-hover:scale-110 group-hover:opacity-25"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className="h-3 w-3 fill-brand-pink text-brand-pink md:h-4 md:w-4"
                  />
                ))}
              </div>
              <img
                src="/freelovable-logo-interface-160.webp"
                alt=""
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                className="h-3.5 w-3.5 rounded-full object-cover md:h-4 md:w-4"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
              "{item.content}"
            </p>
            <div className="mt-auto">
              <div className="text-sm font-bold md:text-base">{item.name}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground md:text-[10px]">
                {item.role}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mb-12 grid max-w-5xl gap-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-center md:grid-cols-3 md:p-7">
        {[
          ["+4.000", "usuários ativos"],
          ["+12 mil", "projetos criados"],
          ["97%", "satisfação"],
        ].map(([value, label]) => (
          <div key={label}>
            <div className="text-3xl font-black text-gradient md:text-4xl">{value}</div>
            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Comparison({ onOpenModal }: { onOpenModal: (planName?: string) => void }) {

  const cons = [
    "Créditos acabam",
    "Projetos travam",
    "R$125/mês",
  ];
  const pros = [
    "Créditos infinitos",
    "Criação contínua",
    "R$47/mês",
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-center text-3xl md:text-4xl font-black leading-tight">
        Sem enrolação: <span className="text-gradient">o que muda?</span>
      </h2>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-[28px] border border-danger/25 bg-danger/10 p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/15">
              <X className="h-6 w-6 text-danger" />
            </div>
            <h3 className="text-2xl font-black uppercase text-danger">
              Sem FreeLovable
            </h3>
          </div>
          <ul className="space-y-4">
            {cons.map((item) => (
              <li key={item} className="flex items-center gap-3 text-lg font-bold">
                <X className="h-5 w-5 shrink-0 text-danger" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[28px] border border-success/25 bg-success/10 p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15">
              <Check className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-2xl font-black uppercase text-success">
              Com FreeLovable
            </h3>
          </div>
          <ul className="space-y-4">
            {pros.map((item) => (
              <li key={item} className="flex items-center gap-3 text-lg font-bold">
                <Check className="h-5 w-5 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <button onClick={() => onOpenModal()} className="btn-gradient inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all">
          Quero créditos infinitos agora! <ArrowRight className="h-5 w-5 animate-bounce-x" />
        </button>
      </div>
    </section>

  );
}

function Features() {
  const features = [
    { 
      icon: Sparkles, 
      title: "Créditos infinitos", 
      text: "Continue criando no Lovable sem parar por falta de créditos."
    },
    { 
      icon: Download, 
      title: "Bônus: download de projetos", 
      text: "Baixe o código fonte dos seus projetos em um zip quando precisar."
    },
    { 
      icon: Eye, 
      title: "Bônus: sem marca d'água", 
      text: "Remova as tags da Lovable e deixe seus projetos com aparência mais profissional."
    },
    { 
      icon: Wand2, 
      title: "Bônus: melhorador de prompt", 
      text: "Melhore seus prompts antes de enviar e reduza retrabalho."
    },
  ];
  const [active, setActive] = useState(0);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [showPromptResult, setShowPromptResult] = useState(false);

  const handleFeatureChange = (index: number) => {
    setActive(index);
    setIsGeneratingPrompt(false);
    setShowPromptResult(false);
  };


  return (
    <section id="funcionalidades" className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="text-center text-4xl md:text-5xl font-bold leading-tight">
        O principal é simples:
        <br />
        <span className="inline-flex items-center gap-3 mt-3">
          <img src="/freelovable-logo-interface-160.webp" width={160} height={160} loading="lazy" decoding="async" className="h-10 w-10 rounded-xl object-contain" alt="" />
          <span className="text-gradient">créditos infinitos</span> no Lovable
        </span>
      </h2>

      <div className="mt-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isActive = i === active;
            return (
              <button
                key={f.title}
                onClick={() => handleFeatureChange(i)}
                className={`w-full text-left flex gap-4 p-5 rounded-2xl border transition group ${
                  isActive
                    ? "card-glow border-brand-pink/40 shadow-[var(--shadow-glow)] bg-card/80"
                    : "border-transparent hover:border-border/40 hover:bg-card/20"
                }`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${isActive ? "btn-gradient scale-110" : "bg-muted group-hover:scale-105"}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg transition-colors ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative group">
          <div className="absolute -inset-4 hidden rounded-[32px] bg-gradient-to-r from-brand-purple/20 to-brand-pink/20 opacity-50 blur-2xl transition duration-500 group-hover:opacity-100 md:block" />
          <div className="relative card-glow rounded-[32px] border-border/40 overflow-hidden shadow-2xl aspect-[1.4/1] bg-[#0A0A0B]">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-brand-pink/5 z-0" />
            
            {/* Window controls overlay */}
            <div className="absolute top-0 left-0 right-0 h-10 border-b border-border/20 bg-background/80 md:bg-background/40 md:backdrop-blur-md flex items-center px-4 gap-2 z-20">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-danger/40" />
                <div className="w-3 h-3 rounded-full bg-amber-400/40" />
                <div className="w-3 h-3 rounded-full bg-success/40" />
              </div>
              <div className="mx-auto flex items-center gap-2 bg-muted/30 rounded-md px-3 py-1 text-[10px] text-muted-foreground font-mono">
                <Logo className="scale-50 -ml-4" />
                <span className="opacity-50">/</span> 
                {active === 0 ? "dashboard" : active === 1 ? "exporter" : active === 2 ? "preview" : "ai-assistant"}
              </div>
            </div>

            <div className="mt-10 h-full p-4 relative overflow-y-auto custom-scrollbar">
              {active === 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Créditos Lovable</h4>
                      <div className="text-4xl font-black text-gradient">∞ <span className="text-lg text-muted-foreground/40 font-normal">/ 5,00</span></div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/20 text-[10px] font-bold animate-pulse">
                      FREELOVABLE ATIVO
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="text-[10px] text-muted-foreground uppercase font-bold">Log de Uso</h5>
                    {[5, 4, 3, 2, 1].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40 text-[11px] group hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-md bg-success/20 flex items-center justify-center">
                            <Check className="h-3 w-3 text-success" />
                          </div>
                          <span>{i} prompt{i > 1 ? 's' : ''} enviado{i > 1 ? 's' : ''}</span>
                        </div>
                        <span className="font-bold text-success">0 créditos gastos</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {active === 1 && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Exportador de Código</h4>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-[8px] font-bold text-success uppercase">Download Pronto!</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/40 bg-background/40 p-4 space-y-4 font-mono">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-brand-purple">📁</span> src/
                      </div>
                      <div className="pl-4 space-y-2 border-l border-border/20">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-2"><span>📄</span> Button.tsx</span>
                          <span className="text-muted-foreground">1.2kb</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-2"><span>📄</span> Landing.tsx</span>
                          <span className="text-muted-foreground">42.5kb</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-2 text-brand-purple">📁</span> public/
                        <span className="text-muted-foreground">8 items</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-2"><span>⚙️</span> package.json</span>
                        <span className="text-muted-foreground">8.8kb</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-lg bg-success/20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-success" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-success">projeto-lovable.zip</span>
                          <span className="text-[8px] text-success/60">1.4 MB</span>
                        </div>
                      </div>
                    </div>

                    <button className="w-full btn-gradient py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
                      <Download className="h-4 w-4" /> BAIXAR PROJETO COMPLETO
                    </button>
                  </div>
                </div>
              )}

              {active === 2 && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Preview em Tempo Real</h4>
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[8px] font-bold border border-success/20">Marca Removida</span>
                  </div>

                  <div className="flex-1 rounded-2xl border border-border/20 bg-background/20 overflow-hidden flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 hidden rounded-full bg-brand-pink/20 blur-2xl md:block" />
                        <div className="relative h-20 w-20 rounded-full border-2 border-brand-pink flex items-center justify-center bg-background shadow-2xl">
                          <ShieldCheck className="h-10 w-10 text-brand-pink" />
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <h5 className="text-sm font-bold">Remoção de Badge</h5>
                        <p className="text-[10px] text-muted-foreground leading-relaxed px-4">Remova instantaneamente o selo "Built with Lovable" do rodapé.</p>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-border/10 bg-muted/10 flex items-center justify-between">
                      <div className="flex gap-2">
                        <div className="px-2 py-1 rounded bg-muted/40 text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Original</div>
                        <div className="px-2 py-1 rounded bg-brand-pink/20 text-[8px] font-bold text-brand-pink uppercase tracking-tighter border border-brand-pink/30">Clean UI</div>
                      </div>
                      <div className="flex items-center gap-2 text-success">
                        <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        <span className="text-[9px] font-bold uppercase">Proteção Ativa</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {active === 3 && (
                <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-brand-pink" />
                      <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Prompt Enhancer</h4>
                    </div>
                    {showPromptResult && (
                      <div className="flex gap-1.5 animate-in fade-in zoom-in duration-300">
                        <span className="px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple text-[8px] font-black tracking-tighter border border-brand-purple/30">TURBO</span>
                        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[8px] font-bold border border-success/20">99.2% PRECISÃO</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-muted/20 border border-border/40 p-3 rounded-2xl rounded-tl-none relative group">
                      <div className="text-[9px] text-muted-foreground mb-1 uppercase font-bold tracking-tight">Prompt Original</div>
                      <p className="text-[10px] leading-relaxed opacity-60">"Crie uma página de login moderna."</p>
                    </div>

                    {!showPromptResult ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/20 rounded-2xl bg-muted/5">
                        <Wand2 className={`h-10 w-10 mb-4 transition-all duration-500 ${isGeneratingPrompt ? "text-brand-pink animate-spin" : "text-muted-foreground/30"}`} />
                        <button 
                          onClick={() => {
                            setIsGeneratingPrompt(true);
                            setTimeout(() => {
                              setIsGeneratingPrompt(false);
                              setShowPromptResult(true);
                            }, 2000);
                          }}
                          disabled={isGeneratingPrompt}
                          className="btn-gradient px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:scale-95 transition-all"
                        >
                          {isGeneratingPrompt ? "Gerando Prompt..." : "Gerar Prompt"}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-brand-purple/10 border border-brand-purple/30 p-4 rounded-2xl rounded-tr-none relative group animate-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[9px] text-brand-purple uppercase font-black tracking-tight flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5" /> Otimizado por IA
                          </div>
                          <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-brand-pink" />
                            <div className="w-1 h-1 rounded-full bg-brand-purple" />
                          </div>
                        </div>
                        <p className="text-[10px] leading-relaxed font-medium">"Adicione um botão CTA primário com label 'Começar agora', estilo pill, background com gradient roxo→pink, ícone de seta, alinhado ao centro..."</p>
                        
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {['Design System', 'Micro-interactions', 'Accessibility'].map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-brand-purple/10 text-[7px] text-brand-purple font-bold border border-brand-purple/20 uppercase">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex-1" />
                    
                    {showPromptResult && (
                      <button 
                        onClick={() => setShowPromptResult(false)}
                        className="flex items-center justify-center gap-2 py-2.5 border border-border/40 rounded-xl text-[9px] font-bold text-muted-foreground hover:bg-muted/20 transition-colors uppercase tracking-widest animate-in fade-in duration-500"
                      >
                        <ArrowRight className="h-3 w-3 rotate-180" /> Restaurar Original
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          ["+3.000", "Extensões instaladas"],
          ["+500 clientes", "Criando sem consumir créditos"],
          ["100%", "De satisfação"],
          ["Menos de 1 min", "Pra instalar"],
        ].map(([n, l]) => (
          <div key={l}>
            <div className="text-3xl md:text-4xl font-extrabold text-gradient">{n}</div>
            <div className="mt-2 text-xs tracking-widest uppercase text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StepByStep() {
  const steps = [
    { icon: Download, label: "Passo 1", title: "Instale a extensão" },
    { icon: Zap, label: "Passo 2", title: "Ative com 1 clique" },
    { icon: Monitor, label: "Passo 3", title: "Use o Lovable sem limitações" },
  ];

  return (
    <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-14">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Comece em menos de 1 minuto</h2>
        <p className="text-muted-foreground">Instale, ative e volte a criar sem ficar preso em créditos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map(({ icon: Icon, label, title }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_0_40px_-18px_rgba(168,85,247,0.78)]">
              <Icon className="h-8 w-8 text-brand-pink" />
            </div>
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-brand-pink">
              {label}
            </div>
            <h3 className="text-lg font-black">{title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

function Proof() {
  const proofSteps = [
    {
      title: "Créditos acabando",
      status: "1 crédito restante",
      tone: "danger",
      value: "1 / 5",
      detail: "Sem o FreeLovable, cada prompt consome seus créditos.",
      rows: [
        ["Prompt enviado", "-1 crédito"],
        ["Ajuste solicitado", "-1 crédito"],
        ["Nova tentativa", "-1 crédito"],
      ],
    },
    {
      title: "Extensão ativando",
      status: "FreeLovable detectado",
      tone: "brand",
      value: "ON",
      detail: "A extensão ativa direto na sua conta e protege o consumo.",
      rows: [
        ["Conta Lovable", "conectada"],
        ["FreeLovable", "ativo"],
        ["Consumo de créditos", "bloqueado"],
      ],
    },
    {
      title: "Créditos infinitos",
      status: "0 créditos gastos",
      tone: "success",
      value: "∞",
      detail: "Você continua criando projetos sem interromper o fluxo.",
      rows: [
        ["Prompt enviado", "0 créditos"],
        ["Projeto atualizado", "0 créditos"],
        ["Nova versão criada", "0 créditos"],
      ],
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12 max-w-3xl">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-brand-pink">
          PROVA
        </div>
        <h2 className="mt-4 text-4xl md:text-5xl font-black leading-tight">
          Veja o que muda quando o{" "}
          <span className="text-gradient">FreeLovable</span> entra em ação.
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {proofSteps.map((step, index) => (
          <div
            key={step.title}
            className="card-glow overflow-hidden rounded-[28px] border-white/10 bg-[#0A0A0B]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Etapa {index + 1}
              </span>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-2xl font-black ${
                    step.tone === "danger"
                      ? "border-danger/30 bg-danger/10 text-danger"
                      : step.tone === "success"
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-brand-pink/30 bg-brand-pink/10 text-brand-pink"
                  }`}
                >
                  {step.value}
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Status
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                      step.tone === "danger"
                        ? "bg-danger/10 text-danger"
                        : step.tone === "success"
                          ? "bg-success/10 text-success"
                          : "bg-brand-pink/10 text-brand-pink"
                    }`}
                  >
                    {step.status}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${
                      step.tone === "danger"
                        ? "w-1/5 bg-danger"
                        : step.tone === "success"
                          ? "w-full bg-success"
                          : "w-3/5 bg-gradient-to-r from-brand-purple to-brand-pink"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {step.rows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing({ onOpenModal }: { onOpenModal: (planName?: string) => void }) {
  const plans = [
    {
      name: "Plano Diário", price: "R$ 17", period: "/dia", note: "Perfeito para testar hoje mesmo.",
      cta: "QUERO O PLANO DIÁRIO", popular: false,
      features: [
        "Créditos ilimitados",
        "Suporte prioritário",
        "Atualizações",
        "16 mil fluxos N8N",
      ],
    },
    {
      name: "Plano Mensal", price: "R$ 47", period: "/mês", note: "Ideal para projetos rápidos.",
      cta: "QUERO O PLANO MENSAL", popular: true,
      features: [
        "Créditos ilimitados",
        "Suporte prioritário",
        "Atualizações",
        "16 mil fluxos N8N",
      ],
    },
    {
      name: "Plano Trimestral", price: "3x de R$ 37", period: "", note: "R$ 101,13 à vista",
      cta: "QUERO O PLANO TRIMESTRAL", popular: false,
      features: [
        "Créditos ilimitados",
        "Suporte prioritário",
        "Atualizações",
        "16 mil fluxos N8N",
      ],
    },
    {
      name: "Plano Anual", price: "12x de R$ 27", period: "", note: "R$ 261,42 à vista",
      cta: "QUERO O PLANO ANUAL", popular: false,
      features: [
        "Tudo dos outros planos",
        "Acesso anual",
        "Suporte VIP",
        "Updates por 1 ano",
        "Economia máxima",
      ],
    },
  ];

  return (
    <section
  id="planos"
  className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16"
>
      <h2 className="text-center text-3xl font-bold md:text-left md:text-4xl">Escolha seu acesso aos créditos infinitos:</h2>
      <p className="mt-4 text-center text-sm text-muted-foreground md:text-left md:text-base">
        Todos os planos liberam a mesma promessa principal: continuar criando no Lovable sem ficar sem créditos.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 md:mt-12 md:gap-6 lg:grid-cols-4">
        {plans.map((p) => (
          <div key={p.name} className={`relative flex flex-col rounded-3xl border p-4 transition-all duration-500 md:p-6 ${p.name === "Plano Anual" ? 'border-orange-500/70 bg-card/70 ring-1 ring-orange-500/30 shadow-[0_0_60px_-24px_rgba(249,115,22,0.95)] lg:-mt-4 lg:min-h-[580px]' : p.popular ? 'card-glow border-brand-pink/50 bg-brand-pink/5 ring-1 ring-brand-pink/20 shadow-glow' : 'bg-card/40 border-border/40 hover:border-border/80'}`}>
            {p.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full btn-gradient text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
                Mais escolhido
              </div>
            )}
            {p.name === "Plano Anual" && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-brand-pink/20 whitespace-nowrap">
                Acesso total
              </div>
            )}
            <h3 className={`text-sm font-bold leading-tight md:text-lg ${p.name === "Plano Anual" ? "uppercase tracking-[0.14em] text-orange-400 md:tracking-[0.18em]" : ""}`}>{p.name}</h3>
            <div className="mt-3 flex items-baseline gap-1 md:mt-4">
              <div className={`${p.name === "Plano Trimestral" || p.name === "Plano Anual" ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"} font-extrabold`}>{p.price}</div>
              <div className="text-sm text-muted-foreground">{p.period}</div>
            </div>
            <p className={`mt-2 text-xs md:text-sm ${p.name === "Plano Anual" ? "font-bold text-orange-400" : "text-muted-foreground"}`}>{p.note}</p>
            <ul className="mt-5 flex-1 space-y-2 md:mt-6 md:space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2 text-xs leading-snug md:text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-pink md:h-4 md:w-4" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onOpenModal(p.name)}
              className={`mt-6 w-full rounded-xl py-3 text-[10px] font-bold leading-tight tracking-wider transition-all duration-300 cursor-pointer md:mt-8 md:py-4 md:text-sm ${
                p.popular || p.name === "Plano Anual"
                  ? "btn-gradient scale-105 shadow-xl shadow-brand-pink/20" 
                  : "bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white shadow-lg"
              }`}
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 flex max-w-4xl flex-col gap-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-center md:p-8">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-brand-pink/25 bg-brand-pink/10">
          <Check className="h-12 w-12 text-brand-pink" />
        </div>
        <div>
          <h3 className="text-2xl font-black md:text-3xl">Teste por 7 dias com garantia total</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Você pode instalar, ativar e usar a FreeLovable no seu fluxo real.
            Se não fizer sentido para você, solicite o reembolso dentro de 7 dias.
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    ["Funciona em qualquer dispositivo?", "Sim! Funciona em PC, tablet e celular através do navegador."],
    ["Posso usar na minha própria conta?", "Sim, a extensão roda direto na sua conta Lovable, sem necessidade de logins externos."],
    ["Minha conta pode ser banida?", "Não. A extensão atua localmente no navegador, mantendo seu acesso 100% seguro."],
    ["Como recebo e instalo a extensão?", "Após a compra, você recebe o link de download e um tutorial passo a passo de instalação."],
    ["Se eu tiver dificuldades na instalação ou no uso como eu faço?", "Nosso suporte está disponível 24h por dia, 7 dias por semana, para te ajudar."],
    ["E se a extensão parar de funcionar?", "Mantemos atualizações constantes e o suporte resolve qualquer incompatibilidade rapidamente."],
    ["Quantos projetos posso criar?", "Quantos você quiser. Sem limites de prompts nem de projetos."],
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 py-14 md:py-16">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Perguntas frequentes</h2>
      <div className="mt-10 space-y-3">
        {items.map(([q, a], i) => (
          <div
            key={q}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-2"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
            >
              <span className="font-semibold">{q}</span>
              {open === i ? <Minus className="h-4 w-4 text-brand-pink" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
            </button>
            {open === i && <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/20 via-background to-brand-pink/20" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, oklch(0.5 0.1 295) 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }} />
      <div className="relative mx-auto max-w-5xl px-6 py-16 text-center md:py-20">
        <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">
          Pronto para usar
          <br />
          <span className="text-gradient">créditos infinitos no Lovable?</span>
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-muted-foreground">
          A promessa principal é simples: parar de ficar sem créditos e continuar criando sem interrupções.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <a href="#planos" className="btn-gradient inline-flex items-center gap-2 px-6 py-4 rounded-xl font-semibold">
            Liberar meu acesso <Zap className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-8 flex flex-wrap gap-6 justify-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-brand-pink" /> Instalação em menos de 1 minuto</span>
          <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-brand-pink" /> Sem limites de uso</span>
          <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-brand-pink" /> Direto da sua própria conta</span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <Logo />
        <p>© {new Date().getFullYear()} FreeLovable. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

function MobileStickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-background/95 px-4 py-2.5 md:hidden">
      <a
        href="#planos"
        className="btn-gradient flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-wide shadow-2xl shadow-brand-pink/20"
      >
        Liberar acesso agora
        <ArrowRight className="h-4 w-4 animate-bounce-x" />
      </a>
    </div>
  );
}

function Landing() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>();

  useEffect(() => {
    captureAttribution();
  }, []);

  const openModal = (planName?: string) => {
    setSelectedPlan(planName);
    setIsModalOpen(true);
  };



  return (
    <main className="min-h-screen pb-24 md:pb-0">
      <Hero onOpenModal={openModal} />
      <SectionDivider href="#o-que-e" />
      <WhatIsFreeLovable />
      <SectionDivider href="#como-recebo" />
      <AccessDelivery />
      <SectionDivider href="#depoimentos" />
      <SocialProof />
      <SectionDivider href="#planos" />
      <Pricing onOpenModal={openModal} />
      <FAQ />
      <FinalCTA />
      <Footer />
      <MobileStickyCTA />
      
      {isModalOpen && <RegisterModal onClose={() => setIsModalOpen(false)} planName={selectedPlan} />}
    </main>
  );
}

type LeadFormData = {
  name: string;
  email: string;
  whatsapp: string;
};

function normalizeLeadForm(data: LeadFormData) {
  const nome = data.name.trim().replace(/\s+/g, " ");
  const email = data.email.trim().toLowerCase();
  const telefone = data.whatsapp.replace(/\D/g, "");
  const letterCount = nome.match(/\p{L}/gu)?.length ?? 0;

  if (!nome || letterCount < 2) {
    throw new Error("Informe um nome válido com pelo menos 2 letras.");
  }
  if (!/^[\p{L}\p{M}\s'’-]+$/u.test(nome)) {
    throw new Error("Use apenas letras, espaços, apóstrofo e hífen no nome.");
  }

  const emailParts = email.split("@");
  const emailDomain = emailParts[1] || "";
  const emailTld = emailDomain.split(".").at(-1) || "";
  if (
    !email ||
    !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) ||
    emailTld.length < 2
  ) {
    throw new Error("Informe um e-mail válido.");
  }

  if (telefone.length < 10 || telefone.length > 13) {
    throw new Error("Informe um WhatsApp válido com 10 a 13 dígitos.");
  }

  return { nome, email, telefone };
}

function sanitizePhoneInput(value: string) {
  return value.replace(/[^\d\s()+-]/g, "");
}

function escapePostgrestLike(value: string) {
  return value.replace(/[%_]/g, (character) => `\\${character}`);
}

function RegisterModal({ onClose, planName }: { onClose: () => void, planName?: string }) {
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  function planoKey(): "diario" | "mensal" | "trimestral" | "anual" {
    const p = (planName || "").toLowerCase();
    if (p.includes("diár") || p.includes("diari")) return "diario";
    if (p.includes("trimestr")) return "trimestral";
    if (p.includes("anual")) return "anual";
    return "mensal";
  }

   const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (submittingRef.current) return;

  submittingRef.current = true;
  setError(null);
  setLoading(true);

  try {
    const plano = planoKey();
    const normalizedForm = normalizeLeadForm(formData);
    setFormData({
      name: normalizedForm.nome,
      email: normalizedForm.email,
      whatsapp: normalizedForm.telefone,
    });
    const checkoutUrls: Record<typeof plano, string> = {
      // Rollback Cakto:
      // diario: "https://pay.cakto.com.br/tmtnfcw_926988",
      // mensal: "https://pay.cakto.com.br/gswneg7_927010",
      // trimestral: "https://pay.cakto.com.br/pyfdu57_927020",
      // anual: "https://pay.cakto.com.br/eorwpqd_927027",
      diario: "https://freelovablepro.carrinho.app/one-checkout/ocmtb/36794612",
      mensal: "https://freelovablepro.carrinho.app/one-checkout/ocmtb/36795113",
      trimestral: "https://freelovablepro.carrinho.app/one-checkout/ocmtb/36795333",
      anual: "https://freelovablepro.carrinho.app/one-checkout/ocmtb/36795365",
    };
    const attribution = getStoredAttribution();

    // Grava o lead no Supabase externo antes de redirecionar pro checkout.
    const { supabaseExternal, PLANO_VALOR_OFERTA } = await import(
      "@/integrations/supabase-external/client"
    );
    const now = new Date().toISOString();
    const recentSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const latestAttribution = {
      ...(attribution.utm_source ? { origem: attribution.utm_source } : {}),
      ...(attribution.utm_campaign ? { campanha: attribution.utm_campaign } : {}),
      ...(attribution.utm_content ? { criativo: attribution.utm_content } : {}),
    };
    const [emailLookup, phoneLookup] = await Promise.all([
      supabaseExternal
        .from("leads_checkout_br")
        .select("id, criado_em")
        .eq("status_pagamento", "pendente")
        .is("comprado_em", null)
        .gte("criado_em", recentSince)
        .ilike("email", escapePostgrestLike(normalizedForm.email))
        .order("criado_em", { ascending: false })
        .limit(5),
      supabaseExternal
        .from("leads_checkout_br")
        .select("id, criado_em")
        .eq("status_pagamento", "pendente")
        .is("comprado_em", null)
        .gte("criado_em", recentSince)
        .eq("telefone", normalizedForm.telefone)
        .order("criado_em", { ascending: false })
        .limit(5),
    ]);

    if (emailLookup.error || phoneLookup.error) {
      console.warn("Não foi possível verificar lead recente; seguindo com novo cadastro:", {
        emailError: emailLookup.error,
        phoneError: phoneLookup.error,
      });
    }

    const recentLeads = new Map<string, { id: string; criado_em: string }>();
    for (const lead of [
      ...(emailLookup.error ? [] : (emailLookup.data ?? [])),
      ...(phoneLookup.error ? [] : (phoneLookup.data ?? [])),
    ]) {
      recentLeads.set(lead.id, lead);
    }
    const existingLead = [...recentLeads.values()].sort(
      (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
    )[0];

    let leadId = crypto.randomUUID();
    let reusedLead = false;
    if (existingLead) {
      const { error: updateError } = await supabaseExternal
        .from("leads_checkout_br")
        .update({
          nome: normalizedForm.nome,
          email: normalizedForm.email,
          telefone: normalizedForm.telefone,
          plano,
          external_reference: existingLead.id,
          valor_oferta: PLANO_VALOR_OFERTA[plano],
          etapa_funil: "formulario_preenchido",
          atualizado_em: now,
          ...latestAttribution,
        })
        .eq("id", existingLead.id)
        .eq("status_pagamento", "pendente")
        .is("comprado_em", null)
        .gte("criado_em", recentSince);

      if (updateError) {
        console.error("Falha ao atualizar lead recente:", updateError);
        throw new Error(
          "Não foi possível registrar seus dados. Tente novamente antes de ir ao pagamento.",
        );
      }

      leadId = existingLead.id;
      reusedLead = true;
    }

    if (!reusedLead) {
      const { data: insertedLead, error: insertError } = await supabaseExternal
        .from("leads_checkout_br")
        .insert({
          id: leadId,
          nome: normalizedForm.nome,
          email: normalizedForm.email,
          telefone: normalizedForm.telefone,
          plano,
          external_reference: leadId,
          status_pagamento: "pendente",
          etapa_funil: "formulario_preenchido",
          origem: attribution.utm_source ?? null,
          campanha: attribution.utm_campaign ?? null,
          criativo: attribution.utm_content ?? null,
          valor_oferta: PLANO_VALOR_OFERTA[plano],
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Falha ao gravar assinatura:", insertError);
        throw new Error(
          "Não foi possível registrar seus dados. Tente novamente antes de ir ao pagamento.",
        );
      }

      if (insertedLead?.id) {
        leadId = insertedLead.id;
      }
    }

    const checkoutUrl = buildTrackedCheckoutUrl(checkoutUrls[plano]);
    const trackedCheckoutUrl = new URL(checkoutUrl);
    trackedCheckoutUrl.searchParams.set("lead_id", leadId);
    trackedCheckoutUrl.searchParams.set("external_reference", leadId);
    trackedCheckoutUrl.searchParams.set("reference", leadId);
    const finalCheckoutUrl = trackedCheckoutUrl.toString();

    const checkoutStartedAt = new Date().toISOString();
    const checkoutUpdatePayload = {
      payment_provider: "appmax",
      etapa_funil: "checkout_iniciado",
      checkout_url: finalCheckoutUrl,
      checkout_iniciado_em: checkoutStartedAt,
      atualizado_em: checkoutStartedAt,
    };

    const { data: checkoutUpdatedLead, error: checkoutErr } = await supabaseExternal
      .from("leads_checkout_br")
      .update(checkoutUpdatePayload)
      .eq("id", leadId)
      .select("id")
      .maybeSingle();

    if (checkoutErr || !checkoutUpdatedLead) {
      console.error("Falha ao registrar checkout iniciado Appmax; redirecionando mesmo assim:", {
        leadId,
        plano,
        checkoutUrl: finalCheckoutUrl,
        checkoutUpdatePayload,
        checkoutErr,
        nenhumRegistroAtualizado: !checkoutUpdatedLead,
      });
    }

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead', {
        content_name: 'FreeLovable Form',
        content_category: 'lead_form',
        plano,
      });
    }

    window.location.href = finalCheckoutUrl;
  } catch (e) {
    setError(e instanceof Error ? e.message : "Erro inesperado");
    setLoading(false);
    submittingRef.current = false;
  }
};


  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/88 sm:bg-black/80 sm:backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto card-glow rounded-[24px] p-5 animate-in zoom-in-95 fade-in duration-300 border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-[#0A0A0B] sm:rounded-[32px] sm:p-8">
        <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors">
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src="/freelovable-logo-interface-160.webp"
            width={160}
            height={160}
            decoding="async"
            className="h-12 w-12 rounded-xl object-cover mb-4" 
            alt="Logo" 
          />
          <h3 className="text-2xl font-bold text-gradient mb-2">
            {planName ? `Quero o ${planName}` : "Quase lá!"}
          </h3>
          <p className="text-sm text-muted-foreground">Preencha seus dados para prosseguir com o pagamento.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                required type="text" placeholder="Seu nome aqui" 
                className="w-full bg-muted/20 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-pink/50 transition-colors"
                value={formData.name}
                autoComplete="name"
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                required type="email" placeholder="exemplo@email.com" 
                className="w-full bg-muted/20 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-pink/50 transition-colors"
                value={formData.email}
                autoComplete="email"
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                required type="tel" placeholder="(00) 00000-0000" 
                className="w-full bg-muted/20 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-pink/50 transition-colors"
                value={formData.whatsapp}
                inputMode="tel"
                autoComplete="tel"
                onChange={e => setFormData({
                  ...formData,
                  whatsapp: sanitizePhoneInput(e.target.value),
                })}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" disabled={loading} className="w-full btn-gradient py-4 rounded-xl font-bold mt-4 shadow-lg shadow-brand-pink/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer uppercase disabled:opacity-60">
            {loading
              ? (planName ? "Gerando pagamento..." : "Enviando...")
              : planName
                ? `Quero o ${planName}`
                : "BAIXAR EXTENSÃO"}
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-success" />
            <span>Seus dados estão seguros.</span>
          </div>
        </form>
      </div>
    </div>
  );
}




