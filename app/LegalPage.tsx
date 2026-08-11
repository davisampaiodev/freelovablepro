import Link from "next/link";

type Section = {
  title: string;
  paragraphs?: React.ReactNode[];
  items?: React.ReactNode[];
};

export default function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: Section[];
}) {
  return (
    <main className="legal-page">
      <div className="legal-aurora" aria-hidden="true" />
      <header className="legal-header">
        <Link className="legal-brand" href="/" aria-label="FreeLovable — página inicial">
          <img src="/freelovable-logo-transparent.png" alt="" />
          <span><b>Free</b>Lovable</span>
        </Link>
        <Link className="legal-back" href="/">← Voltar ao site</Link>
      </header>

      <article className="legal-document">
        <div className="legal-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="legal-intro">{intro}</p>
        <p className="legal-updated">Última atualização: {updatedAt}</p>

        <div className="legal-sections">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2>{index + 1}. {section.title}</h2>
              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
              {section.items && (
                <ul>
                  {section.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>

      <footer className="legal-footer">
        <span>© 2026 FreeLovable. Todos os direitos reservados.</span>
        <nav aria-label="Documentos legais">
          <Link href="/politica-de-privacidade">Política de Privacidade</Link>
          <Link href="/termos-de-servico">Termos de Serviço</Link>
        </nav>
      </footer>
    </main>
  );
}
