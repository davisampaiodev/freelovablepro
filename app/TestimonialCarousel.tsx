"use client";

import { useEffect, useRef, useState } from "react";

const testimonials = [
  ["Lucas M.", "Eu estava literalmente desistindo dos meus projetos porque os créditos acabavam toda hora. Depois que comecei a usar, consigo criar com liberdade.", "Desenvolvedor"],
  ["Ana P.", "O que mais me surpreendeu foi continuar usando meus projetos sem me preocupar. Foi uma das melhores decisões.", "Product Designer"],
  ["Rafael L.", "Eu sempre chegava naquele ponto em que queria testar mais uma coisa e os créditos acabavam. Agora simplesmente continuo.", "Programador"],
  ["Mariana C.", "Consigo validar mais rápido e não preciso mais esperar o dia seguinte. Minha produtividade mudou.", "UX Designer"],
  ["Gabriel C.", "Crio para clientes sem medo de parar no meio do processo. Simples, rápido e funciona.", "Freelancer"],
  ["Juliana A.", "Instalei em poucos minutos. Foi a solução mais prática que encontrei para continuar no Lovable.", "Empreendedora"],
] as const;

export function TestimonialCarousel() {
  const [activeReview, setActiveReview] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  function showReview(index: number) {
    setActiveReview((index + testimonials.length) % testimonials.length);
  }

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => showReview(activeReview + 1), 4500);
    return () => window.clearInterval(timer);
  }, [activeReview, paused]);

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null) return;
    const distance = event.changedTouches[0].clientX - startX;
    if (Math.abs(distance) < 45) return;
    showReview(activeReview + (distance < 0 ? 1 : -1));
  }

  const visibleReviews = [-1, 0, 1].map((offset) => ({
    position: offset === 0 ? "current" : offset < 0 ? "previous" : "next",
    index: (activeReview + offset + testimonials.length) % testimonials.length,
  }));

  return (
    <div className="testimonial-carousel" aria-roledescription="carrossel" aria-label="Depoimentos de usuários" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="review-grid" onTouchStart={(event) => { touchStartXRef.current = event.touches[0].clientX; setPaused(true); }} onTouchEnd={(event) => { handleTouchEnd(event); setPaused(false); }}>
        {visibleReviews.map(({ position, index: reviewIndex }) => {
          const [name, testimonial, role] = testimonials[reviewIndex];
          const isCurrent = position === "current";
          return (
            <article key={`${position}-${name}`} className={`review-card-${position}`} aria-hidden={!isCurrent || undefined} aria-label={isCurrent ? `${reviewIndex + 1} de ${testimonials.length}` : undefined}>
              <img className="review-portrait" src={`/testimonials/testimonial-${reviewIndex + 1}.jpg`} alt="" aria-hidden="true" />
              <div className="review-rating" aria-label="5 de 5 estrelas"><div className="stars" aria-hidden="true">{Array.from({ length: 5 }, (_, star) => <span key={star}>★</span>)}</div><span>5,0</span></div>
              <p>{testimonial}</p>
              <footer><img src={`/testimonials/testimonial-${reviewIndex + 1}.jpg`} alt={name} /><b>{name}<small>{role}</small></b><img className="review-brand-mark" src="/freelovable-logo-transparent.png" alt="FreeLovable" /></footer>
            </article>
          );
        })}
      </div>
      <button type="button" className="review-side-arrow review-side-arrow-previous" onClick={() => showReview(activeReview - 1)} aria-label="Depoimento anterior"><span aria-hidden="true" /></button>
      <button type="button" className="review-side-arrow review-side-arrow-next" onClick={() => showReview(activeReview + 1)} aria-label="Próximo depoimento"><span aria-hidden="true" /></button>
      <div className="review-controls"><div className="review-dots" aria-label="Selecionar depoimento">{testimonials.map((testimonial, index) => <button key={testimonial[0]} type="button" className={activeReview === index ? "active" : ""} onClick={() => showReview(index)} aria-label={`Ver depoimento ${index + 1}`} aria-current={activeReview === index ? "true" : undefined} />)}</div></div>
    </div>
  );
}
