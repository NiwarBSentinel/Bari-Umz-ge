export type ProofAction = "zieht" | "ist gezogen" | "plant Umzug";

export interface ProofEntry {
  name: string;
  toCity: string;
  action: ProofAction;
}

export const socialProofPool: ProofEntry[] = [
  { name: "Max", toCity: "Zürich", action: "zieht" },
  { name: "Sandra", toCity: "Bern", action: "ist gezogen" },
  { name: "Familie Keller", toCity: "Winterthur", action: "zieht" },
  { name: "Marco", toCity: "Zürich", action: "plant Umzug" },
  { name: "Anita", toCity: "Luzern", action: "zieht" },
  { name: "Familie Schmid", toCity: "Frauenfeld", action: "ist gezogen" },
  { name: "Thomas", toCity: "Zürich", action: "zieht" },
  { name: "Lara", toCity: "Zug", action: "plant Umzug" },
  { name: "Stefan", toCity: "Schaffhausen", action: "zieht" },
  { name: "Familie Huber", toCity: "Winterthur", action: "ist gezogen" },
  { name: "Nina", toCity: "Basel", action: "plant Umzug" },
  { name: "Patrick", toCity: "Winterthur", action: "zieht" },
  { name: "Familie Meier", toCity: "Aarau", action: "ist gezogen" },
  { name: "Michelle", toCity: "Zürich", action: "zieht" },
  { name: "Daniel", toCity: "Uster", action: "plant Umzug" },
  { name: "Familie Brunner", toCity: "Zürich", action: "ist gezogen" },
  { name: "Eva", toCity: "Chur", action: "plant Umzug" },
  { name: "Roger", toCity: "Winterthur", action: "zieht" },
  { name: "Tanja", toCity: "Zürich", action: "plant Umzug" },
  { name: "Familie Frei", toCity: "Wetzikon", action: "ist gezogen" },
  { name: "Lukas", toCity: "Olten", action: "zieht" },
  { name: "Rebecca", toCity: "Zürich", action: "plant Umzug" },
  { name: "Familie Bürgi", toCity: "Bülach", action: "ist gezogen" },
  { name: "Andrea", toCity: "Zürich", action: "zieht" },
  { name: "Familie Zürcher", toCity: "Dietikon", action: "ist gezogen" },
];

export function formatProofText(entry: ProofEntry): string {
  switch (entry.action) {
    case "zieht":
      return `${entry.name} zieht nach ${entry.toCity}`;
    case "ist gezogen":
      return `${entry.name} ist nach ${entry.toCity} gezogen`;
    case "plant Umzug":
      return `${entry.name} plant Umzug nach ${entry.toCity}`;
  }
}
