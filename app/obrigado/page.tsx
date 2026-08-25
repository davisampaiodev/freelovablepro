import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Obrigado pela compra | FreeLovable",
  description: "Obrigado por comprar com a FreeLovable.",
};

const whatsappUrl =
  "https://wa.me/5571992462593?text=" +
  encodeURIComponent("Olá! Fiz uma compra e preciso de suporte.");

export default function Obrigado() {
  return (
    <main className="payment-result payment-approved">
      <div className="payment-aurora" />
      <section className="payment-result-card">
        <header className="thank-you-header">
          <a className="payment-brand thank-you-brand" href="/" aria-label="FreeLovable">
            <img src="/freelovable-logo-transparent.png" alt="" />
            <span><b>Free</b>Lovable</span>
          </a>
          <div className="thank-you-confirmation">
            <span className="thank-you-confirmation-icon" aria-hidden="true">✓</span>
            <span>Compra confirmada</span>
          </div>
        </header>

        <div className="thank-you-title-block">
          <span className="thank-you-eyebrow">BEM-VINDO À FREElOVABLE</span>
          <h1>Obrigado pela sua <em>compra.</em></h1>
          <p className="thank-you-lead">
            Seu pagamento foi confirmado com sucesso. Agora vamos cuidar dos
            próximos passos para você.
          </p>
        </div>

        <div className="thank-you-token-notice" role="status">
          <span className="thank-you-notice-mark" aria-hidden="true">↗</span>
          <div>
            <strong>Atualização de entrega</strong>
            <p>
              Estamos enfrentando uma instabilidade temporária na entrega dos
              tokens. Nosso suporte pode te orientar agora.
            </p>
          </div>
        </div>

        <a
          className="thank-you-whatsapp"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="thank-you-whatsapp-copy">
            <strong>Falar com nosso suporte</strong>
            <small>WhatsApp · Atendimento prioritário</small>
          </span>
          <span className="thank-you-whatsapp-arrow" aria-hidden="true">→</span>
        </a>
        <p className="thank-you-assistance">Clique no botão e envie a mensagem já preenchida.</p>
      </section>
    </main>
  );
}
