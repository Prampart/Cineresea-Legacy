/*
?tape 3 - Contrat d'entr?e pour annuler une r?servation.
L'appelant fournit seulement l'identifiant de la r?servation. Le use case g?re ensuite la v?rification
m?tier et les effets de bord (?tat annul?, notification, etc.).
*/


import { Booking } from "../../../domain/Booking";

// Port entrant qui décrit l'opération d'annulation sans exposer son implémentation.
export interface CancelBooking {
  // Accepte une commande d'annulation et renvoie la réservation après sa mise à jour.
  execute(command: CancelBookingCommand): Promise<Booking>;
}

// Données minimales nécessaires pour identifier la réservation à annuler.
export class CancelBookingCommand {
  // L'identifiant est fourni par l'appelant, par exemple depuis l'URL de l'API.
  bookingId!: string;
}