import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { sendMetaCapiEvent } from "@/lib/meta-capi.server";

const bodySchema = z.object({
  event_name: z.literal("ViewContent"),
  event_id: z.string().min(1).max(128),
  external_id: z.string().min(1).max(256),
  event_source_url: z.string().url().max(2_048),
  fbp: z.string().max(256).optional(),
  fbc: z.string().max(256).optional(),
});

function clientIpAddress(request: Request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || null;
}

export const Route = createFileRoute("/api/public/meta-capi-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "invalid event" }, { status: 400 });

        const event = parsed.data;
        await sendMetaCapiEvent({
          eventName: event.event_name,
          eventId: event.event_id,
          externalId: event.external_id,
          eventSourceUrl: event.event_source_url,
          fbp: event.fbp,
          fbc: event.fbc,
          clientIpAddress: clientIpAddress(request),
          clientUserAgent: request.headers.get("user-agent"),
          contentId: "freelovable",
          contentName: "FreeLovable",
        });

        return Response.json({ ok: true });
      },
    },
  },
});
