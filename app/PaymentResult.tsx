"use client";

import { useEffect, useState } from "react";

const PAYMENT_STATUS_URL =
  "https://dxqkzcyzlsnzhqlfybwu.supabase.co/functions/v1/mercadopago-payment-status-v2";

type ResultKind = "approved" | "pending" | "rejected";
type PaymentStatus = {
  success?: boolean;
  status?: string;
  approved?: boolean;
  paymentId?: string;
  value?: number;
  currency?: string;
  eventId?: string;
};

function readLocalFlag(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeLocalFlag(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Storage restrictions must not interrupt the confirmation screen.
  }
}

const content: Record<ResultKind, { eyebrow: string; title: string; description: string; icon: string }> = {
  approved: {
    eyebrow: "PAGAMENTO CONFIRMADO",
    title: "Seu acesso está a caminho.",
    description: "Pagamento aprovado. A licença, o link da extensão e as instruções serão enviados para o e-mail informado na compra.",
    icon: "✓",
  },
  pending: {
    eyebrow: "PAGAMENTO EM ANÁLISE",
    title: "Estamos aguardando a confirmação.",
    description: "Seu pagamento ainda está sendo processado. Esta página consultará automaticamente o status por alguns instantes.",
    icon: "⌛",
  },
  rejected: {
    eyebrow: "PAGAMENTO NÃO CONCLUÍDO",
    title: "Não foi possível aprovar o pagamento.",
    description: "Nenhuma cobrança aprovada foi identificada. Você pode voltar aos planos e tentar novamente com outra forma de pagamento.",
    icon: "×",
  },
};

export default function PaymentResult({ initialKind }: { initialKind: ResultKind }) {
  const [kind, setKind] = useState<ResultKind>(
    initialKind === "approved" ? "pending" : initialKind,
  );
  const [checking, setChecking] = useState(true);
  const [reference, setReference] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const externalReference = params.get("external_reference") || "";
    setReference(externalReference);
    if (!externalReference) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      attempts += 1;
      try {
        const query = new URLSearchParams();
        query.set("external_reference", externalReference);
        const response = await fetch(`${PAYMENT_STATUS_URL}?${query.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const data = await response.json().catch(() => null) as PaymentStatus | null;
        if (cancelled || !response.ok || !data?.success) {
          setChecking(false);
          return;
        }
        const status = String(data.status || "").toLowerCase();
        if (data.approved || status === "approved") {
          const paymentId = String(data.paymentId || "").trim();
          const eventId = String(data.eventId || "").trim();
          const value = Number(data.value);
          const currency = String(data.currency || "").trim();
          const expectedEventId = paymentId ? `mp_${paymentId}` : "";

          if (
            paymentId &&
            eventId === expectedEventId &&
            Number.isFinite(value) &&
            value > 0 &&
            currency
          ) {
            const localKey = `meta_purchase_sent_${eventId}`;
            if (!readLocalFlag(localKey)) {
              const fbq = (
                window as typeof window & {
                  fbq?: (...args: unknown[]) => void;
                }
              ).fbq;
              if (fbq) {
                fbq(
                  "track",
                  "Purchase",
                  { value, currency },
                  { eventID: eventId },
                );
                writeLocalFlag(localKey);
              }
            }
          }
          setKind("approved");
          setChecking(false);
          return;
        }
        if (["rejected", "cancelled", "refunded", "charged_back"].includes(status)) {
          setKind("rejected");
          setChecking(false);
          return;
        }
        setKind("pending");
        if (attempts < 6) timer = setTimeout(check, 5000);
        else setChecking(false);
      } catch {
        if (!cancelled) {
          console.error("payment confirmation failed");
          setChecking(false);
        }
      }
    };
    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const view = content[kind];
  return (
    <main className={`payment-result payment-${kind}`}>
      <div className="payment-aurora" />
      <section className="payment-result-card">
        <a className="payment-brand" href="/">
          <img src="/freelovable-logo-transparent.png" alt="" />
          <span><b>Free</b>Lovable</span>
        </a>
        <div className="payment-result-icon" aria-hidden="true">{view.icon}</div>
        <small>{view.eyebrow}</small>
        <h1>{view.title}</h1>
        <p>{view.description}</p>
        {checking && <div className="payment-checking"><i /> Verificando status do pagamento...</div>}
        {reference && <div className="payment-reference">Referência: <b>{reference}</b></div>}
        <a className="cta" href={kind === "rejected" ? "/#planos" : "/"}>
          {kind === "rejected" ? "VOLTAR AOS PLANOS" : "VOLTAR AO INÍCIO"} <span>→</span>
        </a>
        <em>O processamento e a confirmação são realizados pelo Mercado Pago.</em>
      </section>
    </main>
  );
}
