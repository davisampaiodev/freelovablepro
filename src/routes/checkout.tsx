import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Copy, CreditCard, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import {
  FREELOVABLE_PLANS,
  isFreelovablePlanId,
  type FreelovablePlanId,
} from "@/lib/freelovable-plans";

const SearchSchema = z.object({
  lead_id: z.string().uuid().optional().catch(undefined),
  plano: z.enum(["diario", "mensal", "trimestral", "anual"]).optional().catch(undefined),
});

const MERCADO_PAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY?.trim() ?? "";
let initializedPublicKey = "";

type CheckoutData = {
  lead_id: string;
  nome: string;
  email: string;
  telefone_mascarado: string;
  plano: FreelovablePlanId;
  nome_plano: string;
  valor: number;
};

type CardPaymentFormData = {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  installments: number;
  payer: {
    email?: string;
    identification?: { type: string; number: string };
  };
};

type PaymentStatus =
  "approved" | "pending" | "in_process" | "rejected" | "cancelled" | "refunded" | "charged_back";

type PaymentResponse = {
  success: true;
  payment: {
    id: string;
    status: PaymentStatus;
    status_detail?: string;
    qr_code?: string;
    qr_code_base64?: string;
  };
};

type PaymentType = "pix" | "credit_card";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const Route = createFileRoute("/checkout")({
  validateSearch: SearchSchema,
  head: () => ({
    meta: [
      { title: "Checkout seguro | FreeLovable" },
      { name: "description", content: "Finalize seu pedido FreeLovable com segurança." },
    ],
  }),
  component: CheckoutPage,
});

function isCheckoutData(value: unknown): value is CheckoutData {
  if (!value || typeof value !== "object") return false;
  const checkout = value as Record<string, unknown>;
  return (
    typeof checkout.lead_id === "string" &&
    typeof checkout.nome === "string" &&
    typeof checkout.email === "string" &&
    typeof checkout.telefone_mascarado === "string" &&
    isFreelovablePlanId(checkout.plano) &&
    typeof checkout.nome_plano === "string" &&
    typeof checkout.valor === "number" &&
    Number.isFinite(checkout.valor)
  );
}

