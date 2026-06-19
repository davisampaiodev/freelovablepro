/**
 * Envio do email de entrega de token via Resend (Connector Gateway).
 *
 * Requer:
 *  - LOVABLE_API_KEY (auto-provisionado)
 *  - RESEND_API_KEY  (fornecido pelo connector Resend)
 *
 * Para usar um remetente do seu domínio (ex.: token@freelovableeproes.com),
 * verifique o domínio no painel do Resend e defina a env opcional EMAIL_FROM.
 * Sem isso, usamos onboarding@resend.dev (só envia para o email cadastrado
 * na conta Resend — útil em testes).
 */
type PlanoKey = "diario" | "mensal" | "trimestral" | "anual";

const TITULOS: Record<PlanoKey, string> = {
  diario: "diário",
  mensal: "mensal",
  trimestral: "trimestral",
  anual: "anual",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export async function sendTokenEmail(params: {
  nome: string;
  email: string;
  token: string;
  plano: PlanoKey;
  expiraEm: string;
}) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.EMAIL_FROM || "Freelovablees <onboarding@resend.dev>";

  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.warn("[email] Resend não configurado, logando token:", params.email, params.token);
    return;
  }

  const subject = `Seu token Freelovablees (${TITULOS[params.plano]}) está liberado 🎉`;
  const html = renderTokenEmailHtml(params);
  const text = renderTokenEmailText(params);

  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM,
        to: [params.email],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend falhou", res.status, body);
      console.log("[email] TOKEN para", params.email, ":", params.token);
      return;
    }

    const data = await res.json().catch(() => ({}));
    console.log("[email] enviado via Resend para", params.email, "id:", (data as { id?: string }).id);
  } catch (e) {
    console.error("[email] erro ao chamar Resend:", e);
    console.log("[email] TOKEN para", params.email, ":", params.token);
  }
}

function renderTokenEmailHtml(p: {
  nome: string;
  token: string;
  plano: PlanoKey;
  expiraEm: string;
}) {
  const nome = escapeHtml(p.nome);
  const token = escapeHtml(p.token);
  const plano = TITULOS[p.plano];
  const expira = new Date(p.expiraEm).toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const gradient =
    "linear-gradient(135deg,#f97316 0%,#ec4899 50%,#8b5cf6 100%)";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Seu token Freelovablees</title>
  </head>
  <body style="margin:0;padding:0;background:#07060d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e7e5f0">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">Seu token de acesso Freelovablees chegou — plano ${plano}.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07060d;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0e0c1a;border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden">
            <tr>
              <td style="background:${gradient};padding:28px 32px">
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.01em">Freelovablees</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.92);font-size:14px">Seu acesso foi liberado</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px">
                <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:700">Olá, ${nome}!</h2>
                <p style="margin:0 0 24px;color:#b8b4c9;font-size:15px;line-height:1.55">
                  Pagamento confirmado 🎉 Use o token abaixo para ativar a extensão Freelovablees.
                </p>

                <div style="background:#07060d;border:1px solid rgba(236,72,153,0.35);border-radius:14px;padding:20px;text-align:center;margin:0 0 24px">
                  <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b8b4c9;margin-bottom:10px">Seu token</div>
                  <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:20px;font-weight:700;color:#ffffff;word-break:break-all;letter-spacing:1px;background:${gradient};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">${token}</div>
                </div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
                  <tr>
                    <td style="padding:12px 16px;background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.25);border-radius:10px;color:#fdba74;font-size:13px;width:50%">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:0.8">Plano</div>
                      <div style="font-size:15px;font-weight:600;margin-top:4px;color:#ffffff;text-transform:capitalize">${plano}</div>
                    </td>
                    <td style="width:12px"></td>
                    <td style="padding:12px 16px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.25);border-radius:10px;color:#c4b5fd;font-size:13px;width:50%">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:0.8">Expira em</div>
                      <div style="font-size:15px;font-weight:600;margin-top:4px;color:#ffffff">${escapeHtml(expira)}</div>
                    </td>
                  </tr>
                </table>

                <h3 style="margin:24px 0 12px;color:#ffffff;font-size:15px;font-weight:700">Como ativar</h3>
                <ol style="margin:0 0 8px;padding-left:20px;color:#b8b4c9;font-size:14px;line-height:1.7">
                  <li>Abra a extensão <strong style="color:#fff">Freelovablees</strong> no seu navegador.</li>
                  <li>Clique em <strong style="color:#fff">Ativar com token</strong>.</li>
                  <li>Cole o token acima e confirme.</li>
                  <li>Pronto — créditos liberados até a data de expiração.</li>
                </ol>

                <p style="margin:28px 0 0;color:#7d7a8c;font-size:12px;line-height:1.6">
                  Não compartilhe seu token. Em caso de dúvida, responda este email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#07060d;border-top:1px solid rgba(255,255,255,0.06);text-align:center;color:#7d7a8c;font-size:11px">
                © ${new Date().getFullYear()} Freelovablees
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderTokenEmailText(p: {
  nome: string;
  token: string;
  plano: PlanoKey;
  expiraEm: string;
}) {
  const expira = new Date(p.expiraEm).toLocaleString("pt-BR");
  return [
    `Olá, ${p.nome}!`,
    ``,
    `Pagamento confirmado. Seu token Freelovablees:`,
    p.token,
    ``,
    `Plano: ${TITULOS[p.plano]}`,
    `Expira em: ${expira}`,
    ``,
    `Como ativar:`,
    `1. Abra a extensão Freelovablees.`,
    `2. Clique em "Ativar com token".`,
    `3. Cole o token e confirme.`,
    ``,
    `Não compartilhe seu token.`,
  ].join("\n");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
