"use client";

import { useState } from "react";

const Gradient = ({ children }: { children: React.ReactNode }) => (
  <span className="gradient-text">{children}</span>
);

const Arrow = () => <div className="section-arrow" aria-hidden="true">↕</div>;

const Button = ({ children, href = "#planos", secondary = false }: { children: React.ReactNode; href?: string; secondary?: boolean }) => (
  <a href={href} className={`cta ${secondary ? "cta-secondary" : ""}`}>{children}<span>→</span></a>
);

const FeatureIcon = ({ children }: { children: React.ReactNode }) => <span className="feature-icon">{children}</span>;

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <main>
      <section className="hero">
        <div className="aurora aurora-one" />
        <div className="container hero-content">
          <div className="eyebrow"><span /> O NOVO JEITO DE CRIAR — AGORA É ILIMITADO</div>
          <h1>Nunca mais fique sem<br/><Gradient>créditos no Lovable.</Gradient></h1>
          <p>Instale em menos de 1 minuto e continue criando apps, automações e<br className="desktop"/> projetos sem interrupções. Fluxo no bloqueio.</p>
          <div className="social-proof"><span className="stars">★★★★★</span> +27.539 PESSOAS CRIANDO</div>
          <Button>VER COMO FUNCIONA</Button>
          <div className="avatars"><span>👩🏻</span><span>👨🏽</span><span>👩🏾</span><span>👨🏻</span><b>+ 27.539 usuários ativos</b></div>
          <button className={`video-phone ${playing ? "playing" : ""}`} onClick={() => setPlaying(!playing)} aria-label="Reproduzir vídeo de apresentação">
            <span className="phone-notch"/>
            <span className="play">{playing ? "Ⅱ" : "▶"}</span>
            {playing && <span className="video-copy">Crie sem<br/><b>limites.</b></span>}
          </button>
        </div>
      </section>

      <Arrow />

      <section className="container comparison glow-card">
        <div className="eyebrow blue">⚡ A VERDADE QUE NINGUÉM TE CONTA</div>
        <h2>O Lovable é uma ferramenta incrível para tirar projetos<br/> do papel. <span>O problema é que os créditos acabam<br/> rápido</span> e os planos para continuar criando são caros demais.</h2>
        <div className="price-panel">
          <div><small>PLANO PRO</small><strong>US$ 25<em>/mês</em></strong><span>≈ R$ 140 por mês</span></div>
          <div><small>PLANO BUSINESS</small><strong className="pink">R$ 127,77<em>/mês</em></strong><span>+ taxas internacionais</span></div>
        </div>
        <div className="tiny-divider">✦</div>
        <h3>Com a <Gradient>FreeLovable</Gradient>, você continua criando sem se<br/> preocupar com créditos.</h3>
        <div className="price-panel free-panel">
          <div><small>♾️ CRÉDITOS INFINITOS</small><strong className="pink">R$ 47<em>/mês</em></strong><span>Use à vontade</span></div>
          <div className="benefits"><small>ECONOMIA REAL</small><b>Sem limites diários</b><b>Sem surpresas</b><i /></div>
        </div>
      </section>

      <section className="container about glow-card split">
        <div>
          <div className="eyebrow blue">O FUTURO É PARA CRIADORES</div>
          <h2>O que é o <Gradient>FreeLovable?</Gradient></h2>
          <p><b>FreeLovable é uma extensão para Chrome que libera créditos ilimitados do Lovable</b> durante o período do seu plano, para você continuar criando sem créditos limitados e sem interromper seus projetos.</p>
        </div>
        <div className="steps-window">
          <div className="window-top"><i/><i/><i/><small>NO PAINEL</small></div>
          {[['✦','Instale a extensão','Adicione ao Chrome em poucos segundos.'],['⚡','Ative com seu token','Seu acesso fica pronto imediatamente.'],['🚀','Entre sem preocupações','Crie quantos projetos quiser.'],['💜','Continue criando com créditos infinitos','Sem bloqueios no meio do processo.']].map((x,i)=><div className="step" key={i}><FeatureIcon>{x[0]}</FeatureIcon><span><b>{x[1]}</b><small>{x[2]}</small></span><em>{i<3?'↓':'✓'}</em></div>)}
        </div>
        <div className="full-cta"><Button>COMECE AGORA</Button></div>
      </section>

      <section className="container features">
        <h2>Confira as funcionalidades<br/> exclusivas do<br/><Gradient>✦ FreeLovable</Gradient></h2>
        <div className="feature-showcase">
          <div className="feature-list">
            {['Créditos ilimitados','Quantidade de projetos','Sem risco de bloqueio','Melhora especial com I.A.'].map((x,i)=><div key={x} className={i===0?'active':''}><FeatureIcon>{['♾','▦','◉','✦'][i]}</FeatureIcon><span><b>{x}</b><small>{i===0?'Crie à vontade durante seu plano':'Liberdade para produzir sem pausas'}</small></span></div>)}
          </div>
          <div className="lovable-ui"><header><b>Lovable</b><small>Conta conectada</small></header><div className="balance">5.00</div><div className="yellow-line"/><p>Seus créditos</p>{[85,64,72,55].map((w,i)=><div className="bar" key={i}><i/><span style={{width:`${w}%`}}/></div>)}<button>Gerenciar projetos</button></div>
        </div>
      </section>

      <Arrow />

      <section className="container access glow-card split">
        <div><div className="eyebrow blue">⚡ SIMPLES DE USAR</div><h2>Como recebo meu<br/><Gradient>token de acesso?</Gradient></h2><p>Assim que o pagamento for aprovado, você recebe um token para instalar e ativar a extensão rápido e sem esforço.</p><div className="mini-steps"><span><b>1</b> RECEBA SEU TOKEN</span><span><b>2</b> INSTALE NO CHROME</span><span><b>3</b> ATIVE E USE</span></div></div>
        <div className="access-ui"><div className="access-card"><FeatureIcon>🛡</FeatureIcon><span><small>SEU ACESSO</small><b>Seu acesso FreeLovable chegou</b></span></div><div className="access-card"><FeatureIcon>✓</FeatureIcon><span><small>ACESSO LIBERADO COM SUCESSO</small><b>Instalação segura · Ativação imediata</b></span></div></div>
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
        ].map(([n,t,r])=><article key={n}><div className="stars">★★★★★</div><p>{t}</p><footer><span>{n[0]}</span><b>{n}<small>{r}</small></b><em>✓</em></footer></article>)}</div>
        <div className="metrics"><div><FeatureIcon>👥</FeatureIcon><strong>+ 27.539</strong><small>USUÁRIOS ATIVOS</small></div><div><FeatureIcon>▣</FeatureIcon><strong>+12 mil</strong><small>PROJETOS CRIADOS</small></div><div><FeatureIcon>◉</FeatureIcon><strong>97%</strong><small>SATISFAÇÃO</small></div></div>
      </section>

      <Arrow />

      <section id="planos" className="container pricing"><h2>Escolha seu acesso aos créditos infinitos:</h2><p>Todos os planos liberam a mesma experiência completa; escolha o período ideal para continuar criando.</p>
        <div className="plans">
          <Plan title="Plano Mensal" price="R$ 47" note="por mês" button="QUERO O PLANO MENSAL" />
          <Plan title="Plano Trimestral" price="3x de R$ 37" note="R$ 111 à vista" button="QUERO O PLANO TRIMESTRAL" />
          <article className="gift"><div className="ribbon">MAIS VANTAJOSO</div><div className="gift-icon">🎁</div><h3>Um presente especial para você</h3><p>Leve o melhor plano com condições exclusivas e bônus liberados.</p><Button>QUERO ACESSO AGORA</Button></article>
        </div>
        <div className="guarantee"><span>✓</span><div><h3>Teste por 7 dias com garantia total</h3><p>Você pode testar o acesso e, se não gostar, pedir reembolso. Seu risco é zero.</p></div></div>
      </section>

      <section className="container faq"><h2>Perguntas frequentes</h2>{faqs.map(([q,a],i)=><div className={`faq-item ${openFaq===i?'open':''}`} key={q}><button onClick={()=>setOpenFaq(openFaq===i?null:i)} aria-expanded={openFaq===i}><span>{q}</span><b>{openFaq===i?'−':'+'}</b></button><p>{a}</p></div>)}</section>

      <section className="final-cta"><div className="container"><h2>Pronto para usar<br/><Gradient>créditos infinitos no Lovable?</Gradient></h2><p>Aproveite enquanto o preço ainda não foi reajustado e continue criando sem interrupções.</p><Button href="#planos">QUERO MEU ACESSO</Button><div className="safe">✓ Instalação segura &nbsp;&nbsp; ✓ Acesso imediato &nbsp;&nbsp; ✓ 7 dias de garantia</div></div></section>
      <footer className="site-footer"><div className="container"><span><b>✦</b> FreeLovable</span><small>© 2026 FreeLovable. Todos os direitos reservados.</small></div></footer>
    </main>
  );
}

function Plan({title,price,note,button}:{title:string;price:string;note:string;button:string}){
  return <article className="plan"><h3>{title}</h3><small>CRÉDITOS INFINITOS</small><strong>{price}</strong><em>{note}</em><ul><li>Créditos ilimitados</li><li>Suporte prioritário</li><li>Ativação fácil</li><li>Sem fidelidade</li></ul><Button secondary>{button}</Button></article>
}
