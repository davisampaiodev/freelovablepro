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
  forma_pagamento: z.enum(["pix", "credit_card"]).optional().catch(undefined),
  preview: z.literal("1").optional().catch(undefined),
});

const BUILD_MERCADO_PAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY?.trim() ?? "";
let initializedPublicKey = "";

type CheckoutData = {
  session_id: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  plan: FreelovablePlanId;
  duration_days: number;
  value: number;
  status: string;
  payment_method: PaymentType | null;
  tracking?: Record<string, string>;
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
  external_reference?: string;
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
    typeof checkout.session_id === "string" &&
    typeof checkout.customer_name === "string" &&
    typeof checkout.customer_email === "string" &&
    typeof checkout.customer_whatsapp === "string" &&
    isFreelovablePlanId(checkout.plan) &&
    typeof checkout.duration_days === "number" &&
    typeof checkout.value === "number" &&
    Number.isFinite(checkout.value)
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
  const plan = FREELOVABLE_PLANS[checkout.plan];
  const installmentValue = checkout.value / plan.maxParcelas;
  if (plan.maxParcelas === 1) return `1x de ${formatCurrency(checkout.value)}`;
  return `até ${plan.maxParcelas}x sem acréscimo · ${plan.maxParcelas}x de ${formatCurrency(installmentValue)}`;
}

function redirectToThankYou(paymentId: string, externalReference: string) {
  const thankYouUrl = new URL("/obrigado", window.location.origin);
  thankYouUrl.searchParams.set("payment_id", paymentId);
  thankYouUrl.searchParams.set("external_reference", externalReference);
  window.location.href = thankYouUrl.toString();
}

