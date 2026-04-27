import type { OfferteResult } from "./pricing-engine";

export interface FormData {
  from_street: string;
  from_plz: string;
  from_city: string;
  from_lift: string;
  from_etage: string;
  from_zimmer: string;
  from_flaeche: string;
  to_street: string;
  to_plz: string;
  to_city: string;
  to_lift: string;
  to_etage: string;
  to_zimmer: string;
  bemerkungen: string;
  moving_date: string;
  firma: string;
  anrede: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  services: string[];
}

function chf(n: number): string {
  return "CHF " + Math.round(n).toLocaleString("de-CH");
}

function safe(v: string | undefined | null): string {
  return (v || "").toString().replace(/[<>&]/g, function (c) {
    return c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;";
  });
}

function formatDateDe(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return iso || "";
  try {
    return new Date(iso).toLocaleDateString("de-CH", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return iso;
  }
}

function buildBreakdownHtml(result: OfferteResult): string {
  return result.lines
    .map(function (l) {
      const sign = l.amount < 0 ? "−" : "";
      return (
        '<tr>' +
        '<td style="padding:6px 12px 6px 0;color:#475569;font-size:14px;">' +
        safe(l.label) +
        "</td>" +
        '<td style="padding:6px 0;text-align:right;color:#0f172a;font-weight:600;font-size:14px;white-space:nowrap;">' +
        sign +
        chf(Math.abs(l.amount)) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

function buildBreakdownText(result: OfferteResult): string {
  return result.lines
    .map(function (l) {
      const sign = l.amount < 0 ? "-" : " ";
      return "  " + sign + chf(Math.abs(l.amount)) + "  " + l.label;
    })
    .join("\n");
}

export function customerEmail(data: FormData, result: OfferteResult) {
  const subject =
    "Ihre Richt-Offerte " + result.offerteNr + " – Bari Umzüge";

  const movingDateFmt = formatDateDe(data.moving_date);
  const wa =
    "https://wa.me/41000000000?text=" +
    encodeURIComponent(
      "Hallo Bari Umzüge, ich habe Offerte " +
        result.offerteNr +
        " erhalten und hätte noch Fragen..."
    );

  const besichtigungMailto =
    "mailto:info@bari-umzuege.ch?subject=" +
    encodeURIComponent(
      "Besichtigungstermin für Offerte " + result.offerteNr
    ) +
    "&body=" +
    encodeURIComponent(
      "Guten Tag\n\nIch möchte einen Besichtigungstermin für Offerte " +
        result.offerteNr +
        " vereinbaren, um einen verbindlichen Festpreis zu erhalten.\n\nFreundliche Grüsse\n" +
        (data.vorname || "") +
        " " +
        (data.nachname || "")
    );

  const html =
    '<!doctype html><html lang="de-CH"><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">' +
    "<tr><td>" +
    '<table role="presentation" align="center" cellpadding="0" cellspacing="0" width="600" style="background:#ffffff;border-radius:16px;max-width:600px;width:100%;">' +
    // Header
    '<tr><td style="padding:32px 32px 16px 32px;border-bottom:1px solid #e2e8f0;">' +
    '<p style="margin:0;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Bari Umzüge</p>' +
    '<h1 style="margin:8px 0 0 0;font-size:24px;color:#0F4C75;">Ihre Richt-Offerte ' +
    safe(result.offerteNr) +
    "</h1>" +
    "</td></tr>" +
    // Greeting
    '<tr><td style="padding:24px 32px 8px 32px;">' +
    '<p style="margin:0;font-size:16px;line-height:1.6;">' +
    "Guten Tag " +
    safe(data.anrede) +
    " " +
    safe(data.vorname) +
    " " +
    safe(data.nachname) +
    "</p>" +
    '<p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:#334155;">' +
    "Vielen Dank für Ihre Anfrage. Hier Ihre kostenlose Richt-Offerte basierend auf Ihren Angaben — Aufpreise möglich bei zusätzlichem Aufwand vor Ort:" +
    "</p>" +
    "</td></tr>" +
    // Range
    '<tr><td style="padding:8px 32px;">' +
    '<div style="background:#B8E8DD;border-radius:12px;padding:24px;text-align:center;margin-top:8px;">' +
    '<p style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#008772;font-weight:600;">Richtpreis-Range</p>' +
    '<p style="margin:8px 0 0 0;font-size:32px;font-weight:800;color:#0F4C75;">' +
    chf(result.rangeMin) +
    " – " +
    chf(result.rangeMax) +
    "</p>" +
    '<p style="margin:6px 0 0 0;font-size:12px;color:#475569;">' +
    safe(result.vatNote) +
    "</p>" +
    "</div></td></tr>" +
    // Move details
    '<tr><td style="padding:24px 32px 8px 32px;">' +
    '<h2 style="margin:0 0 12px 0;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Ihre Angaben</h2>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6;">' +
    '<tr><td style="color:#64748b;width:40%;">Auszug</td><td style="color:#0f172a;">' +
    safe(data.from_street) +
    ", " +
    safe(data.from_plz) +
    " " +
    safe(data.from_city) +
    "</td></tr>" +
    '<tr><td style="color:#64748b;">Einzug</td><td style="color:#0f172a;">' +
    safe(data.to_street) +
    ", " +
    safe(data.to_plz) +
    " " +
    safe(data.to_city) +
    "</td></tr>" +
    '<tr><td style="color:#64748b;">Datum</td><td style="color:#0f172a;">' +
    safe(movingDateFmt) +
    "</td></tr>" +
    '<tr><td style="color:#64748b;">Wohnung</td><td style="color:#0f172a;">' +
    safe(data.from_zimmer) +
    " Zimmer · " +
    safe(data.from_flaeche) +
    " m² · ~" +
    result.volume +
    " m³</td></tr>" +
    '<tr><td style="color:#64748b;">Aufwand</td><td style="color:#0f172a;">' +
    result.movers +
    " Mann · " +
    result.hours +
    " Std.</td></tr>" +
    "</table></td></tr>" +
    // Breakdown
    '<tr><td style="padding:24px 32px 8px 32px;">' +
    '<h2 style="margin:0 0 12px 0;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Aufschlüsselung</h2>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    buildBreakdownHtml(result) +
    "</table>" +
    "</td></tr>" +
    // Disclaimer
    '<tr><td style="padding:24px 32px;">' +
    '<div style="background:#f8fafc;border-radius:12px;padding:16px;font-size:13px;line-height:1.6;color:#475569;">' +
    '<strong style="color:#0f172a;">Wichtig zu wissen.</strong> Diese Offerte ist eine <strong>Richt-Offerte mit ±15% Spielraum</strong>. Der finale Preis wird am Umzugstag bestätigt. Aufpreise können entstehen, wenn vor Ort zusätzlicher Aufwand nötig ist (z.B. enge Treppenhäuser, längere Tragwege, mehr Volumen als angegeben). Wir kommunizieren jeden Aufpreis transparent — keine versteckten Kosten.' +
    "</div></td></tr>" +
    // Festpreis CTA (Premium-Pfad: Besichtigung)
    '<tr><td style="padding:8px 32px;">' +
    '<div style="background:#0F4C75;border-radius:12px;padding:20px;text-align:center;">' +
    '<p style="margin:0 0 12px 0;color:#ffffff;font-weight:700;font-size:15px;line-height:1.4;">Möchten Sie absolute Preissicherheit?</p>' +
    '<p style="margin:0 0 14px 0;color:#cbd5e1;font-size:13px;line-height:1.5;">Vereinbaren Sie eine kostenlose Besichtigung — danach garantieren wir Ihnen einen verbindlichen Festpreis.</p>' +
    '<a href="' +
    besichtigungMailto +
    '" style="display:inline-block;background:#00A88E;color:#0F4C75;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">Termin für Besichtigung vereinbaren →</a>' +
    "</div></td></tr>" +
    // Sekundär-CTAs
    '<tr><td style="padding:16px 32px 32px 32px;">' +
    '<a href="' +
    wa +
    '" style="display:inline-block;background:#00A88E;color:#0F4C75;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;margin-right:8px;">📱 Per WhatsApp besprechen</a>' +
    '<a href="tel:+41000000000" style="display:inline-block;background:#0F4C75;color:#ffffff;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">📞 +41 00 000 00 00</a>' +
    "</td></tr>" +
    // Tip
    '<tr><td style="padding:0 32px 24px 32px;">' +
    '<p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">' +
    "<strong>Tipp:</strong> Schicken Sie uns Wohnungsfotos an " +
    '<a href="mailto:info@bari-umzuege.ch" style="color:#0F4C75;">info@bari-umzuege.ch</a> — damit wird die finale Offerte bei der Besichtigung noch präziser.' +
    "</p></td></tr>" +
    // Footer
    '<tr><td style="padding:24px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;border-radius:0 0 16px 16px;">' +
    '<p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">' +
    "Bari Umzüge GmbH · [BARI-ADRESSE-PLATZHALTER], [BARI-PLZ-PLATZHALTER] · " +
    '<a href="mailto:info@bari-umzuege.ch" style="color:#0F4C75;">info@bari-umzuege.ch</a>' +
    "</p></td></tr>" +
    "</table>" +
    "</td></tr></table></body></html>";

  const text =
    "Ihre Richt-Offerte " +
    result.offerteNr +
    " – Bari Umzüge\n" +
    "===\n\n" +
    "Guten Tag " +
    data.anrede +
    " " +
    data.vorname +
    " " +
    data.nachname +
    "\n\n" +
    "Vielen Dank für Ihre Anfrage. Hier Ihre kostenlose Richt-Offerte basierend auf Ihren Angaben — Aufpreise möglich bei zusätzlichem Aufwand vor Ort:\n\n" +
    "RICHTPREIS-RANGE: " +
    chf(result.rangeMin) +
    " – " +
    chf(result.rangeMax) +
    "\n" +
    result.vatNote +
    "\n\n" +
    "IHRE ANGABEN\n" +
    "Auszug:  " + data.from_street + ", " + data.from_plz + " " + data.from_city + "\n" +
    "Einzug:  " + data.to_street + ", " + data.to_plz + " " + data.to_city + "\n" +
    "Datum:   " + movingDateFmt + "\n" +
    "Wohnung: " + data.from_zimmer + " Zi · " + data.from_flaeche + " m² · ~" + result.volume + " m³\n" +
    "Aufwand: " + result.movers + " Mann · " + result.hours + " Std.\n\n" +
    "AUFSCHLÜSSELUNG\n" +
    buildBreakdownText(result) +
    "\n\n" +
    "WICHTIG ZU WISSEN\n" +
    "Diese Offerte ist eine Richt-Offerte mit ±15% Spielraum. Der finale Preis wird am Umzugstag bestätigt. Aufpreise können entstehen, wenn vor Ort zusätzlicher Aufwand nötig ist (z.B. enge Treppenhäuser, längere Tragwege, mehr Volumen als angegeben). Wir kommunizieren jeden Aufpreis transparent — keine versteckten Kosten.\n\n" +
    "FESTPREIS GEWÜNSCHT?\n" +
    "Vereinbaren Sie eine kostenlose Besichtigung — danach garantieren wir Ihnen einen verbindlichen Festpreis:\n" +
    besichtigungMailto + "\n\n" +
    "Tipp: Schicken Sie uns Wohnungsfotos an info@bari-umzuege.ch — damit wird die finale Offerte präziser.\n\n" +
    "Per WhatsApp besprechen: " + wa + "\n" +
    "Telefon: +41 00 000 00 00\n\n" +
    "—\n" +
    "Bari Umzüge GmbH · [BARI-ADRESSE-PLATZHALTER], [BARI-PLZ-PLATZHALTER]\n" +
    "info@bari-umzuege.ch";

  return { subject, html, text };
}

export function adminEmail(data: FormData, result: OfferteResult) {
  const subject =
    "Neue Offerte " +
    result.offerteNr +
    " – " +
    data.vorname +
    " " +
    data.nachname;

  const movingDateFmt = formatDateDe(data.moving_date);

  const html =
    '<!doctype html><html><head><meta charset="utf-8"></head>' +
    '<body style="font-family:Inter,Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px;">' +
    '<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">' +
    '<h1 style="margin:0 0 8px 0;font-size:22px;color:#0F4C75;">Neue Offerten-Anfrage · ' +
    safe(result.offerteNr) +
    "</h1>" +
    '<p style="margin:0;color:#64748b;font-size:14px;">Eingegangen via bari-umz-ge.vercel.app/offerte</p>' +
    '<div style="background:#B8E8DD;border-radius:8px;padding:16px;margin-top:16px;">' +
    '<p style="margin:0;font-size:13px;color:#008772;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Richtpreis-Range</p>' +
    '<p style="margin:4px 0 0 0;font-size:24px;font-weight:800;color:#0F4C75;">' +
    chf(result.rangeMin) +
    " – " +
    chf(result.rangeMax) +
    " (Center: " +
    chf(result.rangeCenter) +
    ")</p>" +
    "</div>" +
    '<h2 style="font-size:14px;color:#64748b;text-transform:uppercase;margin:24px 0 8px;">Kunde</h2>' +
    '<table cellpadding="6" style="font-size:14px;width:100%;">' +
    '<tr><td style="color:#64748b;width:35%;">Name</td><td>' +
    safe(data.anrede) +
    " " +
    safe(data.vorname) +
    " " +
    safe(data.nachname) +
    "</td></tr>" +
    '<tr><td style="color:#64748b;">Firma</td><td>' +
    safe(data.firma || "—") +
    "</td></tr>" +
    '<tr><td style="color:#64748b;">E-Mail</td><td><a href="mailto:' +
    safe(data.email) +
    '">' +
    safe(data.email) +
    "</a></td></tr>" +
    '<tr><td style="color:#64748b;">Telefon</td><td><a href="tel:' +
    safe(data.telefon) +
    '">' +
    safe(data.telefon) +
    "</a></td></tr>" +
    "</table>" +
    '<h2 style="font-size:14px;color:#64748b;text-transform:uppercase;margin:24px 0 8px;">Auszug</h2>' +
    '<table cellpadding="6" style="font-size:14px;width:100%;">' +
    "<tr><td>" +
    safe(data.from_street) +
    ", " +
    safe(data.from_plz) +
    " " +
    safe(data.from_city) +
    "</td></tr>" +
    "<tr><td>" +
    safe(data.from_zimmer) +
    " Zi · " +
    safe(data.from_flaeche) +
    " m² · " +
    safe(data.from_etage) +
    ". Etage · Lift: " +
    safe(data.from_lift) +
    "</td></tr>" +
    "</table>" +
    '<h2 style="font-size:14px;color:#64748b;text-transform:uppercase;margin:24px 0 8px;">Einzug</h2>' +
    '<table cellpadding="6" style="font-size:14px;width:100%;">' +
    "<tr><td>" +
    safe(data.to_street) +
    ", " +
    safe(data.to_plz) +
    " " +
    safe(data.to_city) +
    "</td></tr>" +
    "<tr><td>" +
    safe(data.to_etage) +
    ". Etage · Lift: " +
    safe(data.to_lift) +
    " · Zimmer: " +
    safe(data.to_zimmer || "—") +
    "</td></tr>" +
    "<tr><td>Wunschdatum: " +
    safe(movingDateFmt) +
    "</td></tr>" +
    "</table>" +
    '<h2 style="font-size:14px;color:#64748b;text-transform:uppercase;margin:24px 0 8px;">Zusatzleistungen</h2>' +
    '<p style="font-size:14px;">' +
    (data.services && data.services.length
      ? safe(data.services.join(", "))
      : "—") +
    "</p>" +
    '<h2 style="font-size:14px;color:#64748b;text-transform:uppercase;margin:24px 0 8px;">Bemerkungen</h2>' +
    '<p style="font-size:14px;white-space:pre-wrap;">' +
    safe(data.bemerkungen || "—") +
    "</p>" +
    '<h2 style="font-size:14px;color:#64748b;text-transform:uppercase;margin:24px 0 8px;">Aufschlüsselung</h2>' +
    '<table width="100%" cellpadding="6" style="font-size:14px;">' +
    buildBreakdownHtml(result) +
    "</table>" +
    "</div></body></html>";

  const text =
    "NEUE OFFERTE " +
    result.offerteNr +
    "\n===\n\n" +
    "Richtpreis: " + chf(result.rangeMin) + " – " + chf(result.rangeMax) + "\n" +
    "(Center: " + chf(result.rangeCenter) + ")\n\n" +
    "KUNDE\n" +
    data.anrede + " " + data.vorname + " " + data.nachname + "\n" +
    "Firma: " + (data.firma || "—") + "\n" +
    data.email + "\n" +
    data.telefon + "\n\n" +
    "AUSZUG\n" +
    data.from_street + ", " + data.from_plz + " " + data.from_city + "\n" +
    data.from_zimmer + " Zi · " + data.from_flaeche + " m² · " + data.from_etage + ". OG · Lift: " + data.from_lift + "\n\n" +
    "EINZUG\n" +
    data.to_street + ", " + data.to_plz + " " + data.to_city + "\n" +
    data.to_etage + ". OG · Lift: " + data.to_lift + " · Zimmer: " + (data.to_zimmer || "—") + "\n" +
    "Datum: " + movingDateFmt + "\n\n" +
    "ZUSATZ\n" +
    (data.services && data.services.length ? data.services.join(", ") : "—") + "\n\n" +
    "BEMERKUNGEN\n" +
    (data.bemerkungen || "—") + "\n\n" +
    "AUFSCHLÜSSELUNG\n" +
    buildBreakdownText(result);

  return { subject, html, text };
}
