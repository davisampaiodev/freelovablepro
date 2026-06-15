import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Download, Eye, Wand2, Check, X, ShieldCheck, Star, Monitor,
  Plus, Minus, ArrowRight, Zap, Play, Pause, Volume2, Maximize, User, Mail, Phone, Lock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FreeLovable — Seu Lovable sem consumir créditos" },
      { name: "description", content: "Crie projetos ilimitados no Lovable sem gastar créditos. Extensão FreeLovable: downloads, sem marca d'água, melhoria de prompt com IA." },
    ],
  }),
  component: Landing,
});

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="https://api.freelovable.com.br/storage/v1/object/public/anexos/f858f905-cc9b-462b-acea-d3c81e795a87.jpg" 
        alt="FreeLovable Logo"
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
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
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
            href="https://wa.me/+5571983463684"
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
    <section className="relative mx-auto max-w-7xl px-6 min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
            Seu <span className="text-gradient">Lovable</span> agora é{" "}
            <span className="text-gradient">Free</span>.
            <br />
            Crie seus projetos{" "}
            <span className="text-gradient">sem limites.</span>
          </h1>
          <p className="mt-8 text-xl text-muted-foreground max-w-xl leading-relaxed">
            Com o <span className="text-foreground font-semibold">FreeLovable</span> sua criatividade não tem mais barreiras!
            Utilize o Lovable sem consumir créditos, direto da sua conta, em quantos projetos quiser!
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#planos" className="btn-gradient inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all">
              Começar a criar agora <ArrowRight className="h-5 w-5 animate-bounce-x" />
            </a>
            <a href="#funcionalidades" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm">
              Ver como funciona
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5"><ShieldCheck className="h-3.5 w-3.5 text-brand-pink" /> 100% Seguro</span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5"><Star className="h-3.5 w-3.5 text-brand-pink" /> Conta Própria</span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5"><Monitor className="h-3.5 w-3.5 text-brand-pink" /> Multi-dispositivo</span>
          </div>
        </div>

        <div className="relative group flex justify-center lg:justify-end lg:-mr-12">
          <div className="absolute -inset-20 bg-gradient-to-br from-brand-purple/40 to-brand-pink/40 blur-[100px] rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-700" />
          
          <div className="relative w-full max-w-[420px] aspect-[9/16] rounded-[60px] p-4 overflow-hidden shadow-[0_0_100px_-20px_rgba(var(--brand-purple),0.6)] border border-white/10 bg-black/60 backdrop-blur-3xl ring-1 ring-white/20">
            {/* Phone Notch/Island */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-3xl z-30 flex items-center justify-center gap-2 border-x border-b border-white/5">
               <div className="w-10 h-1 rounded-full bg-white/10" />
               <div className="w-2 h-2 rounded-full bg-white/10" />
            </div>
            
            <div className="relative h-full w-full rounded-[44px] overflow-hidden bg-black group/video">
              <VimeoPlayer videoId="1199890672" />
              
              {/* Overlay Content */}
              <div className="absolute bottom-10 left-0 right-0 px-8 z-20 space-y-5 pointer-events-none">
                 <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full btn-gradient p-[2px]">
                       <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                          <Logo className="scale-[0.45] -ml-5" />
                       </div>
                    </div>
                    <div className="flex-1">
                       <div className="text-sm font-black text-white tracking-tight">FreeLovable Pro</div>
                       <div className="text-[11px] text-white/70">@freelovable • Seguindo</div>
                    </div>
                 </div>
                 <p className="text-[13px] text-white/95 leading-relaxed font-semibold drop-shadow-lg">
                    Crie projetos ilimitados no Lovable sem consumir seus créditos! 🚀🔥 #DevLife #AI #FreeLovable
                 </p>
              </div>
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
        src={`https://player.vimeo.com/video/${videoId}?autoplay=0&loop=1&muted=0&quality=1080p&controls=0&api=1`}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350%] h-[110%] z-0 pointer-events-none scale-110"
        allow="autoplay; fullscreen"
        style={{ border: 'none', background: 'transparent' }}
      />
      
      {/* Custom Controls Layer */}
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        {!isPlaying && (
          <button 
            onClick={togglePlay}
            className="h-24 w-24 rounded-full btn-gradient flex items-center justify-center shadow-2xl scale-100 hover:scale-110 transition-transform duration-300 pointer-events-auto cursor-pointer"
          >
            <Play className="h-10 w-10 text-white fill-current ml-1" />
          </button>
        )}
      </div>

      <div className="absolute top-12 right-6 z-40 flex flex-col gap-4">
        <button 
          onClick={toggleMute}
          className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all pointer-events-auto cursor-pointer"
        >
          {isMuted ? <Zap className="h-5 w-5 text-brand-pink" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button 
          onClick={togglePlay}
          className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all pointer-events-auto cursor-pointer"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
        </button>
      </div>
    </div>
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
      Porém, com o <img src="https://api.freelovable.com.br/storage/v1/object/public/anexos/f858f905-cc9b-462b-acea-d3c81e795a87.jpg" className="inline h-8 w-8 rounded-md -mt-1 mx-1 object-cover" alt="" />{" "}
        <span className="text-gradient">Free</span> Lovable, você não precisa mais se preocupar com isso!
      </p>
    </section>
  );
}

