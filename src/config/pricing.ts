// =============================================================================
// PRICING CONFIG · BARI UMZÜGE
// =============================================================================
// TODO: NIWAR – BARI-PREISE EINSETZEN
//
// Diese Datei ist die einzige Stelle, wo Preise/Aufschläge geändert werden.
// Werte sind Defaults aus dem Konzept-Sketch und MÜSSEN vor Production-
// Deploy überprüft / durch Bari finalisiert werden.
// =============================================================================

export const pricing = {
  // === Stundensätze ===
  hourlyRatePerMover: 70, // CHF/h pro Helfer            // TODO: Bari bestätigt

  // === LKW ===
  truckFlatSmall: 180, // 3.5 t Pauschale                  // TODO: Bari bestätigt
  truckFlatLarge: 280, // 7.5 t Pauschale (ab 25 m³)       // TODO: Bari bestätigt
  largeTruckThresholdM3: 25,

  // === Aufschläge ===
  noLiftSurchargePerFloor: 30, // CHF/Etage pro Helfer     // TODO: Bari bestätigt
  weekendSurchargePercent: 20, // % auf Subtotal           // TODO: Bari bestätigt

  // === Distanz ===
  distancePerKm: 1.5,
  freeKm: 20,

  // === Volumen-Berechnung ===
  minHours: 3,
  minMovers: 2,
  volumePerRoom: 9, // m³ pro Zimmer
  hoursPerCubicMeter: 0.125, // = 8 m³/h
  cubicMetersPerMover: 15, // = ein Helfer schafft 15 m³

  // === Range / MwSt ===
  rangePercent: 15, // ±15% um Richtpreis
  vatPercent: 8.1, // CH MwSt

  // === Add-Ons ===
  addOns: {
    packingBase: 200, //                                   // TODO: Bari bestätigt
    packingPerRoom: 50,
    furnitureAssemblyHourly: 80, //                        // TODO: Bari bestätigt
    storageNote: "auf Anfrage",
    disposal: 250, //                                      // TODO: Bari bestätigt
    cleaningPerSqm: 8, //                                  // TODO: Bari bestätigt
    cleaningDiscountPercent: 10,
  },

  // === Distanz-Pauschale (Sprint 1, ohne PLZ-API) ===
  // Gleiche PLZ-Region (erste 2 Ziffern identisch) → 0 km
  // Gleicher Kanton (erste Ziffer identisch) → 30 km
  // Anderer Kanton → 60 km
  distance: {
    sameRegionKm: 0,
    sameKantonOtherRegionKm: 30,
    differentKantonKm: 60,
  },
} as const;

export type PricingConfig = typeof pricing;
