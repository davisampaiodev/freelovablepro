Set-Content -Path "src/routes/obrigado.tsx" -Encoding UTF8 -Value @'
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Pagamento confirmado — FreeLovable" },
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
          <strong className="text-foreground">token de acesso</strong> no email
          informado no checkout.
        </p>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6 text-left">
          <p className="text-sm text-amber-200 font-semibold mb-1">
            ⚠️ Não recebeu em até 5 minutos?
          </p>
          <p className="text-xs text-amber-100/80 leading-relaxed">
            Verifique sua caixa de <strong>spam</strong> ou{" "}
            <strong>lixo eletrônico</strong>. Alguns provedores (Outlook, Hotmail,
            Yahoo) costumam filtrar o email automaticamente.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-muted/10 p-4 mb-8 text-left">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Próximos passos
          </p>
          <ol className="text-sm space-y-1.5 list-decimal list-inside text-foreground/90">
            <li>Abra o email com o assunto "Seu token FreeLovable"</li>
            <li>Copie o token</li>
            <li>Cole na extensão FreeLovable e ative</li>
          </ol>
        </div>
        <Link
          to="/"
          className="btn-gradient inline-block px-8 py-3 rounded-xl font-bold uppercase tracking-wide text-sm"
        >
          Voltar para a página inicial
        </Link>
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-muted-foreground mb-3">
            Precisa de ajuda? Fale com nosso suporte:
          </p>
          
            href="https://wa.me/+5571983463684"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] transition-colors text-white font-semibold text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
            </svg>
            WhatsApp: (71) 98346-3684
          </a>
        </div>
      </div>
    </main>
  );
}
