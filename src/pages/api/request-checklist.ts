export const prerender = false;

import type { APIRoute } from "astro";
import { Resend } from "resend";
import {
  checklistCustomerEmail,
  checklistAdminEmail,
  type ChecklistLeadData,
} from "../../lib/email-templates";

interface SubmitBody {
  email?: string;
  vorname?: string;
  consent?: boolean | string;
  _gotcha?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(code: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: code }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return jsonError("invalid_json", 400);
  }

  if (body._gotcha && String(body._gotcha).trim() !== "") {
    return jsonError("spam_detected", 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return jsonError("invalid_email", 400);
  }

  const consentTrue = body.consent === true || body.consent === "true";
  if (!consentTrue) {
    return jsonError("consent_required", 400);
  }

  const vorname = String(body.vorname || "").trim().slice(0, 80) || undefined;
  const data: ChecklistLeadData = { email, vorname };

  const apiKey = import.meta.env.RESEND_API_KEY;
  const recipient =
    import.meta.env.OFFERTE_RECIPIENT_EMAIL || "info@bari-umzuege.ch";
  const fromAddress =
    import.meta.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  let emailWarning: string | null = null;

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const customerMail = checklistCustomerEmail(data);
      const adminMail = checklistAdminEmail(data);

      const sends = await Promise.allSettled([
        resend.emails.send({
          from: fromAddress,
          to: email,
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
          replyTo: email,
        }),
      ]);

      const failed = sends.filter((s) => s.status === "rejected");
      if (failed.length > 0) {
        emailWarning = "some_failed";
        console.error("Checklist email send errors:", failed);
      }
    } catch (e) {
      emailWarning = "email_subsystem_unavailable";
      console.error("Resend init/send failed:", e);
    }
  } else {
    emailWarning = "resend_not_configured";
    console.warn("RESEND_API_KEY missing — checklist emails skipped");
  }

  return new Response(
    JSON.stringify({ ok: true, emailWarning }),
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
