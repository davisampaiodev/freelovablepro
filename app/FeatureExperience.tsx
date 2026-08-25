"use client";

import { useEffect, useRef, useState } from "react";
import TechIcon from "./TechIcon";

const tabs = [
  { icon: "infinity", title: "Créditos ilimitados", description: "Mande quantos prompts quiser, sem consumir créditos e crie o quanto quiser!" },
  { icon: "download", title: "Download de projetos", description: "Faça o download do código fonte dos seus projetos em um único zip com apenas um clique." },
  { icon: "shield", title: "Sem marca d’água", description: "Remova as tags da Lovable e dê um ar mais profissional ao seu projeto com um clique!" },
  { icon: "ai", title: "Melhore o prompt com I.A", description: "Descreva em poucas palavras o que você quer e a I.A detalha e melhora o seu prompt." },
];

export default function FeatureExperience() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.14 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={`feature-experience ${visible ? "is-visible" : ""}`} aria-labelledby="features-title">
      <div className="feature-experience-inner">
        <h2 id="features-title">
          Confira as funcionalidades<br /> exclusivas do{" "}
          <span className="feature-brand"><img className="feature-logo" src="/freelovable-logo-transparent.png" alt="" /><span className="feature-word"><b>Free</b>Lovable</span></span>
        </h2>
        <div className="feature-interactive">
          <div className="feature-tabs" role="tablist" aria-label="Funcionalidades do FreeLovable">
            {tabs.map((tab, index) => (
              <button
                key={tab.title}
                role="tab"
                aria-selected={active === index}
                aria-controls="feature-demo"
                tabIndex={active === index ? 0 : -1}
                className={active === index ? "selected" : ""}
                onClick={() => setActive(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowRight") setActive((index + 1) % tabs.length);
                  if (event.key === "ArrowUp" || event.key === "ArrowLeft") setActive((index + tabs.length - 1) % tabs.length);
                }}
              >
                <TechIcon type={tab.icon} />
                <span><strong>{tab.title}</strong><small>{tab.description}</small></span>
              </button>
            ))}
          </div>
          <div id="feature-demo" className="feature-demo-stage" role="tabpanel" key={active}>
            {active === 0 && <CreditsDemo />}
            {active === 1 && <DownloadDemo />}
            {active === 2 && <WatermarkDemo />}
            {active === 3 && <PromptDemo />}
          </div>
        </div>
      </div>
    </section>
  );
}

function MockupHeader({ title }: { title: string }) {
  return <header className="demo-header"><span className="window-dots"><i /><i /><i /></span><b>{title}</b><small>FREELOVABLE</small></header>;
}

function CreditsDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep(value => (value + 1) % 13), 1050);
    return () => window.clearInterval(timer);
  }, []);
  const unlimited = step >= 7;
  const success = step >= 11;
  const credits = Math.max(0, 5 - Math.min(step, 6) * .84);
  const logs = Array.from({ length: Math.min(step, 5) }, (_, i) => unlimited ? `Prompt ${i + 1} enviado · 0 créditos gastos` : `Prompt ${i + 1} enviado · 0,84 créditos gastos`);
  return (
    <div className={`demo-window credits-demo ${unlimited ? "unlimited" : ""}`}>
      <div className="lovable-demo-brand"><img src="/lovable-logo.jpg" alt="Lovable" /><span>Lovable</span></div>
      <MockupHeader title="Lovable" />
      <div className="demo-body">
        <div className={`mode-badge ${unlimited ? "on" : ""}`}>{unlimited ? "✓ Com FreeLovable" : "Sem FreeLovable"}</div>
        <p className="demo-label">Saldo de créditos</p>
        <div className={`credit-number ${credits <= 1.5 && !unlimited ? "low" : ""}`}>{unlimited ? "∞" : credits.toFixed(2)}</div>
        <div className="credit-track"><i style={{ width: unlimited ? "100%" : `${credits * 20}%` }} /></div>
        <div className="credit-history">
          <p>ATIVIDADE RECENTE</p>
          {logs.length ? logs.map((log, i) => <div className={unlimited ? "free-log" : ""} key={i}><span>{unlimited ? "✓" : "↗"}</span>{log}</div>) : <small>Aguardando o primeiro prompt...</small>}
        </div>
        {!unlimited && credits === 0 && <div className="credits-alert"><b>🔒 Geração bloqueada</b><span>Créditos esgotados</span></div>}
        {success && <div className="success-flash">✓ Você está criando sem limites!</div>}
      </div>
    </div>
  );
}

