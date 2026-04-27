import { pricing } from "../config/pricing";

export interface OfferteInput {
  fromPlz: string;
  fromEtage: string;
  fromLift: "ja" | "nein";
  fromZimmer: string;
  fromFlaeche: number;
  toPlz: string;
  toEtage: string;
  toLift: "ja" | "nein";
  movingDate: string;
  services: string[];
}

export interface OfferteLine {
  label: string;
  amount: number;
}

export interface OfferteResult {
  offerteNr: string;
  volume: number;
  movers: number;
  hours: number;
  distanceKm: number;
  rangeMin: number;
  rangeMax: number;
  rangeCenter: number;
  lines: OfferteLine[];
  vatNote: string;
}

function etageToFloors(et: string): number {
  if (et === "UG") return 0;
  if (et === "EG") return 0;
  if (et === "8+") return 8;
  const n = parseInt(et, 10);
  return isNaN(n) ? 0 : n;
}

function plzInfo(plz: string): { kanton: string; region: string } {
  const p = (plz || "").trim();
  if (!/^\d{4}$/.test(p)) return { kanton: "?", region: "??" };
  return { kanton: p.charAt(0), region: p.slice(0, 2) };
}

export function estimateDistanceKm(fromPlz: string, toPlz: string): number {
  const a = plzInfo(fromPlz);
  const b = plzInfo(toPlz);
  if (a.region === b.region) return pricing.distance.sameRegionKm;
  if (a.kanton === b.kanton) return pricing.distance.sameKantonOtherRegionKm;
  return pricing.distance.differentKantonKm;
}

