import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acesso enviado | FreeLovable",
  description: "Sua compra foi confirmada e seu acesso foi enviado por e-mail.",
};

const whatsappUrl =
  "https://wa.me/5571983463684?text=" +
  encodeURIComponent("Olá! Fiz uma compra, verifiquei minha caixa de entrada e o spam, mas ainda não encontrei meu acesso.");

export default function Obrigado() {
  return (
    <main className="payment-result payment-approved thank-you-page">
      <div className="payment-aurora" />
      <section className="payment-result-card thank-you-card">
        <header className="thank-you-header">
          <a className="payment-brand thank-you-brand" href="/" aria-label="FreeLovable — início">
            <img src="/freelovable-logo-transparent.png" alt="" />
            <span><b>Free</b>Lovable</span>
          </a>
          <div className="thank-you-confirmation">
            <span className="thank-you-confirmation-icon" aria-hidden="true">✓</span>
            <span>Compra confirmada</span>
          </div>
        </header>

        <div className="thank-you-title-block">
          <span className="thank-you-eyebrow">TUDO CERTO COM SEU PEDIDO</span>
          <h1>Seu acesso já está no <em>seu e-mail.</em></h1>
          <p className="thank-you-lead">
            Enviamos o link da extensão, seu token de acesso e as instruções de
            ativação para o e-mail informado na compra.
          </p>
        </div>

        <div className="thank-you-email-card" role="status">
          <div className="thank-you-email-icon" aria-hidden="true">✉</div>
          <div className="thank-you-email-copy">
            <span className="thank-you-email-label">PRÓXIMO PASSO</span>
            <strong>Verifique sua caixa de entrada</strong>
            <p>Procure por um e-mail da <b>FreeLovable</b> com os dados do seu acesso.</p>
          </div>
          <span className="thank-you-sent-badge">Enviado</span>
        </div>

        <div className="thank-you-spam-alert">
          <span className="thank-you-spam-icon" aria-hidden="true">!</span>
          <div>
            <strong>Importante: verifique também a caixa de Spam</strong>
            <p>
              Se não encontrar o e-mail na entrada, confira as pastas <b>Spam</b>,
              <b> Lixo eletrônico</b> ou <b>Promoções</b>. Ele pode ter sido direcionado
              automaticamente para uma delas.
            </p>
          </div>
        </div>

        <div className="thank-you-checklist" aria-label="Como localizar seu acesso">
          <span><i>1</i> Abra o e-mail usado na compra</span>
          <span><i>2</i> Busque por “FreeLovable”</span>
          <span><i>3</i> Confira Spam e Promoções</span>
        </div>

        <div className="thank-you-help">
          <p>Já verificou todas as pastas e não encontrou?</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <img className="thank-you-whatsapp-logo" src="/whatsapp-logo.png" alt="" />
            <span>Falar com o suporte</span>
            <span className="thank-you-help-arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  );
}
