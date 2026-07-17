import { createHash } from "node:crypto";
import { getServerEnv } from "@/lib/config.server";

export const META_PIXEL_ID = "1154397371091882";

type MetaCapiEvent = {
  eventName: "ViewContent" | "Purchase";
  eventId: string;
  externalId: string;
  eventSourceUrl: string;
  email?: string | null;
  phone?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  value?: number;
  currency?: string;
  contentName?: string;
  contentId?: string;
};

function sha256(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizedPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export async function sendMetaCapiEvent(event: MetaCapiEvent) {
  const accessToken = await getServerEnv("META_CAPI_ACCESS_TOKEN");
  if (!accessToken) {
    console.warn("[meta-capi] META_CAPI_ACCESS_TOKEN is not configured; event skipped");
    return { ok: false, skipped: true };
  }

  const externalId = event.externalId.trim();
  if (!externalId) {
    console.warn("[meta-capi] missing external_id; event skipped", { eventName: event.eventName });
    return { ok: false, skipped: true };
  }

  const userData: Record<string, string[] | string> = {
    external_id: [sha256(externalId)],
  };

  if (event.email) userData.em = [sha256(event.email)];
  if (event.phone) userData.ph = [sha256(normalizedPhone(event.phone))];
  if (event.fbp) userData.fbp = event.fbp;
  if (event.fbc) userData.fbc = event.fbc;
  if (event.clientIpAddress) userData.client_ip_address = event.clientIpAddress;
  if (event.clientUserAgent) userData.client_user_agent = event.clientUserAgent;

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: event.eventSourceUrl,
        user_data: userData,
        custom_data: {
          ...(event.contentName ? { content_name: event.contentName } : {}),
          ...(event.contentId ? { content_ids: [event.contentId], content_type: "product" } : {}),
          ...(event.value != null ? { value: event.value } : {}),
          ...(event.currency ? { currency: event.currency } : {}),
        },
      },
    ],
  };
  const graphVersion = (await getServerEnv("META_CAPI_GRAPH_VERSION")) || "v24.0";
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error("[meta-capi] event rejected", {
      eventName: event.eventName,
      eventId: event.eventId,
      status: response.status,
      body,
    });
    return { ok: false, skipped: false };
  }

  return { ok: true, skipped: false };
}