function isPaymentResponse(value: unknown): value is PaymentResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as { success?: unknown; payment?: Record<string, unknown> };
  return (
    response.success === true &&
    typeof response.payment?.id === "string" &&
    ["approved", "pending", "in_process", "rejected"].includes(String(response.payment.status)) &&
    (response.payment.qr_code === undefined || typeof response.payment.qr_code === "string") &&
    (response.payment.qr_code_base64 === undefined ||
      typeof response.payment.qr_code_base64 === "string")
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function installmentsLabel(checkout: CheckoutData) {
  const plan = FREELOVABLE_PLANS[checkout.plano];
  const installmentValue = checkout.valor / plan.maxParcelas;
  if (plan.maxParcelas === 1) return `1x de ${formatCurrency(checkout.valor)}`;
  return `até ${plan.maxParcelas}x sem acréscimo · ${plan.maxParcelas}x de ${formatCurrency(installmentValue)}`;
}

function redirectToThankYou(paymentId: string) {
  const thankYouUrl = new URL("/obrigado", window.location.origin);
  thankYouUrl.searchParams.set("payment_id", paymentId);
  window.location.href = thankYouUrl.toString();
}

function CheckoutPage() {
  const search = Route.useSearch();
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [brickReady, setBrickReady] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [brickError, setBrickError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("pix");
  const [pixCode, setPixCode] = useState("");
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [pixSubmitting, setPixSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const trackingStartedRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const pollingStartedAtRef = useRef<{ paymentId: string; startedAt: number } | null>(null);

  useEffect(() => {
    if (!search.lead_id || !search.plano) {
      setLoadError(true);
      return;
    }

    const controller = new AbortController();
    setLoadError(false);
    setCheckout(null);

    void fetch(`/api/public/dados-checkout?lead_id=${encodeURIComponent(search.lead_id)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok || !body || typeof body !== "object") {
          throw new Error("checkout_unavailable");
        }
        const payload = body as { success?: unknown; checkout?: unknown };
        if (payload.success !== true || !isCheckoutData(payload.checkout)) {
          throw new Error("unexpected_response");
        }
        setCheckout(payload.checkout);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setLoadError(true);
      });

    return () => controller.abort();
  }, [search.lead_id, search.plano]);

  useEffect(() => {
    if (!checkout || !MERCADO_PAGO_PUBLIC_KEY) return;
    try {
      if (initializedPublicKey !== MERCADO_PAGO_PUBLIC_KEY) {
        initMercadoPago(MERCADO_PAGO_PUBLIC_KEY, { locale: "pt-BR" });
        initializedPublicKey = MERCADO_PAGO_PUBLIC_KEY;
      }
      setSdkReady(true);
    } catch {
      setBrickError("Não foi possível carregar o pagamento seguro. Tente novamente mais tarde.");
    }
  }, [checkout]);

  useEffect(() => {
    if (
      !checkout ||
      !paymentId ||
      (paymentStatus !== "pending" && paymentStatus !== "in_process")
    ) {
      return;
    }

    if (pollingStartedAtRef.current?.paymentId !== paymentId) {
      pollingStartedAtRef.current = { paymentId, startedAt: Date.now() };
      setPollingTimedOut(false);
    }

    const controller = new AbortController();
    let timer: number | undefined;
    const poll = async () => {
      const startedAt = pollingStartedAtRef.current?.startedAt ?? Date.now();
      if (Date.now() - startedAt >= 2 * 60 * 1000) {
        setPollingTimedOut(true);
        return;
      }

      try {
        const query = new URLSearchParams({
          payment_id: paymentId,
          lead_id: checkout.lead_id,
        });
        const response = await fetch(`/api/public/status-pagamento-mp?${query.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json().catch(() => null);
        if (
          response.ok &&
          body &&
          typeof body === "object" &&
          (body as { success?: unknown }).success === true
        ) {
          const payment = (body as { payment?: { id?: unknown; status?: unknown } }).payment;
          if (
            payment?.id === paymentId &&
            typeof payment.status === "string" &&
            [
              "approved",
              "pending",
              "in_process",
              "rejected",
              "cancelled",
              "refunded",
              "charged_back",
            ].includes(payment.status)
          ) {
            const status = payment.status as PaymentStatus;
            setPaymentStatus(status);
            if (status === "approved") {
              redirectToThankYou(paymentId);
              return;
            }
            if (status === "rejected" || status === "cancelled") {
              idempotencyKeyRef.current = crypto.randomUUID();
              return;
            }
            if (status === "refunded" || status === "charged_back") return;
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }

      timer = window.setTimeout(poll, 4000);
    };

    timer = window.setTimeout(poll, 4000);
    return () => {
      controller.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, [checkout, paymentId, paymentStatus]);

  useEffect(() => {
    if (!checkout || trackingStartedRef.current === checkout.lead_id) return;
    trackingStartedRef.current = checkout.lead_id;

    void fetch("/api/public/marcar-checkout-mp-iniciado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: checkout.lead_id }),
    }).catch(() => {
      // A telemetria de funil não deve impedir o comprador de visualizar o checkout.
    });

    const storageKey = `meta_ic_${checkout.lead_id}`;
    let attempts = 0;
    const tryTrack = () => {
      attempts += 1;
      try {
        if (sessionStorage.getItem(storageKey)) return true;
        if (typeof window.fbq !== "function") return false;
        window.fbq(
          "track",
          "InitiateCheckout",
          {
            content_ids: [checkout.plano],
            content_type: "product",
            content_name: `FreeLovable - ${checkout.nome_plano}`,
            value: checkout.valor,
            currency: "BRL",
            num_items: 1,
          },
          { eventID: `ic_${checkout.lead_id}` },
        );
        sessionStorage.setItem(storageKey, "1");
        return true;
      } catch {
        return true;
      }
    };

    if (tryTrack()) return;
    const pixelTimer = window.setInterval(() => {
      if (tryTrack() || attempts >= 20) window.clearInterval(pixelTimer);
    }, 250);

    return () => window.clearInterval(pixelTimer);
  }, [checkout]);

  const handlePayment = useCallback(
    async (formData: CardPaymentFormData) => {
      if (!checkout || submittingRef.current) return;
      submittingRef.current = true;
      setBrickError(null);
      setPaymentStatus(null);

      const requestBody = {
        lead_id: checkout.lead_id,
        token: formData.token,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id || null,
        installments: formData.installments,
        payer: {
          ...(formData.payer?.email ? { email: formData.payer.email } : {}),
          ...(formData.payer?.identification
            ? { identification: formData.payer.identification }
            : {}),
        },
        idempotency_key: idempotencyKeyRef.current,
      };

      try {
        const response = await fetch("/api/public/processar-pagamento-mp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok || !isPaymentResponse(body)) {
          throw new Error("payment_failed");
        }

        setPaymentId(body.payment.id);
        setPaymentStatus(body.payment.status);

        if (body.payment.status === "approved") {
          window.setTimeout(() => {
            redirectToThankYou(body.payment.id);
          }, 900);
          return;
        }

        if (body.payment.status === "rejected") {
          idempotencyKeyRef.current = crypto.randomUUID();
        }
      } catch {
        setBrickError(
          "Não foi possível processar o pagamento. Confira os dados e tente novamente.",
        );
        throw new Error("payment_failed");
      } finally {
        submittingRef.current = false;
      }
    },
    [checkout],
  );

  const handlePixPayment = useCallback(async () => {
    if (!checkout || submittingRef.current) return;
    submittingRef.current = true;
    setPixSubmitting(true);
    setBrickError(null);
    setPaymentStatus(null);

    try {
      const response = await fetch("/api/public/processar-pagamento-mp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: checkout.lead_id,
          payment_method_id: "pix",
          payer: { email: checkout.email },
          idempotency_key: idempotencyKeyRef.current,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !isPaymentResponse(body)) {
        const payload =
          body && typeof body === "object"
            ? (body as { details?: unknown; error?: unknown })
            : null;
        throw new Error(
          String(payload?.details || payload?.error || "Não foi possível gerar o Pix."),
        );
      }
      if (!body.payment.qr_code || !body.payment.qr_code_base64) {
        throw new Error("O Mercado Pago não retornou o QR Code do Pix.");
      }
      setPaymentId(body.payment.id);
      setPaymentStatus(body.payment.status);
      setPixCode(body.payment.qr_code);
      setPixQrCodeBase64(body.payment.qr_code_base64);
    } catch (error) {
      idempotencyKeyRef.current = crypto.randomUUID();
      setBrickError(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível gerar o Pix. Tente novamente.",
      );
    } finally {
      submittingRef.current = false;
      setPixSubmitting(false);
    }
  }, [checkout]);

  const copyPixCode = useCallback(async () => {
    if (!pixCode) return;
    await navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
    window.setTimeout(() => setPixCopied(false), 2500);
  }, [pixCode]);

  const cardInitialization = useMemo(
    () => ({
      amount: checkout?.valor ?? 0,
      payer: { email: checkout?.email ?? "" },
    }),
    [checkout?.email, checkout?.valor],
  );
  const cardCustomization = useMemo(
    () => ({
      paymentMethods: {
        minInstallments: 1,
        maxInstallments: checkout ? FREELOVABLE_PLANS[checkout.plano].maxParcelas : 1,
        types: { included: ["credit_card" as const] },
      },
      visual: { style: { theme: "dark" } },
    }),
    [checkout],
  );
  const handleBrickReady = useCallback(() => setBrickReady(true), []);
  const handleBrickError = useCallback(
    () =>
      setBrickError("Não foi possível carregar o pagamento seguro. Tente novamente mais tarde."),
    [],
  );

  if (loadError) return <CheckoutError />;
  if (!checkout) return <CheckoutLoading />;

  const trustedPlan = FREELOVABLE_PLANS[checkout.plano];
  const publicKeyMissing = !MERCADO_PAGO_PUBLIC_KEY;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link to="/" className="flex items-center gap-3" aria-label="Voltar ao FreeLovable">
            <img
              src="/freelovable-logo-interface-160.webp"
              alt=""
              className="h-11 w-11 rounded-xl object-cover"
            />
            <span className="text-xl font-extrabold text-gradient">FreeLovable</span>
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <ShieldCheck className="h-5 w-5" /> Pagamento seguro
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-pink">
                Resumo do pedido
              </p>
              <h1 className="mt-3 text-2xl font-extrabold">{checkout.nome_plano}</h1>
              <div className="mt-5 space-y-3 border-y border-white/10 py-5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Período de acesso</span>
                  <strong>{trustedPlan.periodo}</strong>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <span className="text-muted-foreground">Total</span>
                  <strong className="text-2xl">{formatCurrency(checkout.valor)}</strong>
                </div>
                <p className="text-right text-xs font-semibold text-brand-pink">
                  {installmentsLabel(checkout)}
                </p>
              </div>
              <div className="mt-5 flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                Compra única, sem renovação ou cobrança recorrente.
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-bold">Dados do comprador</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Nome</dt>
                  <dd className="mt-0.5 font-semibold">{checkout.nome}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">E-mail</dt>
                  <dd className="mt-0.5 break-all font-semibold">{checkout.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Telefone</dt>
                  <dd className="mt-0.5 font-semibold">{checkout.telefone_mascarado}</dd>
                </div>
              </dl>
            </section>
          </aside>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold">Forma de pagamento</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pagamento processado com segurança pelo Mercado Pago
              </p>
            </div>

            <div
              className="mb-6 grid grid-cols-2 gap-3"
              role="radiogroup"
              aria-label="Forma de pagamento"
            >
              <button
                type="button"
                role="radio"
                aria-checked={paymentType === "pix"}
                onClick={() => setPaymentType("pix")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  paymentType === "pix"
                    ? "border-brand-pink bg-brand-pink/10 text-white"
                    : "border-white/10 bg-black/20 text-muted-foreground"
                }`}
              >
                <QrCode className="h-4 w-4" /> Pix
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={paymentType === "credit_card"}
                onClick={() => setPaymentType("credit_card")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  paymentType === "credit_card"
                    ? "border-brand-pink bg-brand-pink/10 text-white"
                    : "border-white/10 bg-black/20 text-muted-foreground"
                }`}
              >
                <CreditCard className="h-4 w-4" /> Cartão
              </button>
            </div>

            {paymentType === "pix" ? (
              pixCode ? (
                <div className="space-y-4 text-center">
                  <img
                    src={`data:image/png;base64,${pixQrCodeBase64}`}
                    alt="QR Code Pix"
                    className="mx-auto w-full max-w-64 rounded-xl bg-white p-3"
                  />
                  <p className="text-sm font-bold text-blue-200">Aguardando pagamento</p>
                  <textarea
                    readOnly
                    value={pixCode}
                    aria-label="Código Pix copia e cola"
                    className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => void copyPixCode()}
                    className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
                  >
                    <Copy className="h-4 w-4" />
                    {pixCopied ? "Código copiado" : "Copiar código Pix"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={pixSubmitting}
                  onClick={() => void handlePixPayment()}
                  className="btn-gradient w-full rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pixSubmitting ? "Gerando Pix..." : "Gerar QR Code Pix"}
                </button>
              )
            ) : publicKeyMissing ? (
              <PaymentMessage tone="error">
                O pagamento está temporariamente indisponível. Tente novamente mais tarde.
              </PaymentMessage>
            ) : sdkReady ? (
              <div id="mercado-pago-card-payment-brick-container" aria-busy={!brickReady}>
                {!brickReady && !brickError && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Carregando pagamento seguro...
                  </p>
                )}
                <CardPayment
                  id={`card-payment-${checkout.lead_id}`}
                  locale="pt-BR"
                  initialization={cardInitialization}
                  customization={cardCustomization}
                  onReady={handleBrickReady}
                  onError={handleBrickError}
                  onSubmit={handlePayment}
                />
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Carregando pagamento seguro...
              </p>
            )}

            {paymentStatus === "approved" && (
              <PaymentMessage tone="success">
                Pagamento aprovado. Preparando seu acesso...
              </PaymentMessage>
            )}
            {(paymentStatus === "pending" || paymentStatus === "in_process") && (
              <PaymentMessage tone="info">
                {pollingTimedOut
                  ? "Seu pagamento ainda está sendo analisado. Você pode aguardar a confirmação ou verificar novamente em alguns instantes."
                  : "Seu pagamento está sendo analisado. Aguarde a confirmação antes de fechar esta página."}
                {paymentId ? ` Identificação: ${paymentId}.` : ""}
              </PaymentMessage>
            )}
            {(paymentStatus === "rejected" || paymentStatus === "cancelled") && (
              <PaymentMessage tone="error">
                Pagamento não aprovado. Confira os dados do cartão ou tente outro cartão.
              </PaymentMessage>
            )}
            {(paymentStatus === "refunded" || paymentStatus === "charged_back") && (
              <PaymentMessage tone="error">
                Este pagamento não está mais aprovado. Entre em contato com o suporte se precisar de
                ajuda.
              </PaymentMessage>
            )}
            {brickError && <PaymentMessage tone="error">{brickError}</PaymentMessage>}

            {paymentType === "credit_card" && (
              <div className="mt-5 flex items-start gap-3 rounded-xl bg-black/20 p-4 text-xs leading-relaxed text-muted-foreground">
                <LockKeyhole className="h-4 w-4 shrink-0 text-brand-pink" />
                Seus dados completos de cartão são coletados e tokenizados pelo Mercado Pago e não
                passam pelos servidores do FreeLovable.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function PaymentMessage({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "info" | "error";
}) {
  const classes =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "info"
        ? "border-blue-500/30 bg-blue-500/10 text-blue-200"
        : "border-red-500/30 bg-red-500/10 text-red-200";
  return <div className={`mt-4 rounded-xl border p-4 text-sm ${classes}`}>{children}</div>;
}

function CheckoutLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-brand-pink" />
        <p className="mt-4 text-sm text-muted-foreground">Carregando seu checkout...</p>
      </div>
    </main>
  );
}

function CheckoutError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <img
          src="/freelovable-logo-interface-160.webp"
          alt=""
          className="mx-auto h-12 w-12 rounded-xl object-cover"
        />
        <h1 className="mt-5 text-2xl font-extrabold">Não foi possível carregar seu checkout.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Volte à página anterior e tente novamente.
        </p>
        <Link
          to="/"
          className="btn-gradient mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-bold"
        >
          Voltar à página inicial
        </Link>
      </section>
    </main>
  );
}
