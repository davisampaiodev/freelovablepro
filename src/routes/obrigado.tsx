import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Pagamento confirmado — Freelovablees" },
      {
        name: "description",
        content:
          "Seu pagamento foi recebido. Em instantes você receberá seu token de acesso por email.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ObrigadoPage,
});

function ObrigadoPage() {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Purchase", {
        value: 0,
        currency: "BRL",
      });
    }
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full card-glow rounded-3xl p-8 sm:p-10 border border-white/10 bg-[#0A0A0B] text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 via-pink-500 to-violet-500 flex items-center justify-center text-3xl">
          ✓
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient mb-3">
          Pagamento confirmado!
        </h1>

        <p className="text-base text-muted-foreground mb-6 leading-relaxed">
          Obrigado pela sua compra 🎉
          <br />
          Em alguns instantes você receberá seu{" "}
          <strong className="text-foreground">
            token de acesso
          </strong>{" "}
          no email informado no checkout.
        </p>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6 text-left">
          <p className="text-sm text-amber-200 font-semibold mb-1">
            ⚠️ Não recebeu em até 5 minutos?
          </p>

          <p className="text-xs text-amber-100/80 leading-relaxed">
            Verifique sua caixa de <strong>spam</strong> ou{" "}
            <strong>lixo eletrônico</strong>. Alguns provedores
            (Outlook, Hotmail, Yahoo) costumam filtrar o email
            automaticamente.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-muted/10 p-4 mb-8 text-left">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Próximos passos
          </p>

          <ol className="text-sm space-y-1.5 list-decimal list-inside text-foreground/90">
            <li>Abra o email com o assunto "Seu token Freelovablees"</li>
            <li>Copie o token</li>
            <li>Cole na extensão Freelovablees e ative</li>
          </ol>
        </div>

        <Link
          to="/"
          className="btn-gradient inline-block px-8 py-3 rounded-xl font-bold uppercase tracking-wide text-sm"
        >
          Voltar para a página inicial
        </Link>

        <p className="text-xs text-muted-foreground mt-6 mb-3">
          Precisa de ajuda? Fale com nosso suporte:
        </p>

        <a
          href="https://wa.me/5571983463684"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] transition-colors text-white font-semibold text-sm"
        >
          WhatsApp: (71) 98346-3684
        </a>
      </div>
    </main>
  );
}
