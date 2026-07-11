import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Valida se um token está ativo (disponivel para o cliente final usar). */
export const validarToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().trim().min(4).max(200) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("tokens")
      .select("id, status, assinatura_id, usado_em")
      .eq("token", data.token)
      .maybeSingle();
    if (error) return { ativo: false, motivo: "erro" as const };
    if (!row) return { ativo: false, motivo: "nao_encontrado" as const };
    if (row.status !== "usado" || !row.assinatura_id) {
      return { ativo: false, motivo: "nao_atribuido" as const };
    }
    const { data: ass } = await supabaseAdmin
      .from("leads_checkout_br")
      .select("status_pagamento, plano")
      .eq("id", row.assinatura_id)
      .maybeSingle();
    if (
      !ass ||
      (ass.status_pagamento !== "aprovado" && ass.status_pagamento !== "concluida")
    ) {
      return { ativo: false, motivo: "assinatura_invalida" as const };
    }
    return { ativo: true, plano: ass.plano };
  });

/** Admin: listar tokens + leads do checkout BR */
export const adminListar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [tokens, assinaturas] = await Promise.all([
      supabaseAdmin
        .from("tokens")
        .select("id, token, status, plano, assinatura_id, criado_em, usado_em")
        .order("criado_em", { ascending: false })
        .limit(1000),
      supabaseAdmin
        .from("leads_checkout_br")
        .select("id, nome, email, plano, status_pagamento, criado_em")
        .order("criado_em", { ascending: false })
        .limit(200),
    ]);
    return {
      tokens: tokens.data ?? [],
      assinaturas: assinaturas.data ?? [],
    };
  });

const PLANO_VALUES = ["diario", "mensal", "trimestral", "anual"] as const;

/** Admin: adicionar tokens em lote para um plano específico */
export const adminAdicionarTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      plano: z.enum(PLANO_VALUES),
      tokens: z.array(z.string().trim().min(4).max(200)).min(1).max(500),
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = data.tokens.map((t) => ({
      token: t,
      plano: data.plano,
      status: "disponivel" as const,
    }));
    const { data: inserted, error } = await supabaseAdmin
      .from("tokens")
      .upsert(rows, { onConflict: "token", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(error.message);
    return { inseridos: inserted?.length ?? 0, enviados: data.tokens.length };
  });
/** Admin: reenviar email de token de uma assinatura aprovada */
export const adminReenviarEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ assinaturaId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: a, error } = await supabaseAdmin
      .from("leads_checkout_br")
      .select("nome, email, plano, status_pagamento")
      .eq("id", data.assinaturaId)
      .single();
    if (error || !a) throw new Error("Assinatura não encontrada");
    if (
      a.status_pagamento !== "aprovado" &&
      a.status_pagamento !== "concluida"
    ) {
      throw new Error("Assinatura ainda não aprovada ou sem token");
    }
    throw new Error("Reenvio de token desativado: entrega gerenciada pelo fornecedor");
  });


/** Admin: deletar token */
export const adminDeletarToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tokens").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Self: promove o usuário atual a admin (apenas se NÃO existir nenhum admin ainda). Bootstrap. */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      // Já existe admin — apenas devolve se o usuário atual é admin
      const { data } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();
      return { promoted: false, isAdmin: !!data };
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { promoted: true, isAdmin: true };
  });
