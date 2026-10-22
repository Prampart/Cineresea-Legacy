export function calculatePrice(
  unitPrice: number,
  seats: number,
  tariff: string
): number {
  let unit = unitPrice;
  if (tariff === "STUDENT") {
    unit = Math.round(unit * 0.7);
  }
  let total = unit * seats;
  if (seats >= 4) {
    total = Math.round(total * 0.9);
  }
  return total;
}