function SocialProof() {
  const reviews = [
    { name: "Carlos Oliveira", role: "Desenvolvedor Fullstack", content: "Melhor investimento que fiz este ano. Os créditos do Lovable acabavam em 1 dia, agora trabalho sem preocupação.", rating: 5 },
    { name: "Mariana Costa", role: "Product Designer", content: "A função de remover a marca d'água é perfeita para apresentar os protótipos para clientes. Recomendo muito!", rating: 5 },
    { name: "Ricardo Santos", role: "Freelancer", content: "O exportador de código é o que eu mais precisava. Baixo tudo e subo no meu próprio servidor em minutos.", rating: 5 },
    { name: "Beatriz Lima", role: "Empreendedora", content: "O suporte é excelente. Tive uma dúvida na instalação e resolveram em menos de 10 minutos pelo WhatsApp.", rating: 5 }
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">O que nossos clientes dizem</h2>
        <p className="text-muted-foreground">Junte-se a mais de 500 profissionais que já estão criando sem limites.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {reviews.map((r, i) => (
          <div key={i} className="card-glow p-6 rounded-3xl border-white/5 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-300">
            <div className="flex gap-1">
              {[...Array(r.rating)].map((_, idx) => (
                <Star key={idx} className="h-4 w-4 fill-brand-pink text-brand-pink" />
              ))}
            </div>
            <p className="text-sm italic text-muted-foreground leading-relaxed">"{r.content}"</p>
            <div className="mt-auto flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink p-[1px]">
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center font-bold text-xs">
                  {r.name.charAt(0)}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold">{r.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{r.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
        <img 
          src="https://api.freelovable.com.br/storage/v1/object/public/anexos/eb9ff431-2965-4d94-8a74-1d9aba6df44d.jpg" 
          alt="Provas Sociais" 
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
      </div>
    </section>
  );
}

function Comparison({ onOpenModal }: { onOpenModal: (planName?: string) => void }) {

  const cons = [
    { label: "CRÉDITOS", text: "Acabam em 4 ou 5 prompts" },
    { label: "CÓDIGO DO PROJETO", text: "Impossível de baixar, sempre preso na plataforma do Lovable" },
    { label: "MARCA D'ÁGUA", text: "Permanente, independente do plano que você assine, a marca do Lovable estará lá." },
    { label: "PROMPTS", text: "Limitados aos seus créditos. Você escreve e a I.A ainda entende errado e consome seus créditos!" },
    { label: "SUPORTE", text: "Faça tudo sozinho, sem suporte algum, consumindo créditos em tudo que quiser fazer." },
    { label: "CUSTO MENSAL", text: "Plano Pro: R$ 125,00/mês com apenas 100 créditos mensais que não duram 3 dias!" },
  ];
  const pros = [
    { label: "CRÉDITOS", text: "Nunca acabam já que não são consumidos" },
    { label: "CÓDIGO DO PROJETO", text: "Download completo do seu projeto, quando quiser, quantas vezes quiser" },
    { label: "MARCA D'ÁGUA", text: "Seu produto, sua marca. Remova todas as marcas d'água num clique!" },
    { label: "PROMPTS", text: "Melhoria de prompt automática com o ChatGPT integrado" },
    { label: "SUPORTE", text: "Suporte técnico, mentoria e consultoria para os seus projetos" },
    { label: "CUSTO MENSAL", text: "Apenas R$ 49,90 por mês com prompts e projetos infinitos!" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="text-center text-4xl md:text-5xl font-bold leading-tight">
        Sua criatividade e seu potencial <span className="text-gradient">agora sem limites!</span>
      </h2>
      <p className="mt-6 text-center max-w-3xl mx-auto text-muted-foreground">
        Compare a experiência de trabalhar no Lovable sem e com a <span className="text-gradient font-semibold">Free</span>Lovable:
        Crie infinitos projetos, não tenha limites para criar e editar seus trabalhos e deixe tudo com a sua cara,
        por um valor muito abaixo do convencional!
      </p>

      <div className="relative mt-20 grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-brand-purple/5 to-brand-pink/5 blur-[120px] -z-10" />
        
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-danger/20 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-500" />
          <div className="relative card-glow rounded-[32px] p-8 md:p-10 border-white/5 bg-background/40 h-full">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="h-16 w-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4 ring-1 ring-danger/20">
                <X className="h-8 w-8 text-danger" />
              </div>
              <h3 className="text-2xl font-bold text-danger">Sem o FreeLovable</h3>
              <p className="text-sm text-muted-foreground mt-2 italic">A experiência frustrante e limitada</p>
            </div>
            
            <ul className="space-y-8">
              {cons.map((c) => (
                <li key={c.label} className="relative pl-8 group/item">
                  <div className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-danger/40 group-hover/item:scale-150 transition-transform" />
                  <div className="text-[10px] tracking-[0.2em] font-black text-muted-foreground/50 uppercase mb-1">{c.label}</div>
                  <p className="text-sm leading-relaxed text-muted-foreground/80 group-hover/item:text-foreground transition-colors">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-brand-purple to-brand-pink rounded-[32px] blur opacity-30 group-hover:opacity-60 transition duration-500" />
          <div className="relative card-glow rounded-[32px] p-8 md:p-10 border-brand-pink/20 bg-background/60 h-full shadow-[0_0_40px_-15px_rgba(var(--brand-pink),0.3)]">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="h-16 w-16 rounded-2xl btn-gradient flex items-center justify-center mb-4 shadow-lg shadow-brand-pink/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gradient">Com FreeLovable</h3>
              <p className="text-sm text-muted-foreground mt-2 italic">Sua criatividade em escala máxima</p>
            </div>
            
            <ul className="space-y-8">
              {pros.map((c) => (
                <li key={c.label} className="relative pl-8 group/item">
                  <div className="absolute left-0 top-1.5 h-5 w-5 rounded-full bg-success/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                    <Check className="h-3 w-3 text-success" />
                  </div>
                  <div className="text-[10px] tracking-[0.2em] font-black text-brand-pink uppercase mb-1">{c.label}</div>
                  <p className="text-sm leading-relaxed font-medium group-hover/item:text-white transition-colors">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full bg-[#0A0A0B] border border-white/10 items-center justify-center z-20 shadow-2xl">
          <div className="text-lg font-black tracking-tighter text-muted-foreground/40 italic">VS</div>
        </div>
      </div>

      <div className="mt-16 flex justify-center">
        <button onClick={() => onOpenModal()} className="btn-gradient inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all">
          Quero meu Lovable ilimitado agora! <ArrowRight className="h-5 w-5 animate-bounce-x" />
        </button>
      </div>
    </section>

  );
}

function Features() {
  const features = [
    { 
      icon: Sparkles, 
      title: "Créditos ilimitados", 
      text: "Mande quantos prompts quiser, sem consumir créditos e crie o quanto quiser!"
    },
    { 
      icon: Download, 
      title: "Download de projetos", 
      text: "Faça o download do código fonte dos seus projetos em um único zip com apenas um clique, sem precisar de conta premium para isso!"
    },
    { 
      icon: Eye, 
      title: "Sem marca d'água", 
      text: "Seus projetos, sua marca: Remova as tags da Lovable e dê um ar mais profissional ao seu projeto com um clique!"
    },
    { 
      icon: Wand2, 
      title: "Melhore o prompt com I.A", 
      text: "Descreva em poucas palavras o que você quer no seu projeto e a I.A detalha e melhora o seu prompt antes de enviar."
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
        Confira as funcionalidades exclusivas do
        <br />
        <span className="inline-flex items-center gap-3 mt-3">
          <img src="https://api.freelovable.com.br/storage/v1/object/public/anexos/f858f905-cc9b-462b-acea-d3c81e795a87.jpg" className="h-10 w-10 rounded-xl object-cover" alt="" />
          <span className="text-gradient">Free</span> Lovable
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
          <div className="absolute -inset-4 bg-gradient-to-r from-brand-purple/20 to-brand-pink/20 blur-2xl rounded-[32px] opacity-50 group-hover:opacity-100 transition duration-500" />
          <div className="relative card-glow rounded-[32px] border-border/40 overflow-hidden shadow-2xl aspect-[1.4/1] bg-[#0A0A0B]">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-brand-pink/5 z-0" />
            
            {/* Window controls overlay */}
            <div className="absolute top-0 left-0 right-0 h-10 border-b border-border/20 bg-background/40 backdrop-blur-md flex items-center px-4 gap-2 z-20">
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
                        <div className="absolute inset-0 bg-brand-pink/20 blur-2xl rounded-full" />
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
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Como instalar e começar a criar?</h2>
        <p className="text-muted-foreground">Siga o passo a passo e libere seu potencial em menos de 1 minuto.</p>
      </div>
      
      <div className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl group card-glow p-1">
        <img 
          src="https://api.freelovable.com.br/storage/v1/object/public/anexos/b256abf9-1c2e-4e57-a729-3ff74dd1bc75.jpg" 
          alt="Passo a passo instalação" 
          className="w-full h-auto object-cover rounded-[38px] transition-transform duration-700 group-hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

function Pricing({ onOpenModal }: { onOpenModal: (planName?: string) => void }) {
  const plans = [
    {
      name: "Plano Diário", price: "R$ 9,90", period: "", note: "Utilize a ferramenta por 24h.",
      cta: "QUERO O PLANO DIÁRIO", popular: false,
      features: [
        "Lovable ilimitado (sem consumir créditos)",
        "Downloads de projetos ilimitados",
        "Remoção de marca d'água",
        "Melhora de prompts ilimitada",
      ],
    },
    {
      name: "Plano Mensal", price: "R$ 49,90", period: "/mês", note: "Ideal para projetos rápidos.",
      cta: "QUERO O PLANO MENSAL", popular: true,
      features: [
        "Lovable ilimitado (sem consumir créditos)",
        "Downloads de projetos ilimitados",
        "Remoção de marca d'água",
        "Melhora de prompts ilimitada",
        "Suporte 24h, 7 dias por semana",
        "Acesso à comunidade & cursos da área",
        "Mentoria para projetos",
        "Suporte para hospedagem e banco de dados",
      ],
    },
    {
      name: "Plano Trimestral", price: "R$ 42,33", period: "/mês", note: "Pagamento único de R$ 127,00.",
      cta: "QUERO O PLANO TRIMESTRAL", popular: false,
      features: [
        "Lovable ilimitado (sem consumir créditos)",
        "Downloads de projetos ilimitados",
        "Remoção de marca d'água",
        "Melhora de prompts ilimitada",
        "Suporte 24h, 7 dias por semana",
        "Acesso à comunidade & cursos da área",
        "Mentoria para projetos",
        "Suporte para hospedagem e banco de dados",
      ],
    },
    {
      name: "Plano Anual", price: "R$ 24,75", period: "/mês", note: "Pagamento único de R$ 297,00.",
      cta: "QUERO O PLANO ANUAL", popular: false,
      features: [
        "Lovable ilimitado (sem consumir créditos)",
        "Downloads de projetos ilimitados",
        "Remoção de marca d'água",
        "Melhora de prompts ilimitada",
        "Suporte 24h, 7 dias por semana",
        "Acesso à comunidade & cursos da área",
        "Mentoria para projetos",
        "Suporte para hospedagem e banco de dados",
      ],
    },
  ];

  return (
    <section id="planos" className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="text-4xl md:text-5xl font-bold">Escolha o seu plano:</h2>
      <p className="mt-4 text-muted-foreground">
        Escolha o plano ideal e comece a criar infinitamente com Lovable agora mesmo!
      </p>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => (
          <div key={p.name} className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-500 ${p.popular ? 'card-glow border-brand-pink/50 bg-brand-pink/5 ring-1 ring-brand-pink/20 shadow-glow' : 'bg-card/40 border-border/40 hover:border-border/80'}`}>
            {p.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full btn-gradient text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
                Mais Popular
              </div>
            )}
            <h3 className="text-xl font-bold">{p.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <div className="text-4xl font-extrabold">{p.price}</div>
              <div className="text-sm text-muted-foreground">{p.period}</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <Check className="h-4 w-4 text-brand-pink shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onOpenModal(p.name)}
              className={`mt-8 w-full py-4 rounded-xl text-sm font-bold tracking-wider transition-all duration-300 cursor-pointer ${
                p.popular 
                  ? "btn-gradient scale-105 shadow-xl shadow-brand-pink/20" 
                  : "bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white shadow-lg"
              }`}
            >
              {p.cta}
            </button>
          </div>
        ))}
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
    <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
      <h2 className="text-4xl md:text-5xl font-bold">Dúvidas frequentes.</h2>
      <div className="mt-10 divide-y divide-border">
        {items.map(([q, a], i) => (
          <div key={q} className="py-5">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 text-left"
            >
              <span className="font-semibold">{q}</span>
              {open === i ? <Minus className="h-4 w-4 text-brand-pink" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
            </button>
            {open === i && <p className="mt-3 text-sm text-muted-foreground">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA({ onOpenModal }: { onOpenModal: (planName?: string) => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/20 via-background to-brand-pink/20" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, oklch(0.5 0.1 295) 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }} />
      <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
        <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">
          Pronto para criar sem
          <br />
          <span className="text-gradient">nenhum limite de créditos?</span>
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-muted-foreground">
          Instale o FreeLovable agora e experimente a verdadeira liberdade de programar com inteligência artificial,
          direto na sua própria conta.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <button onClick={() => onOpenModal()} className="px-6 py-4 rounded-xl font-semibold border border-border bg-card/60 hover:bg-card transition">
            Comece a criar agora mesmo!
          </button>
          <button onClick={() => onOpenModal()} className="btn-gradient inline-flex items-center gap-2 px-6 py-4 rounded-xl font-semibold">
            Compre sua licença agora mesmo! <Zap className="h-4 w-4" />
          </button>
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

function Landing() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>();

  const openModal = (planName?: string) => {
    setSelectedPlan(planName);
    setIsModalOpen(true);
  };



  return (
    <main className="min-h-screen">
      <Nav onOpenModal={openModal} />
      <Hero onOpenModal={openModal} />
      <Pitch />
      <Comparison onOpenModal={openModal} />
      <Features />
      <StepByStep />
      <Pricing onOpenModal={openModal} />
      <FAQ />
      <FinalCTA onOpenModal={openModal} />
      <Footer />
      
      {isModalOpen && <RegisterModal onClose={() => setIsModalOpen(false)} planName={selectedPlan} />}
    </main>
  );
}

function RegisterModal({ onClose, planName }: { onClose: () => void, planName?: string }) {
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    setLoading(true);
    try {
      const plano = planoKey();
      if (plano === "diario") {
        window.location.href = "https://pay.cakto.com.br/tmtnfcw_926988";
        return;
      }
      if (plano === "mensal") {
        window.location.href = "https://pay.cakto.com.br/gswneg7_927010";
        return;
      }
      if (plano === "trimestral") {
        window.location.href = "https://pay.cakto.com.br/pyfdu57_927020";
        return;
      }
      if (plano === "anual") {
        window.location.href = "https://pay.cakto.com.br/eorwpqd_927027";
        return;
      }
      const res = await fetch("/api/public/criar-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.name,
          email: formData.email,
          telefone: formData.whatsapp,
          plano,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao iniciar pagamento");
      window.location.href = data.initPoint || data.sandboxInitPoint;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md card-glow rounded-[32px] p-8 animate-in zoom-in-95 fade-in duration-300 border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-[#0A0A0B]">
        <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors">
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src="https://api.freelovable.com.br/storage/v1/object/public/anexos/f858f905-cc9b-462b-acea-d3c81e795a87.jpg" 
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
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
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
            <span>Pagamento processado pelo Mercado Pago. Seus dados estão seguros.</span>
          </div>
        </form>
      </div>
    </div>
  );
}