export function isWeekend(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const d = new Date(isoDate + "T12:00:00");
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

export function generateOfferteNr(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BAR-${yyyy}${mm}${dd}-${rand}`;
}

function round50(n: number): number {
  return Math.round(n / 50) * 50;
}

export function computeOfferte(input: OfferteInput): OfferteResult {
  const cfg = pricing;

  // 1. Volumen
  const zimmerNum = parseFloat((input.fromZimmer || "1").replace("+", "")) || 1;
  const volByRoom = zimmerNum * cfg.volumePerRoom;
  const volByFlaeche = (input.fromFlaeche || 0) * 0.4;
  const volume = Math.max(volByRoom, volByFlaeche);

  // 2. Helfer + Stunden
  const movers = Math.max(
    cfg.minMovers,
    Math.ceil(volume / cfg.cubicMetersPerMover)
  );
  const hours = Math.max(cfg.minHours, Math.ceil(volume * cfg.hoursPerCubicMeter));

  // 3. Basispreis
  const basePrice = movers * hours * cfg.hourlyRatePerMover;

  // 4. LKW
  const truckFlat =
    volume >= cfg.largeTruckThresholdM3 ? cfg.truckFlatLarge : cfg.truckFlatSmall;
  const truckLabel =
    volume >= cfg.largeTruckThresholdM3 ? "LKW (7.5 t)" : "LKW (3.5 t)";

  // 5. Etagen-Aufschlag
  const fromFloors = etageToFloors(input.fromEtage);
  const toFloors = etageToFloors(input.toEtage);
  const noLiftFromCharge =
    input.fromLift === "nein" && fromFloors > 0
      ? fromFloors * cfg.noLiftSurchargePerFloor * movers
      : 0;
  const noLiftToCharge =
    input.toLift === "nein" && toFloors > 0
      ? toFloors * cfg.noLiftSurchargePerFloor * movers
      : 0;

  // 6. Distanz
  const distanceKm = estimateDistanceKm(input.fromPlz, input.toPlz);
  const billableKm = Math.max(0, distanceKm - cfg.freeKm);
  const distanceCharge = billableKm * cfg.distancePerKm;

  // 7. Add-Ons
  const services = input.services || [];
  let packing = 0;
  let furniture = 0;
  let disposal = 0;
  let cleaning = 0;
  let cleaningDiscount = 0;

  if (services.indexOf("Kartons ein- und auspacken") !== -1) {
    packing = cfg.addOns.packingBase + zimmerNum * cfg.addOns.packingPerRoom;
  }
  if (services.indexOf("Möbel Ab- und Aufbau") !== -1) {
    furniture = cfg.addOns.furnitureAssemblyHourly * Math.max(2, Math.ceil(hours / 2));
  }
  if (services.indexOf("Inkl. Entsorgung") !== -1) {
    disposal = cfg.addOns.disposal;
  }
  if (services.indexOf("Inkl. Umzugsreinigung") !== -1 && input.fromFlaeche > 0) {
    cleaning = cfg.addOns.cleaningPerSqm * input.fromFlaeche;
    cleaningDiscount = -cleaning * (cfg.addOns.cleaningDiscountPercent / 100);
  }

  // 8. Subtotal vor Wochenend
  let subtotalPreWeekend =
    basePrice +
    truckFlat +
    noLiftFromCharge +
    noLiftToCharge +
    distanceCharge +
    packing +
    furniture +
    disposal +
    cleaning +
    cleaningDiscount;

  // 9. Wochenend-Zuschlag
  const weekendSurcharge = isWeekend(input.movingDate)
    ? subtotalPreWeekend * (cfg.weekendSurchargePercent / 100)
    : 0;

  const subtotal = subtotalPreWeekend + weekendSurcharge;

  // 10. Range
  const rangeCenter = round50(subtotal);
  const rangeMin = round50(rangeCenter * (1 - cfg.rangePercent / 100));
  const rangeMax = round50(rangeCenter * (1 + cfg.rangePercent / 100));

  // 11. Breakdown lines
  const lines: OfferteLine[] = [
    {
      label: `${movers} Umzugshelfer × ${hours} h × CHF ${cfg.hourlyRatePerMover}`,
      amount: basePrice,
    },
    { label: truckLabel, amount: truckFlat },
  ];
  if (noLiftFromCharge > 0) {
    lines.push({
      label: `Etagen-Aufschlag Auszug (${fromFloors}. OG, kein Lift)`,
      amount: noLiftFromCharge,
    });
  }
  if (noLiftToCharge > 0) {
    lines.push({
      label: `Etagen-Aufschlag Einzug (${toFloors}. OG, kein Lift)`,
      amount: noLiftToCharge,
    });
  }
  if (distanceKm > 0) {
    lines.push({
      label: `Distanz (~${distanceKm} km, ${cfg.freeKm} km frei)`,
      amount: distanceCharge,
    });
  } else {
    lines.push({ label: "Distanz (gleiche Region)", amount: 0 });
  }
  if (packing > 0) lines.push({ label: "Kartons ein-/auspacken", amount: packing });
  if (furniture > 0)
    lines.push({ label: "Möbel Ab- und Aufbau", amount: furniture });
  if (disposal > 0) lines.push({ label: "Entsorgung", amount: disposal });
  if (cleaning > 0) {
    lines.push({
      label: `Endreinigung (${input.fromFlaeche} m²)`,
      amount: cleaning,
    });
    if (cleaningDiscount < 0) {
      lines.push({
        label: `Reinigungs-Rabatt (${cfg.addOns.cleaningDiscountPercent}%)`,
        amount: cleaningDiscount,
      });
    }
  }
  if (weekendSurcharge > 0) {
    lines.push({
      label: `Wochenend-Zuschlag (${cfg.weekendSurchargePercent}%)`,
      amount: weekendSurcharge,
    });
  }

  return {
    offerteNr: generateOfferteNr(),
    volume: Math.round(volume),
    movers,
    hours,
    distanceKm,
    rangeMin,
    rangeMax,
    rangeCenter,
    lines,
    vatNote: "Alle Preise inkl. MwSt. (" + cfg.vatPercent + "%)",
  };
}