function CheckoutPage() {
  const search = Route.useSearch();
  const isPreview = search.preview === "1" || (import.meta.env.DEV && !search.lead_id);
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [mercadoPagoPublicKey, setMercadoPagoPublicKey] = useState(
    BUILD_MERCADO_PAGO_PUBLIC_KEY,
  );
  const [publicKeyLoaded, setPublicKeyLoaded] = useState(Boolean(BUILD_MERCADO_PAGO_PUBLIC_KEY));
  const [loadError, setLoadError] = useState(false);
  const [brickReady, setBrickReady] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [brickError, setBrickError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>(search.forma_pagamento ?? "pix");
  const [pixCode, setPixCode] = useState("");
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [pixSubmitting, setPixSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [externalReference, setExternalReference] = useState<string | null>(null);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const trackingStartedRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const pollingStartedAtRef = useRef<{ paymentId: string; startedAt: number } | null>(null);

  useEffect(() => {
    if (isPreview) {
      const previewPlan = search.plano ?? "anual";
      const plan = FREELOVABLE_PLANS[previewPlan];
      setLoadError(false);
      setCheckout({
        session_id: "00000000-0000-4000-8000-000000000000",
        customer_name: "Davi",
        customer_email: "da***@exemplo.com",
        customer_whatsapp: "(**) *****-2026",
        plan: previewPlan,
        duration_days:
          previewPlan === "diario"
            ? 1
            : previewPlan === "mensal"
              ? 30
              : previewPlan === "trimestral"
                ? 90
                : 365,
        value: plan.valor,
        status: "pending",
        payment_method: search.forma_pagamento ?? "pix",
        tracking: {},
      });
      return;
    }

    if (!search.lead_id || !search.plano) {
      setLoadError(true);
      return;
    }
    try {
      const raw = sessionStorage.getItem(`freelovable_checkout_${search.lead_id}`);
      const stored = raw ? JSON.parse(raw) : null;
      if (
        !stored ||
        typeof stored.nome !== "string" ||
        typeof stored.email !== "string" ||
        typeof stored.telefone !== "string" ||
        stored.plano !== search.plano
      ) {
        throw new Error("checkout_unavailable");
      }
      const plan = FREELOVABLE_PLANS[search.plano];
      setCheckout({
        session_id: search.lead_id,
        customer_name: stored.nome,
        customer_email: stored.email,
        customer_whatsapp: stored.telefone,
        plan: search.plano,
        duration_days:
          search.plano === "diario"
            ? 1
            : search.plano === "mensal"
              ? 30
              : search.plano === "trimestral"
                ? 90
                : 365,
        value: plan.valor,
        status: "pending",
        payment_method: search.forma_pagamento ?? "pix",
        tracking: stored.tracking && typeof stored.tracking === "object" ? stored.tracking : {},
      });
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [isPreview, search.lead_id, search.plano, search.forma_pagamento]);

  useEffect(() => {
    if (BUILD_MERCADO_PAGO_PUBLIC_KEY) return;
    let active = true;
    void fetch("/api/public/mercado-pago-config")
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { public_key?: unknown } | null;
        if (active && typeof body?.public_key === "string") {
          setMercadoPagoPublicKey(body.public_key.trim());
        }
      })
      .finally(() => {
        if (active) setPublicKeyLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!checkout || !mercadoPagoPublicKey) return;
    try {
      if (initializedPublicKey !== mercadoPagoPublicKey) {
        initMercadoPago(mercadoPagoPublicKey, { locale: "pt-BR" });
        initializedPublicKey = mercadoPagoPublicKey;
      }
      setSdkReady(true);
    } catch {
      setBrickError("Não foi possível carregar o pagamento seguro. Tente novamente mais tarde.");
    }
  }, [checkout, mercadoPagoPublicKey]);

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
          external_reference: externalReference ?? checkout.session_id,
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
              redirectToThankYou(paymentId, externalReference ?? checkout.session_id);
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
  }, [checkout, externalReference, paymentId, paymentStatus]);

  useEffect(() => {
    if (isPreview || !checkout || trackingStartedRef.current === checkout.session_id) return;
    trackingStartedRef.current = checkout.session_id;

    const storageKey = `meta_ic_${checkout.session_id}`;
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
            content_ids: [checkout.plan],
            content_type: "product",
            content_name: `FreeLovable - ${FREELOVABLE_PLANS[checkout.plan].nome}`,
            value: checkout.value,
            currency: "BRL",
            num_items: 1,
          },
          { eventID: `ic_${checkout.session_id}` },
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
  }, [checkout, isPreview]);

  const handlePayment = useCallback(
    async (formData: CardPaymentFormData) => {
      if (!checkout || submittingRef.current) return;
      submittingRef.current = true;
      setBrickError(null);
      setPaymentStatus(null);

      const requestBody = {
        lead_id: checkout.session_id,
        plano: checkout.plan,
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
        customer: {
          name: checkout.customer_name,
          email: checkout.customer_email,
          phone: checkout.customer_whatsapp,
        },
        tracking: checkout.tracking,
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
        setExternalReference(body.external_reference ?? checkout.session_id);

        if (body.payment.status === "approved") {
          window.setTimeout(() => {
            redirectToThankYou(body.payment.id, body.external_reference ?? checkout.session_id);
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
          lead_id: checkout.session_id,
          plano: checkout.plan,
          payment_method_id: "pix",
          customer: {
            name: checkout.customer_name,
            email: checkout.customer_email,
            phone: checkout.customer_whatsapp,
          },
          tracking: checkout.tracking,
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
      setExternalReference(body.external_reference ?? checkout.session_id);
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
      amount: checkout?.value ?? 0,
    }),
    [checkout?.value],
  );
  const cardCustomization = useMemo(
    () => ({
      paymentMethods: {
        minInstallments: 1,
        maxInstallments: checkout ? FREELOVABLE_PLANS[checkout.plan].maxParcelas : 1,
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

  const trustedPlan = FREELOVABLE_PLANS[checkout.plan];
  const customerFirstName = checkout.customer_name.trim().split(/\s+/)[0] || "cliente";
  const publicKeyMissing = publicKeyLoaded && !mercadoPagoPublicKey;

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
              <p className="mt-3 text-sm text-muted-foreground">
                Olá,{" "}
                <span className="text-xl font-extrabold text-gradient">{customerFirstName}</span>!
                <span className="mt-1 block">Confira os detalhes do seu pedido:</span>
              </p>
              <h1 className="mt-4 text-2xl font-extrabold">{trustedPlan.nome}</h1>
              <div className="mt-5 space-y-3 border-y border-white/10 py-5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Período de acesso</span>
                  <strong>{trustedPlan.periodo}</strong>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <span className="text-muted-foreground">Total</span>
                  <strong className="text-2xl">{formatCurrency(checkout.value)}</strong>
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
                  <dd className="mt-0.5 font-semibold">{checkout.customer_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">E-mail</dt>
                  <dd className="mt-0.5 break-all font-semibold">{checkout.customer_email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Telefone</dt>
                  <dd className="mt-0.5 font-semibold">{checkout.customer_whatsapp}</dd>
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
                  disabled={pixSubmitting || isPreview}
                  onClick={() => void handlePixPayment()}
                  className="btn-gradient w-full rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPreview
                    ? "Gerar QR Code Pix"
                    : pixSubmitting
                      ? "Gerando Pix..."
                      : "Gerar QR Code Pix"}
                </button>
              )
            ) : isPreview ? (
              <div className="space-y-4" aria-label="Prévia do formulário de cartão">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Número do cartão
                  </label>
                  <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/40">
                    0000 0000 0000 0000
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                      Validade
                    </label>
                    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/40">
                      MM/AA
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                      Código de segurança
                    </label>
                    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/40">
                      CVV
                    </div>
                  </div>
                </div>
                <div className="btn-gradient w-full rounded-xl px-5 py-3 text-center text-sm font-bold opacity-60">
                  Pagar {formatCurrency(checkout.value)}
                </div>
              </div>
            ) : !publicKeyLoaded ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Carregando pagamento seguro...
              </p>
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
                  id={`card-payment-${checkout.session_id}`}
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
                Seus dados de cartão são tokenizados e criptografados pelo Mercado Pago.
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
