export const prerender = false;

import type { APIRoute } from "astro";
import { Resend } from "resend";
import { computeOfferte, type OfferteInput } from "../../lib/pricing-engine";
import {
  customerEmail,
  adminEmail,
  type FormData as OfferteFormData,
} from "../../lib/email-templates";

interface SubmitBody extends OfferteFormData {
  _gotcha?: string;
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.length > 0) return [v];
  return [];
}

export const POST: APIRoute = async ({ request }) => {
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Honeypot
  if (body._gotcha && String(body._gotcha).trim() !== "") {
    return new Response(JSON.stringify({ ok: false, error: "spam_detected" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Minimal validation
  const required = [
    "from_street",
    "from_plz",
    "from_city",
    "from_etage",
    "from_zimmer",
    "from_flaeche",
    "to_street",
    "to_plz",
    "to_city",
    "to_etage",
    "moving_date",
    "anrede",
    "vorname",
    "nachname",
    "email",
    "telefon",
  ] as const;
  for (const f of required) {
    if (!body[f as keyof SubmitBody]) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing_field:" + f }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  const services = asArray(body.services);
  body.services = services;

  // Compute
  const input: OfferteInput = {
    fromPlz: String(body.from_plz),
    fromEtage: String(body.from_etage),
    fromLift: (String(body.from_lift) === "nein" ? "nein" : "ja") as
      | "ja"
      | "nein",
    fromZimmer: String(body.from_zimmer),
    fromFlaeche: parseFloat(String(body.from_flaeche)) || 0,
    toPlz: String(body.to_plz),
    toEtage: String(body.to_etage),
    toLift: (String(body.to_lift) === "nein" ? "nein" : "ja") as "ja" | "nein",
    movingDate: String(body.moving_date),
    services,
  };
  const result = computeOfferte(input);

  // Send emails (best-effort; if RESEND_API_KEY missing, skip silently)
  const apiKey = import.meta.env.RESEND_API_KEY;
  const recipient =
    import.meta.env.OFFERTE_RECIPIENT_EMAIL || "info@bari-umzuege.ch";
  const fromAddress =
    import.meta.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  let emailWarning: string | null = null;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const customerMail = customerEmail(body, result);
      const adminMail = adminEmail(body, result);

      const sends = await Promise.allSettled([
        resend.emails.send({
          from: fromAddress,
          to: body.email,
          subject: customerMail.subject,
          html: customerMail.html,
          text: customerMail.text,
        }),
        resend.emails.send({
          from: fromAddress,
          to: recipient,
          subject: adminMail.subject,
          html: adminMail.html,
          text: adminMail.text,
          replyTo: body.email,
        }),
      ]);

      const failed = sends.filter((s) => s.status === "rejected");
      if (failed.length > 0) {
        emailWarning = "Some emails failed to send";
        console.error("Email send errors:", failed);
      }
    } catch (e) {
      emailWarning = "Email subsystem unavailable";
      console.error("Resend init/send failed:", e);
    }
  } else {
    emailWarning = "RESEND_API_KEY not configured — emails skipped";
    console.warn(emailWarning);
  }

  return new Response(
    JSON.stringify({ ok: true, result, emailWarning }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({ ok: false, error: "method_not_allowed" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
    }
  );
};
