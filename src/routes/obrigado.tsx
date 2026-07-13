import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Pagamento confirmado — FreeLovable" },
      {
        name: "description",
        content:
          "Seu pagamento foi recebido. Fale com nosso suporte para receber seu token de acesso.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ObrigadoPage,
});

function ObrigadoPage() {
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
          Seu pagamento foi confirmado. Consulte o aviso abaixo para receber
          seu <strong className="text-foreground">token de acesso</strong>.
        </p>

        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 mb-6 text-left">
          <p className="text-base text-amber-200 font-bold mb-2">
            ⚠️ Aviso importante sobre seu token
          </p>

          <p className="text-sm text-amber-100/85 leading-relaxed">
            Estamos enfrentando um problema temporário na entrega automática
            dos tokens. Para receber seu acesso, envie uma mensagem ao nosso
            suporte pelo WhatsApp e informe o e-mail usado na compra.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-muted/10 p-4 mb-8 text-left">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Próximos passos
          </p>

          <ol className="text-sm space-y-1.5 list-decimal list-inside text-foreground/90">
            <li>Clique em "Falar com o suporte" abaixo</li>
            <li>Informe o e-mail utilizado na compra</li>
            <li>Nosso suporte enviará seu token de acesso</li>
          </ol>
        </div>

        <a
          href="https://wa.me/5571983463684"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1ebe57]"
        >
          <MessageCircle className="h-5 w-5" />
          Falar com o suporte e receber meu token
        </a>

        <Link
          to="/"
          className="mt-4 inline-block rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