const projectFiles = [
  ["▾", "src", "folder"], ["⌁", "components", "folder"], ["⌘", "App.tsx", "code"],
  ["{ }", "package.json", "json"], ["▧", "hero-image.png", "image"], ["≡", "README.md", "text"],
];

function DownloadDemo() {
  const [progress, setProgress] = useState(0);
  const running = progress > 0 && progress < 100;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setProgress(value => Math.min(100, value + 8)), 160);
    return () => window.clearInterval(timer);
  }, [running]);
  return (
    <div className="demo-window download-demo">
      <MockupHeader title="Explorador de Projeto" />
      <div className="demo-body">
        <div className="project-name"><span>◫</span><div><b>landing-freelovable</b><small>Projeto completo · 6 arquivos</small></div></div>
        <div className="file-list">{projectFiles.map(([icon, name, type], i) => <div className={progress > i * 16 ? "processed" : ""} key={name}><span className={type}>{icon}</span><b>{name}</b><small>{progress > i * 16 ? "✓" : i < 2 ? "pasta" : "arquivo"}</small></div>)}</div>
        {progress === 0 && <button className="demo-primary" onClick={() => setProgress(1)}>⇩ Baixar Projeto Completo</button>}
        {running && <div className="progress-panel"><div><span>Processando {projectFiles[Math.min(projectFiles.length - 1, Math.floor(progress / 18))][1]}</span><b>{progress}%</b></div><i><span style={{ width: `${progress}%` }} /></i></div>}
        {progress === 100 && <div className="download-ready"><strong>✓</strong><h3>Download Pronto!</h3><p>projeto-lovable.zip • 1.4 MB</p><button onClick={() => setProgress(0)}>↻ Resetar Simulador</button></div>}
      </div>
    </div>
  );
}

function WatermarkDemo() {
  const [clean, setClean] = useState(false);
  return (
    <div className={`demo-window watermark-demo ${clean ? "clean" : ""}`}>
      <MockupHeader title="Preview em Tempo Real" />
      <div className="demo-body">
        <div className="site-preview">
          <nav><b>Nova</b><span>Produto &nbsp; Sobre &nbsp; Contato</span></nav>
          <div className="preview-content"><small>CONSTRUA ALGO INCRÍVEL</small><h3>Ideias que ganham<br /><em>vida.</em></h3><p>Uma experiência digital simples, rápida e bonita.</p><button>Começar agora →</button></div>
          <div className="preview-cards"><i /><i /><i /></div>
          <div className="lovable-badge">♥ Built with Lovable</div>
          {clean && <div className="clean-scan" />}
        </div>
        <div className="toggle-row"><div><small>CONTROLE DE MARCA</small><b>Remoção de Badge</b></div><button role="switch" aria-checked={clean} onClick={() => setClean(!clean)}><i /></button></div>
        <div className="clean-status"><span className={!clean ? "active" : ""}>● Original</span><span className={clean ? "active" : ""}>● {clean ? "Marca Removida" : "Clean UI"}</span></div>
      </div>
    </div>
  );
}

const improvedPrompt = "Adicione um botão CTA primário com label ‘Começar agora’, estilo pill, background com gradient roxo→pink, ícone de seta à direita, animação de hover com leve escala e sombra, alinhado ao centro da seção hero.";

function PromptDemo() {
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("adicionar botão");
  useEffect(() => {
    if (!typing) return;
    setText("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 2;
      setText(improvedPrompt.slice(0, index));
      if (index >= improvedPrompt.length) window.clearInterval(timer);
    }, 22);
    return () => window.clearInterval(timer);
  }, [typing]);
  const done = typing && text.length >= improvedPrompt.length;
  return (
    <div className={`demo-window prompt-demo ${typing ? "enhanced" : ""}`}>
      <MockupHeader title="Prompt Enhancer" />
      <div className="demo-body">
        <div className="prompt-toolbar"><span>EDITOR DE PROMPT</span>{typing && <div><b>✦ Otimizado por IA</b><em>Turbo</em></div>}</div>
        <div className="prompt-editor"><span>{text}</span>{typing && !done && <i />}</div>
        <div className="prompt-stats"><span><b>Clareza</b><i><em style={{ width: typing ? "94%" : "28%" }} /></i></span><span><b>Detalhes</b><i><em style={{ width: typing ? "91%" : "18%" }} /></i></span><span><b>Contexto</b><i><em style={{ width: typing ? "97%" : "22%" }} /></i></span></div>
        <button className="demo-primary" onClick={() => { setTyping(!typing); if (typing) setText("adicionar botão"); }}>{typing ? "↻ Voltar ao prompt original" : "✦ Aprimorar com Inteligência Artificial"}</button>
      </div>
    </div>
  );
}
