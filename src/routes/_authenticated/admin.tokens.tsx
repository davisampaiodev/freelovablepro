import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminListar,
  adminAdicionarTokens,
  adminDeletarToken,
  adminReenviarEmail,
  bootstrapAdmin,
} from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/tokens")({
  head: () => ({ meta: [{ title: "Admin — Tokens" }] }),
  component: AdminTokensPage,
});

const PLANOS = ["diario", "mensal", "trimestral", "anual"] as const;
type Plano = (typeof PLANOS)[number];

const PLANO_LABEL: Record<Plano, string> = {
  diario: "Diário",
  mensal: "Mensal",
  trimestral: "Trimestral",
  anual: "Anual",
};

function AdminTokensPage() {
  const navigate = useNavigate();
  const listar = useServerFn(adminListar);
  const adicionar = useServerFn(adminAdicionarTokens);
  const deletar = useServerFn(adminDeletarToken);
  const reenviar = useServerFn(adminReenviarEmail);
  const bootstrap = useServerFn(bootstrapAdmin);
  const qc = useQueryClient();

  const [bulkByPlano, setBulkByPlano] = useState<Record<Plano, string>>({
    diario: "",
    mensal: "",
    trimestral: "",
    anual: "",
  });
  const [lastMsg, setLastMsg] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const q = useQuery({
    queryKey: ["admin-tokens"],
    queryFn: async () => {
      try {
        return await listar();
      } catch (e) {
        if (e instanceof Error && /forbidden/i.test(e.message)) {
          setForbidden(true);
          return { tokens: [], assinaturas: [] };
        }
        throw e;
      }
    },
  });

  const addMut = useMutation({
    mutationFn: async (vars: { plano: Plano; tokens: string[] }) =>
      adicionar({ data: vars }),
    onSuccess: (res, vars) => {
      setBulkByPlano((b) => ({ ...b, [vars.plano]: "" }));
      setLastMsg(
        `${PLANO_LABEL[vars.plano]}: ${res.inseridos} de ${res.enviados} inseridos (duplicados ignorados).`,
      );
      qc.invalidateQueries({ queryKey: ["admin-tokens"] });
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => deletar({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tokens"] }),
  });

  const resendMut = useMutation({
    mutationFn: async (assinaturaId: string) =>
      reenviar({ data: { assinaturaId } }),
    onSuccess: () => setLastMsg("Email reenviado com sucesso."),
    onError: (e) => setLastMsg(`Falha ao reenviar: ${(e as Error).message}`),
  });

  async function handleBootstrap() {
    const r = await bootstrap();
    if (r.isAdmin) {
      setForbidden(false);
      qc.invalidateQueries({ queryKey: ["admin-tokens"] });
    } else {
      alert("Já existe um admin no sistema. Peça acesso ao administrador atual.");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (forbidden) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full card-glow rounded-3xl p-8 border border-white/10 bg-[#0A0A0B] text-center">
          <h1 className="text-xl font-bold mb-2">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sua conta não é admin. Se for o primeiro acesso, promova-se a admin
            (disponível enquanto não houver nenhum admin no sistema).
          </p>
          <button
            onClick={handleBootstrap}
            className="btn-gradient w-full py-3 rounded-xl font-bold uppercase tracking-wide"
          >
            Tornar-me admin
          </button>
          <button
            onClick={logout}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </main>
    );
  }

  const tokens = q.data?.tokens ?? [];
  const assinaturas = q.data?.assinaturas ?? [];

  // Stats por plano
  const statsPorPlano = PLANOS.map((p) => {
    const list = tokens.filter((t) => t.plano === p);
    return {
      plano: p,
      disponiveis: list.filter((t) => t.status === "disponivel").length,
      usados: list.filter((t) => t.status === "usado").length,
    };
  });
  const semPlano = tokens.filter((t) => !t.plano);

  const ativas = assinaturas.filter(
    (a) =>
      a.status === "aprovado" &&
      (!a.expira_em || new Date(a.expira_em) > new Date()),
  );

  function submitBulk(plano: Plano) {
    const list = bulkByPlano[plano]
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) return;
    addMut.mutate({ plano, tokens: list });
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">
              Tokens por plano e assinaturas ativas
            </p>
          </div>
          <button
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Sair
          </button>
        </header>

        {/* Estatísticas por plano */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statsPorPlano.map((s) => (
            <div
              key={s.plano}
              className="card-glow rounded-2xl p-5 border border-white/10 bg-[#0A0A0B]"
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {PLANO_LABEL[s.plano]}
              </div>
              <div className="mt-2 text-3xl font-bold text-gradient">
                {s.disponiveis}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                disponíveis · {s.usados} usados
              </div>
            </div>
          ))}
        </section>

        {semPlano.length > 0 && (
          <p className="text-xs text-amber-400/80 mb-6">
            {semPlano.length} token(s) legados sem plano definido — serão usados
            como fallback para qualquer plano.
          </p>
        )}

        {/* Adicionar tokens por plano */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {PLANOS.map((p) => (
            <div
              key={p}
              className="card-glow rounded-2xl p-6 border border-white/10 bg-[#0A0A0B]"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold">Adicionar — {PLANO_LABEL[p]}</h2>
                <span className="text-xs text-muted-foreground">
                  {statsPorPlano.find((s) => s.plano === p)?.disponiveis ?? 0} disp.
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Um por linha ou separados por vírgula.
              </p>
              <textarea
                value={bulkByPlano[p]}
                onChange={(e) =>
                  setBulkByPlano((b) => ({ ...b, [p]: e.target.value }))
                }
                rows={5}
                className="w-full bg-muted/20 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:border-brand-pink/50"
                placeholder={`TOKEN-${p.toUpperCase()}-1\nTOKEN-${p.toUpperCase()}-2`}
              />
              <button
                onClick={() => submitBulk(p)}
                disabled={addMut.isPending}
                className="btn-gradient mt-3 px-6 py-2.5 rounded-xl font-bold uppercase text-sm disabled:opacity-60"
              >
                {addMut.isPending ? "Salvando..." : `Adicionar ao ${PLANO_LABEL[p]}`}
              </button>
            </div>
          ))}
        </section>

        {lastMsg && (
          <p className="text-xs text-success mb-6">{lastMsg}</p>
        )}

        {/* Tokens */}
        <section className="card-glow rounded-2xl p-6 border border-white/10 bg-[#0A0A0B] mb-8 overflow-x-auto">
          <h2 className="font-bold mb-4">Tokens ({tokens.length})</h2>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-white/10">
              <tr>
                <th className="text-left py-2">Token</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Usado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id} className="border-b border-white/5">
                  <td className="py-2 font-mono text-xs">{t.token}</td>
                  <td className="text-center text-xs">
                    {t.plano ? PLANO_LABEL[t.plano as Plano] : "—"}
                  </td>
                  <td className="text-center">
                    <span
                      className={
                        t.status === "disponivel"
                          ? "text-success"
                          : "text-muted-foreground"
                      }
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="text-center text-xs text-muted-foreground">
                    {t.usado_em
                      ? new Date(t.usado_em).toLocaleString("pt-BR")
                      : "—"}
                  </td>
                  <td className="text-right">
                    {t.status === "disponivel" && (
                      <button
                        onClick={() => delMut.mutate(t.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!tokens.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                    Nenhum token cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Assinaturas ativas */}
        <section className="card-glow rounded-2xl p-6 border border-white/10 bg-[#0A0A0B] overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Assinaturas ativas ({ativas.length})</h2>
            <span className="text-xs text-muted-foreground">
              total: {assinaturas.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-white/10">
              <tr>
                <th className="text-left py-2">Cliente</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Token</th>
                <th>Expira</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ativas.map((a) => (
                <tr key={a.id} className="border-b border-white/5">
                  <td className="py-2">
                    <div>{a.nome}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="text-center">{PLANO_LABEL[a.plano as Plano] ?? a.plano}</td>
                  <td className="text-center">
                    <span className="text-success">{a.status}</span>
                  </td>
                  <td className="text-center font-mono text-xs">
                    {a.token_valor ?? "—"}
                  </td>
                  <td className="text-center text-xs text-muted-foreground">
                    {a.expira_em
                      ? new Date(a.expira_em).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => resendMut.mutate(a.id)}
                      disabled={resendMut.isPending}
                      className="text-xs text-brand-pink hover:underline disabled:opacity-50"
                    >
                      {resendMut.isPending ? "Enviando..." : "Reenviar email"}
                    </button>
                  </td>
                </tr>
              ))}
              {!ativas.length && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">
                    Nenhuma assinatura ativa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
