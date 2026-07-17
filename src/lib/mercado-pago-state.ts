export const MERCADO_PAGO_STATUSES = [
  "approved",
  "pending",
  "in_process",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
] as const;

export type MercadoPagoStatus = (typeof MERCADO_PAGO_STATUSES)[number];

export function isMercadoPagoStatus(value: string): value is MercadoPagoStatus {
  return (MERCADO_PAGO_STATUSES as readonly string[]).includes(value);
}

export function shouldIgnoreMercadoPagoEvent(args: {
  currentPaymentId: string | null;
  currentStatus: string;
  eventPaymentId: string;
  eventStatus: MercadoPagoStatus;
}) {
  const isCurrentPayment = !args.currentPaymentId || args.currentPaymentId === args.eventPaymentId;
  const isAlreadyApproved = args.currentStatus === "aprovado";
  const isPostApproval = args.eventStatus === "refunded" || args.eventStatus === "charged_back";

  return (
    (isAlreadyApproved && !isPostApproval && args.eventStatus !== "approved") ||
    (!isPostApproval && isAlreadyApproved && args.currentPaymentId !== args.eventPaymentId) ||
    (!isPostApproval && args.eventStatus !== "approved" && !isCurrentPayment) ||
    (isPostApproval && args.currentPaymentId !== args.eventPaymentId)
  );
}
