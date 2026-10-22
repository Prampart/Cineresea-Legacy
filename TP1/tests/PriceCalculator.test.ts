import { describe, it, expect } from "vitest";
import { calculatePrice } from "../src/business/PriceCalculator";
describe("calculatePrice", () => {
  it("prix normal", () => {
    expect(
      calculatePrice(1000, 2, "NORMAL")
    ).toBe(2000);
  });
  it("réduction étudiant", () => {
    expect(
      calculatePrice(1000, 1, "STUDENT")
    ).toBe(700);
  });
  it("réduction groupe", () => {
    expect(
      calculatePrice(1000, 4, "NORMAL")
    ).toBe(3600);
  });
  it("étudiant + groupe", () => {
    expect(
      calculatePrice(1000, 4, "STUDENT")
    ).toBe(2520);
  });
});