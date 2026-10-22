import { describe, it, expect } from "vitest";
import { calculatePrice } from "../src/business/PriceCalculator";

// Les tests vérifient les prix attendus pour les cas normaux et les réductions.
describe("calculatePrice", () => {

  // Deux places au tarif normal coûtent deux fois le prix unitaire.
  it("prix normal", () => {
    expect(
      calculatePrice(1000, 2, "NORMAL")
    ).toBe(2000);
  });

  // Le tarif étudiant applique une réduction de 30 %.
  it("réduction étudiant", () => {
    expect(
      calculatePrice(1000, 1, "STUDENT")
    ).toBe(700);
  });

  // Quatre places déclenchent la réduction de groupe de 10 %.
  it("réduction groupe", () => {
    expect(
      calculatePrice(1000, 4, "NORMAL")
    ).toBe(3600);
  });

  // Les réductions étudiant et groupe s'appliquent successivement.
  it("étudiant + groupe", () => {
    expect(
      calculatePrice(1000, 4, "STUDENT")
    ).toBe(2520);
  });

});