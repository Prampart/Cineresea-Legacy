// Calcule le montant total d'une réservation; tous les montants sont en centimes.
export function calculatePrice(
  unitPrice: number,
  seats: number,
  tariff: string
): number {
  // Le prix par place commence au tarif normal de la séance.
  let unit = unitPrice;

  // Le tarif étudiant réduit le prix individuel de 30 %.
  if (tariff === "STUDENT") {
    unit = Math.round(unit * 0.7);
  }

  // Multiplie le prix par place par le nombre de places choisies.
  let total = unit * seats;

  // À partir de quatre places, applique une réduction supplémentaire de 10 %.
  if (seats >= 4) {
    total = Math.round(total * 0.9);
  }

  return total;
}